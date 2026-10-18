# 电商图片提取 · 官网

「电商图片提取」Chrome 扩展的静态宣传页。纯 HTML / CSS / 原生 JS，无构建步骤、无后端、无第三方依赖。

站点随扩展源码一起托管，位于仓库的 `docs/` 目录，由 GitHub Pages 发布：
`https://a3342151701-pixel.github.io/ecommerce-image-downloader/`

## 本地预览

**方式一：直接打开**

双击 `index.html`，用 Chrome 打开即可。

**方式二：本地静态服务器（推荐）**

在本目录执行（Windows 使用 `py` 启动器）：

```bash
py -m http.server 8765
```

macOS / Linux 可使用：

```bash
python3 -m http.server 8765
```

然后访问 `http://127.0.0.1:8765`。若 `python` 命令指向 Microsoft Store 的占位程序，请改用上面的 `py` 命令。

本地服务器更接近正式访问环境，字体、锚点跳转和动效的加载表现更稳定。

## 目录结构

```text
docs/
├── index.html          页面结构与全部文案
├── styles.css          设计变量、布局、动效与响应式规则
├── script.js           滚动入场、首屏视差、功能步骤切换、键盘操作
├── .nojekyll           关闭 Jekyll 处理，按原样发布
├── assets/
│   ├── fonts/          本地字体（Noto Serif SC / Noto Sans SC / Space Grotesk）
│   ├── icons/          favicon
│   └── img/            商品示意图（内联风格 SVG）
└── README.md
```

## 页面内容

1. 首屏：品牌、主标题、说明、安装 CTA、全幅产品示意
2. 产品介绍：价值、适用场景
3. 核心功能：提取 → 勾选 → PNG 导出 → 多平台，四个可切换步骤
4. 安装步骤：对应 Chrome「加载已解压的扩展程序」完整流程
5. 支持平台：淘宝 / 天猫、京东、拼多多商家版
6. 常见问题与页脚

## 维护说明

- 颜色、间距、字体统一在 `styles.css` 顶部的 `:root` 变量中调整。
- 页面不发送任何请求，不包含统计脚本、表单或登录入口。
- 断点：`1180px`（版式收拢）、`980px`（导航收起、双栏转单栏）、`760px`（首屏示意简化）、`620px`（手机字号与按钮）、`380px`（极窄屏微调）。
- 站点文案与仓库根目录（`..`）的扩展实际行为保持一致；修改扩展的站点规则、下载命名或编号规则后，请同步更新功能演示、支持平台与 FAQ。
- 站点同时保留在 `F:\docs\ecommerce-image-downloader-site` 作为本地编辑副本，改动后需复制到本目录并推送。
