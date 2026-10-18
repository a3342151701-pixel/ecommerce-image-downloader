importScripts("lib/image-url.js");

var DESC_HOST = /^https?:\/\/(?:desc\.alicdn\.com|itemcdn\.tmall\.com|cd\.jd\.com|dx\.3\.cn|wqs\.jd\.com)\//i;

async function fetchDescImages(urls) {
  var found = [];
  var list = (urls || []).filter(function (url) {
    return DESC_HOST.test(url);
  }).slice(0, 3);

  for (var i = 0; i < list.length; i += 1) {
    var controller = new AbortController();
    var timer = setTimeout(function () {
      controller.abort();
    }, 8000);
    try {
      var response = await fetch(list[i], { signal: controller.signal });
      if (!response.ok) continue;
      var text = await response.text();
      found = found.concat(ImageUrl.extractUrlsFromText(text));
    } catch (error) {
      continue;
    } finally {
      clearTimeout(timer);
    }
  }

  return ImageUrl.uniqueImages(found);
}

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (!message || !message.type) return;

  if (message.type === "FETCH_DESC_IMAGES") {
    fetchDescImages(message.urls).then(function (images) {
      sendResponse({ images: images });
    });
    return true;
  }

  if (message.type === "OPEN_GALLERY") {
    var id = crypto.randomUUID();
    var stored = {};
    stored["gallery:" + id] = message.payload;
    chrome.storage.session.set(stored).then(function () {
      return chrome.tabs.create({
        url: chrome.runtime.getURL("gallery/gallery.html?id=" + encodeURIComponent(id))
      });
    }).then(function () {
      sendResponse({ ok: true });
    }).catch(function () {
      sendResponse({ ok: false });
    });
    return true;
  }
});
