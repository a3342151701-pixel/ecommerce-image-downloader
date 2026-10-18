(function (root) {
  function isTaobaoDetail(url) {
    var host = url.hostname;
    if (!/(^|\.)taobao\.com$/i.test(host) && !/(^|\.)tmall\.com$/i.test(host)) return false;
    var path = url.pathname;
    var id = url.searchParams.get("id") || url.searchParams.get("item_id") || url.searchParams.get("itemId");
    if (/item\.htm|detail\.htm/i.test(path) && id) return true;
    if (/^(item|detail|new-item)\./i.test(host) && /item|detail/i.test(path)) return true;
    return false;
  }

  function isJdDetail(url) {
    var host = url.hostname;
    if (!/(^|\.)jd\.com$/i.test(host) && !/(^|\.)jd\.hk$/i.test(host)) return false;
    if (/^\/\d+\.html$/i.test(url.pathname)) return true;
    if (/\/product\/\d+/i.test(url.pathname)) return true;
    return false;
  }

  function isPddMerchantDetail(url) {
    if (url.hostname !== "mms.pinduoduo.com") return false;
    var combined = (url.pathname + url.search + url.hash).toLowerCase();
    if (!combined.includes("goods")) return false;
    return /detail|edit|view|preview|publish|goods_id|goodsid/.test(combined);
  }

  var sites = [
    {
      id: "taobao",
      name: "淘宝",
      test: isTaobaoDetail,
      note: "主图和详情图主要来自 img.alicdn.com / gw.alicdn.com。详情长图常在 desc.alicdn.com 的描述页里。"
    },
    {
      id: "jd",
      name: "京东",
      test: isJdDetail,
      note: "主图来自 360buyimg.com 的 jfs 路径，统一升级到 n1 尺寸。详情图可能在 cd.jd.com 或 dx.3.cn。"
    },
    {
      id: "pdd-merchant",
      name: "拼多多商家版",
      test: isPddMerchantDetail,
      note: "商家后台商品图主要来自 pddpic.com。地址需带 goods，并且是详情、编辑、预览或带 goods_id 的页面。"
    }
  ];

  root.EcomSites = {
    detect: function (href) {
      var url;
      try {
        url = new URL(href);
      } catch (error) {
        return null;
      }
      for (var i = 0; i < sites.length; i += 1) {
        if (sites[i].test(url)) return sites[i];
      }
      return null;
    }
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
