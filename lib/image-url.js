(function (root, factory) {
  root.ImageUrl = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  var JUNK = /(^|\/)(favicon|logo|avatar|sprites?|blank|spacer|loading|badge|qrcode)([^a-z0-9]|$)/i;

  function isAliHost(host) {
    return /(^|\.)alicdn\.com$/i.test(host) && /(^|\.)(img|gw|imgextra|gd\d)\.alicdn\.com$/i.test(host);
  }

  function isJdHost(host) {
    return /(^|\.)360buyimg\.com$/i.test(host);
  }

  function isPddHost(host) {
    if (/(^|\.)pddpic\.com$/i.test(host)) return true;
    return /img/i.test(host) && /(^|\.)yangkeduo\.com$/i.test(host);
  }

  function isProductHost(host) {
    return isAliHost(host) || isJdHost(host) || isPddHost(host);
  }

  function cleanRaw(raw) {
    var value = String(raw || "").trim();
    if (!value) return "";
    value = value
      .replace(/\\u002[fF]/g, "/")
      .replace(/\\\//g, "/")
      .replace(/&amp;/g, "&");
    if (value.startsWith("//")) value = "https:" + value;
    return value;
  }

  function stripAliPath(pathname) {
    var path = pathname;
    for (var i = 0; i < 5; i += 1) {
      var next = path
        .replace(/_\.(?:webp|avif)$/i, "")
        .replace(/_(?:\d+x\d+)(?:q\d+)?\.(?:jpg|jpeg|png|webp)$/i, "")
        .replace(/_q\d+\.(?:jpg|jpeg|png|webp)$/i, "")
        .replace(/_(?:sum|b)\.(?:jpg|jpeg|png|webp)$/i, "");
      if (next === path) break;
      path = next;
    }
    return path;
  }

  function normalizeImageUrl(raw) {
    var value = cleanRaw(raw);
    if (!value || /^data:/i.test(value) || /^blob:/i.test(value)) return null;
    if (!/^https?:\/\//i.test(value)) return null;

    var url;
    try {
      url = new URL(value);
    } catch (error) {
      return null;
    }

    if (isJdHost(url.hostname)) {
      var jfs = url.pathname.match(/jfs\/.+\.(?:jpg|jpeg|png|webp)/i);
      if (!jfs) return null;
      return "https://img14.360buyimg.com/n1/" + jfs[0];
    }

    if (isAliHost(url.hostname)) {
      return "https://" + url.hostname + stripAliPath(url.pathname);
    }

    if (isPddHost(url.hostname)) {
      return url.origin + url.pathname;
    }

    return null;
  }

  function isJunkPath(pathname) {
    var path = pathname.toLowerCase();
    if (/\.(svg|js|css|gif)(\?|$)/i.test(path)) return true;
    if (JUNK.test(path)) return true;
    if (/_\d{1,2}x\d{1,2}(\.|_)/.test(path)) return true;
    return false;
  }

  function isAcceptedImageUrl(raw) {
    var normalized = normalizeImageUrl(raw);
    if (!normalized) return false;
    var url = new URL(normalized);
    if (!isProductHost(url.hostname)) return false;
    if (isJunkPath(url.pathname)) return false;
    return true;
  }

  function uniqueImages(list) {
    var seen = Object.create(null);
    var result = [];
    (list || []).forEach(function (item) {
      var url = normalizeImageUrl(item);
      if (!url || seen[url] || !isAcceptedImageUrl(url)) return;
      seen[url] = true;
      result.push(url);
    });
    return result.slice(0, 200);
  }

  function extractUrlsFromText(text) {
    var source = cleanRaw(text);
    var found = [];
    var pattern = /https?:\/\/[^"'\s<>]+?\.(?:jpg|jpeg|png|webp)/gi;
    var match;
    while ((match = pattern.exec(source))) {
      found.push(match[0]);
    }

    var jfsPattern = /jfs\/[a-z0-9/_\-]+\.(?:jpg|jpeg|png|webp)/gi;
    while ((match = jfsPattern.exec(source))) {
      found.push("https://img14.360buyimg.com/n1/" + match[0]);
    }
    return uniqueImages(found);
  }

  function findDescUrls(text) {
    var source = cleanRaw(text);
    var pattern = /https?:\/\/(?:desc\.alicdn\.com|itemcdn\.tmall\.com|cd\.jd\.com|dx\.3\.cn|wqs\.jd\.com)[^"'\\\s<>]*/gi;
    var found = [];
    var seen = Object.create(null);
    var match;
    while ((match = pattern.exec(source))) {
      var url = match[0].replace(/[),;]+$/g, "");
      if (seen[url]) continue;
      seen[url] = true;
      found.push(url);
    }
    return found.slice(0, 3);
  }

  return {
    normalizeImageUrl: normalizeImageUrl,
    isAcceptedImageUrl: isAcceptedImageUrl,
    uniqueImages: uniqueImages,
    extractUrlsFromText: extractUrlsFromText,
    findDescUrls: findDescUrls,
    isProductHost: isProductHost
  };
});
