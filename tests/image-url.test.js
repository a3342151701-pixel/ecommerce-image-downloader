const fs = require("fs");
const path = require("path");

const file = fs.readFileSync(path.join(__dirname, "../lib/image-url.js"), "utf8");
const sitesFile = fs.readFileSync(path.join(__dirname, "../content/sites.js"), "utf8");
eval(file);
eval(sitesFile);
const ImageUrl = globalThis.ImageUrl;
const EcomSites = globalThis.EcomSites;

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(label + "\n实际: " + actual + "\n期望: " + expected);
  }
}

assertEqual(
  ImageUrl.normalizeImageUrl("https://img.alicdn.com/imgextra/i4/O1CN01abc.jpg_400x400.jpg"),
  "https://img.alicdn.com/imgextra/i4/O1CN01abc.jpg",
  "去掉阿里尺寸后缀"
);

assertEqual(
  ImageUrl.normalizeImageUrl("https://img.alicdn.com/imgextra/i4/O1CN01abc.jpg_.webp"),
  "https://img.alicdn.com/imgextra/i4/O1CN01abc.jpg",
  "去掉 webp 后缀"
);

assertEqual(
  ImageUrl.normalizeImageUrl("//img14.360buyimg.com/n5/s400x400_jfs/t1/123/abc.jpg"),
  "https://img14.360buyimg.com/n1/jfs/t1/123/abc.jpg",
  "京东升级到 n1"
);

assertEqual(
  ImageUrl.normalizeImageUrl("https://img.pddpic.com/mms-goods/abc.jpeg?imageView2/2/w/130"),
  "https://img.pddpic.com/mms-goods/abc.jpeg",
  "去掉拼多多缩放参数"
);

const unique = ImageUrl.uniqueImages([
  "https://img.alicdn.com/imgextra/i1/a.jpg_80x80.jpg",
  "https://img.alicdn.com/imgextra/i1/a.jpg",
  "https://g.alicdn.com/logo.png"
]);
if (unique.length !== 1 || unique[0] !== "https://img.alicdn.com/imgextra/i1/a.jpg") {
  throw new Error("去重或过滤失败: " + JSON.stringify(unique));
}

const fromText = ImageUrl.extractUrlsFromText('var x={"url":"https:\\/\\/img.alicdn.com\\/imgextra\\/i2\\/b.jpg_200x200.jpg"}');
if (fromText[0] !== "https://img.alicdn.com/imgextra/i2/b.jpg") {
  throw new Error("脚本文本提取失败: " + JSON.stringify(fromText));
}

function assertSite(href, id) {
  const site = EcomSites.detect(href);
  if (!site || site.id !== id) {
    throw new Error(href + " 识别为 " + (site && site.id));
  }
}

assertSite("https://item.taobao.com/item.htm?id=123", "taobao");
assertSite("https://detail.tmall.com/item.htm?id=123", "taobao");
assertSite("https://item.jd.com/100012043978.html", "jd");
assertSite("https://mms.pinduoduo.com/goods/goods_detail?goods_id=99", "pdd-merchant");
if (EcomSites.detect("https://www.taobao.com/")) {
  throw new Error("淘宝首页不应出现按钮");
}

console.log("image-url tests passed");
