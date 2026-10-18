(function () {
  var ROOT_ID = "ecom-img-root";
  var busy = false;

  function ensureRoot() {
    var root = document.getElementById(ROOT_ID);
    if (root) return root;
    root = document.createElement("div");
    root.id = ROOT_ID;
    root.innerHTML = '<button type="button">获取图片</button><div class="ecom-img-toast" hidden></div>';
    document.documentElement.appendChild(root);
    root.querySelector("button").addEventListener("click", onClick);
    return root;
  }

  function removeRoot() {
    var root = document.getElementById(ROOT_ID);
    if (root) root.remove();
  }

  function setBusy(root, isBusy, label) {
    var button = root.querySelector("button");
    button.disabled = isBusy;
    button.textContent = label;
  }

  function showToast(root, message) {
    var toast = root.querySelector(".ecom-img-toast");
    toast.hidden = !message;
    toast.textContent = message || "";
  }

  function syncButton() {
    var site = globalThis.EcomSites.detect(location.href);
    if (!site) {
      removeRoot();
      return;
    }
    var root = ensureRoot();
    if (!busy) {
      setBusy(root, false, "获取图片");
      showToast(root, "");
    }
    root.dataset.site = site.id;
  }

  async function onClick() {
    if (busy) return;
    var site = globalThis.EcomSites.detect(location.href);
    var root = ensureRoot();
    if (!site) {
      showToast(root, "当前页面不是支持的商品详情页");
      return;
    }

    busy = true;
    setBusy(root, true, "正在获取…");
    showToast(root, "");

    try {
      var draft = globalThis.EcomExtract.collect(document);
      var images = draft.images.slice();
      if (draft.descUrls.length) {
        var extra = await chrome.runtime.sendMessage({
          type: "FETCH_DESC_IMAGES",
          urls: draft.descUrls
        });
        if (extra && extra.images) images = globalThis.ImageUrl.uniqueImages(images.concat(extra.images));
      }

      if (!images.length) {
        showToast(root, "未找到可下载的商品图片");
        return;
      }

      var opened = await chrome.runtime.sendMessage({
        type: "OPEN_GALLERY",
        payload: {
          title: draft.title || document.title,
          pageUrl: location.href,
          siteId: site.id,
          siteName: site.name,
          images: images
        }
      });
      if (!opened || !opened.ok) showToast(root, "打开图片页失败，请重试");
    } catch (error) {
      showToast(root, "获取失败，请刷新页面后重试");
    } finally {
      busy = false;
      setBusy(root, false, "获取图片");
    }
  }

  function watchNavigation() {
    var lastHref = location.href;
    var timer = window.setInterval(function () {
      if (location.href !== lastHref) {
        lastHref = location.href;
        busy = false;
      }
      syncButton();
    }, 1000);

    window.addEventListener("popstate", syncButton);
    window.addEventListener("pagehide", function () {
      window.clearInterval(timer);
    });
  }

  syncButton();
  watchNavigation();
})();
