(function (root) {
  var ATTRS = ["data-zoom", "data-src", "data-original", "data-lazy-src", "data-ks-lazyload", "data-img", "data-url"];

  function pushCandidate(list, value) {
    if (value) list.push(value);
  }

  function fromSrcset(srcset) {
    if (!srcset) return [];
    return srcset.split(",").map(function (part) {
      return part.trim().split(/\s+/)[0];
    }).filter(Boolean);
  }

  function fromImageElement(img) {
    var values = [];
    ATTRS.forEach(function (name) {
      pushCandidate(values, img.getAttribute(name));
    });
    pushCandidate(values, img.getAttribute("src"));
    pushCandidate(values, img.currentSrc);
    fromSrcset(img.getAttribute("srcset")).forEach(function (item) {
      values.push(item);
    });

    if (img.naturalWidth > 0 && img.naturalHeight > 0 && (img.naturalWidth < 80 || img.naturalHeight < 80)) {
      return [];
    }
    return values;
  }

  function fromBackground(element) {
    var style = element.getAttribute("style") || "";
    var matched = style.match(/url\((['"]?)(.*?)\1\)/i);
    return matched ? [matched[2]] : [];
  }

  function pageText() {
    var chunks = [];
    var scripts = document.scripts;
    for (var i = 0; i < scripts.length; i += 1) {
      var text = scripts[i].textContent || "";
      if (text.length > 2000000) text = text.slice(0, 2000000);
      if (/alicdn|360buyimg|pddpic|jfs\/|desc\.alicdn|goods/i.test(text)) chunks.push(text);
    }
    return chunks.join("\n");
  }

  function pageTitle() {
    var og = document.querySelector('meta[property="og:title"]');
    var title = (og && og.content) || document.title || "";
    return title.replace(/\s*[-_|].*$/, "").trim().slice(0, 80);
  }

  function collect(doc) {
    var raw = [];
    var images = doc.querySelectorAll("img");
    for (var i = 0; i < images.length; i += 1) {
      fromImageElement(images[i]).forEach(function (value) {
        raw.push(value);
      });
    }

    var styled = doc.querySelectorAll("[style*='url(']");
    for (var j = 0; j < styled.length; j += 1) {
      var node = styled[j];
      var hint = (node.className && String(node.className)) || node.id || "";
      if (!/pic|image|gallery|preview|desc|detail|goods|sku/i.test(hint)) continue;
      fromBackground(node).forEach(function (value) {
        raw.push(value);
      });
    }

    var text = pageText();
    root.ImageUrl.extractUrlsFromText(text).forEach(function (url) {
      raw.push(url);
    });

    return {
      title: pageTitle(),
      images: root.ImageUrl.uniqueImages(raw),
      descUrls: root.ImageUrl.findDescUrls(text)
    };
  }

  root.EcomExtract = {
    collect: collect
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
