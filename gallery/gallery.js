(function () {
  var params = new URLSearchParams(location.search);
  var galleryId = params.get("id");
  var images = [];
  var selected = new Set();
  var downloading = false;

  var siteName = document.getElementById("site-name");
  var pageTitle = document.getElementById("page-title");
  var totalCount = document.getElementById("total-count");
  var selectedCount = document.getElementById("selected-count");
  var grid = document.getElementById("grid");
  var status = document.getElementById("status");
  var downloadBtn = document.getElementById("download");
  var lightbox = document.getElementById("lightbox");
  var lightboxImg = document.getElementById("lightbox-img");
  var lightboxCaption = document.getElementById("lightbox-caption");

  function setStatus(message) {
    status.hidden = !message;
    status.textContent = message || "";
  }

  function updateCounts() {
    totalCount.textContent = String(images.length);
    selectedCount.textContent = String(selected.size);
    downloadBtn.disabled = downloading || selected.size === 0;
    downloadBtn.textContent = selected.size ? "下载所选（" + selected.size + "）" : "下载所选";
  }

  function renderEmpty(message) {
    grid.innerHTML = "";
    var p = document.createElement("p");
    p.className = "empty";
    p.textContent = message;
    grid.appendChild(p);
  }

  function render() {
    grid.innerHTML = "";
    if (!images.length) {
      renderEmpty("未找到可下载的商品图片");
      updateCounts();
      return;
    }

    images.forEach(function (url, index) {
      var card = document.createElement("article");
      card.className = "card" + (selected.has(url) ? " selected" : "");

      var badge = document.createElement("span");
      badge.className = "index";
      badge.textContent = String(index + 1);

      var checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "check";
      checkbox.checked = selected.has(url);
      checkbox.setAttribute("aria-label", "选择第 " + (index + 1) + " 张");
      checkbox.addEventListener("change", function () {
        if (checkbox.checked) selected.add(url);
        else selected.delete(url);
        card.classList.toggle("selected", checkbox.checked);
        updateCounts();
      });

      var img = document.createElement("img");
      img.alt = "商品图片 " + (index + 1);
      img.src = url;
      img.addEventListener("error", function () {
        var fallback = document.createElement("div");
        fallback.className = "fallback";
        fallback.textContent = "图片加载失败";
        img.replaceWith(fallback);
      });
      img.addEventListener("click", function () {
        lightboxImg.src = url;
        lightboxCaption.textContent = "第 " + (index + 1) + " 张";
        lightbox.hidden = false;
      });

      card.append(badge, checkbox, img);
      grid.appendChild(card);
    });
    updateCounts();
  }

  function blobToDataUrl(blob) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async function toPngDataUrl(url) {
    var response = await fetch(url);
    if (!response.ok) throw new Error("HTTP " + response.status);
    var blob = await response.blob();
    var bitmap = await createImageBitmap(blob);
    var canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0);
    var png = await new Promise(function (resolve) {
      canvas.toBlob(resolve, "image/png");
    });
    bitmap.close();
    if (!png) throw new Error("无法转为 PNG");
    return blobToDataUrl(png);
  }

  function wait(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  async function usedDownloadNumbers() {
    var query = { filenameRegex: "product-\\d+", limit: 0 };

    // search() 会触发 Chrome 检查文件是否仍在磁盘上，但返回结果可能还是旧的。
    // 第一次查询触发检查，短暂等待后第二次查询读取最新状态。
    await chrome.downloads.search(query);
    await wait(350);
    var items = await chrome.downloads.search(query);
    return DownloadNumbering.collectUsed(items);
  }

  async function downloadSelected() {
    if (downloading || selected.size === 0) {
      if (!selected.size) setStatus("请先选择要下载的图片");
      return;
    }
    downloading = true;
    updateCounts();
    var list = images.filter(function (url) { return selected.has(url); });
    var ok = 0;
    var failed = 0;

    setStatus("正在检查已有编号…");
    var used = new Set();
    try {
      used = await usedDownloadNumbers();
    } catch (error) {
      used = new Set();
    }
    var numbers = DownloadNumbering.allocate(list.length, used);

    for (var i = 0; i < list.length; i += 1) {
      var name = DownloadNumbering.filenameFor(numbers[i]);
      setStatus("正在下载 " + (i + 1) + "/" + list.length + " · " + name.split("/").pop());
      try {
        var dataUrl = await toPngDataUrl(list[i]);
        await chrome.downloads.download({
          url: dataUrl,
          filename: name,
          saveAs: false,
          conflictAction: "uniquify"
        });
        ok += 1;
      } catch (error) {
        failed += 1;
      }
    }

    downloading = false;
    updateCounts();
    setStatus("下载完成：成功 " + ok + " 张，失败 " + failed + " 张");
  }

  document.getElementById("select-all").addEventListener("click", function () {
    images.forEach(function (url) { selected.add(url); });
    render();
  });

  document.getElementById("select-none").addEventListener("click", function () {
    selected.clear();
    render();
  });

  downloadBtn.addEventListener("click", downloadSelected);
  document.getElementById("lightbox-close").addEventListener("click", function () {
    lightbox.hidden = true;
    lightboxImg.removeAttribute("src");
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      lightbox.hidden = true;
      lightboxImg.removeAttribute("src");
    }
  });

  async function init() {
    if (!galleryId) {
      pageTitle.textContent = "没有图片数据";
      renderEmpty("未找到可下载的商品图片");
      return;
    }
    var stored = await chrome.storage.session.get("gallery:" + galleryId);
    var payload = stored["gallery:" + galleryId];
    if (!payload || !payload.images) {
      pageTitle.textContent = "没有图片数据";
      renderEmpty("未找到可下载的商品图片");
      return;
    }
    images = payload.images;
    images.forEach(function (url) { selected.add(url); });
    siteName.textContent = payload.siteName || "商品图片";
    pageTitle.textContent = payload.title || "商品图片";
    render();
  }

  init();
})();
