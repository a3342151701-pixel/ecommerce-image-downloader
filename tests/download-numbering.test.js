const fs = require("fs");
const path = require("path");

const file = fs.readFileSync(path.join(__dirname, "../lib/download-numbering.js"), "utf8");
eval(file);
const DownloadNumbering = globalThis.DownloadNumbering;

let failures = 0;

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    failures += 1;
    console.error(label + "\n实际: " + actual + "\n期望: " + expected);
  }
}

function assertSet(actual, expected, label) {
  const got = Array.from(actual).sort((a, b) => a - b).join(",");
  const want = expected.slice().sort((a, b) => a - b).join(",");
  assertEqual(got, want, label);
}

assertEqual(
  DownloadNumbering.numberFromFilename("C:\\Users\\me\\Downloads\\ecom-images\\product-01.png"),
  1,
  "解析 Windows 路径"
);
assertEqual(
  DownloadNumbering.numberFromFilename("/home/me/Downloads/ecom-images/product-27.png"),
  27,
  "解析 POSIX 路径"
);
assertEqual(
  DownloadNumbering.numberFromFilename("/home/me/Downloads/ecom-images/product-05 (2).png"),
  5,
  "Chrome 重名后缀仍视为同一编号"
);
assertEqual(
  DownloadNumbering.numberFromFilename("/home/me/Downloads/ecom-images/product-05.png.crdownload"),
  5,
  "进行中的 .crdownload 占用编号"
);
assertEqual(
  DownloadNumbering.numberFromFilename("/home/me/Downloads/other/product-05.png"),
  null,
  "其他目录不计入"
);
assertEqual(
  DownloadNumbering.numberFromFilename("/home/me/Downloads/ecom-images/product-05.jpg"),
  null,
  "非 PNG 不计入"
);

const used = DownloadNumbering.collectUsed([
  { filename: "/d/ecom-images/product-01.png", state: "complete", exists: true },
  { filename: "/d/ecom-images/product-02.png", state: "complete", exists: false },
  { filename: "/d/ecom-images/product-03 (1).png", state: "complete", exists: true },
  { filename: "/d/ecom-images/product-04.png", state: "in_progress", exists: false },
  { filename: "/d/ecom-images/product-05.png", state: "interrupted", exists: false },
  { filename: "/d/other/product-01.png", state: "complete", exists: true }
]);
assertSet(used, [1, 3, 4], "只计入仍存在的编号与进行中的下载");

const afterDelete = DownloadNumbering.collectUsed([
  { filename: "/d/ecom-images/product-01.png", state: "complete", exists: true },
  { filename: "/d/ecom-images/product-02.png", state: "complete", exists: false },
  { filename: "/d/ecom-images/product-03.png", state: "complete", exists: true }
]);
assertEqual(
  DownloadNumbering.allocate(2, afterDelete).join(","),
  "2,4",
  "本地删除的文件释放编号"
);

assertEqual(DownloadNumbering.nextAvailable(new Set([1, 2, 4])), 3, "最小空号");
assertEqual(DownloadNumbering.nextAvailable(new Set()), 1, "空目录从 1 开始");
assertEqual(
  DownloadNumbering.allocate(4, new Set([1, 2, 4, 8])).join(","),
  "3,5,6,7",
  "按顺序跳过已占用编号"
);
assertEqual(
  DownloadNumbering.allocate(3, new Set()).join(","),
  "1,2,3",
  "无占用时连续编号"
);
assertEqual(DownloadNumbering.allocate(0, new Set([1])).length, 0, "零张图片");
assertEqual(DownloadNumbering.filenameFor(1), "ecom-images/product-01.png", "个位数补零");
assertEqual(DownloadNumbering.filenameFor(100), "ecom-images/product-100.png", "三位数不截断");

if (failures) {
  throw new Error(failures + " 项编号测试未通过");
}

console.log("download-numbering tests passed");
