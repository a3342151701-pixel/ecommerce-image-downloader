(function (root, factory) {
  root.DownloadNumbering = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  var FOLDER = "ecom-images";
  var FILE_NAME = /^product-(\d+)(?:\s*\(\d+\))?\.png(?:\.crdownload)?$/i;

  function normalizePath(value) {
    return String(value || "").replace(/\\/g, "/");
  }

  function isTargetFile(filename) {
    var parts = normalizePath(filename).split("/");
    if (parts.length < 2) return false;
    if (parts[parts.length - 2].toLowerCase() !== FOLDER) return false;
    return FILE_NAME.test(parts[parts.length - 1]);
  }

  function numberFromFilename(filename) {
    if (!isTargetFile(filename)) return null;
    var base = normalizePath(filename).split("/").pop();
    var match = FILE_NAME.exec(base);
    if (!match) return null;
    var index = parseInt(match[1], 10);
    return index > 0 ? index : null;
  }

  function collectUsed(items) {
    var used = new Set();
    (items || []).forEach(function (item) {
      if (!item) return;
      // 进行中的下载尚未落盘，但编号已被占用；已删除或中断且不存在的文件可以复用编号。
      if (item.state !== "in_progress" && item.exists === false) return;
      var index = numberFromFilename(item.filename);
      if (index !== null) used.add(index);
    });
    return used;
  }

  function nextAvailable(used) {
    var taken = used instanceof Set ? used : new Set(used || []);
    var index = 1;
    while (taken.has(index)) index += 1;
    return index;
  }

  function allocate(count, used) {
    var taken = new Set(used instanceof Set ? used : used || []);
    var numbers = [];
    while (numbers.length < count) {
      var index = nextAvailable(taken);
      taken.add(index);
      numbers.push(index);
    }
    return numbers;
  }

  function filenameFor(index) {
    return FOLDER + "/product-" + String(index).padStart(2, "0") + ".png";
  }

  return {
    isTargetFile: isTargetFile,
    numberFromFilename: numberFromFilename,
    collectUsed: collectUsed,
    nextAvailable: nextAvailable,
    allocate: allocate,
    filenameFor: filenameFor
  };
});
