(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Scroll reveal ---------- */

  var revealItems = Array.prototype.slice.call(document.querySelectorAll(".reveal"));

  if (!("IntersectionObserver" in window) || reduceMotion) {
    revealItems.forEach(function (item) {
      item.classList.add("is-visible");
    });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    revealItems.forEach(function (item) {
      revealObserver.observe(item);
    });
  }

  /* ---------- Hero stage parallax ---------- */

  var stage = document.querySelector("[data-stage]");
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  if (stage && finePointer && !reduceMotion) {
    var frame = 0;
    var nextX = 0;
    var nextY = 0;

    var apply = function () {
      frame = 0;
      stage.style.setProperty("--mx", nextX.toFixed(3));
      stage.style.setProperty("--my", nextY.toFixed(3));
    };

    stage.addEventListener("pointermove", function (event) {
      var rect = stage.getBoundingClientRect();
      nextX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      nextY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
      nextX = Math.max(-1, Math.min(1, nextX));
      nextY = Math.max(-1, Math.min(1, nextY));
      if (!frame) frame = window.requestAnimationFrame(apply);
    });

    stage.addEventListener("pointerleave", function () {
      nextX = 0;
      nextY = 0;
      if (!frame) frame = window.requestAnimationFrame(apply);
    });
  }

  /* ---------- Feature tabs ---------- */

  var tabList = document.querySelector(".demo-tabs");
  var tabs = tabList ? Array.prototype.slice.call(tabList.querySelectorAll('[role="tab"]')) : [];
  var views = Array.prototype.slice.call(document.querySelectorAll(".demo-view"));

  function activateTab(tab) {
    if (!tab || tab.getAttribute("aria-selected") === "true") return;

    tabs.forEach(function (item) {
      var selected = item === tab;
      item.setAttribute("aria-selected", selected ? "true" : "false");
      item.tabIndex = selected ? 0 : -1;
      item.classList.toggle("is-active", selected);
    });

    tabs.forEach(function (item) {
      var panel = document.getElementById(item.getAttribute("aria-controls"));
      if (!panel) return;
      var selected = item === tab;
      panel.hidden = !selected;
      panel.classList.toggle("is-active", selected);
    });

    var targetView = tab.getAttribute("data-view") || tab.id.replace("demo-tab-", "");
    views.forEach(function (view) {
      var selected = view.getAttribute("data-view") === targetView;
      view.hidden = !selected;
      view.classList.toggle("is-active", selected);
    });
  }

  tabs.forEach(function (tab, index) {
    tab.addEventListener("click", function () {
      activateTab(tab);
    });

    tab.addEventListener("keydown", function (event) {
      var nextIndex = null;

      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        nextIndex = (index + 1) % tabs.length;
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        nextIndex = (index - 1 + tabs.length) % tabs.length;
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = tabs.length - 1;
      }

      if (nextIndex === null) return;
      event.preventDefault();
      var nextTab = tabs[nextIndex];
      nextTab.focus();
      activateTab(nextTab);
    });
  });

  if (tabs.length) {
    tabs.forEach(function (tab) {
      var viewId = tab.getAttribute("data-view") || tab.id.replace("demo-tab-", "");
      tab.setAttribute("data-view", viewId);
    });
  }

  document.documentElement.dataset.ready = "1";
})();
