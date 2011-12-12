const NS_XUL = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

exports.AchievementOverlay = function AchievementOverlay(options) {
  var unloaders = [],
      insertbefore = "browser-bottombox",
      destroyed = false,
      destroyFuncs = [];

  var delegate = {
    onTrack: function (window) {
      if ("chrome://browser/content/browser.xul" != window.location || destroyed)
        return;

      let doc = window.document;
      function $(id) doc.getElementById(id);
      function xul(type) doc.createElementNS(NS_XUL, type);

      let box1 = xul("hbox");
      let box2 = xul("hbox");
      let box3 = xul("hbox");
      let text = xul("description");

      box1.setAttribute("hidden", true);
      box1.setAttribute("id", options.id);
      box1.addEventListener("command", function() {
        if (options.onCommand)
          options.onCommand({});
      }, true);
      box2.setAttribute("pack", "center");
      box3.setAttribute("id", options.id + "-message");
      text.setAttribute("value", "look ma!");

      box1.appendChild(box2);
      box2.appendChild(box3);
      box3.appendChild(text);

      let overlay = $(options.id);
      if (!overlay) {
        let b4,
            parentNode = $('browser-panel');

        if (insertbefore) {
          b4 = $(insertbefore);
        }
        overlay = parentNode.insertBefore(box1, b4);
      }
      overlay.addEventListener("transitionend", function () { overlay.setAttribute("hidden", true); }, false);
    },
    onUntrack: function (window) {}
  };
  var winUtils = require("window-utils");
  var tracker = new winUtils.WindowTracker(delegate);

  return {
    destroy: function() {
      if (destroyed) return;
      destroyed = true;
    },
    _timeoutId: 0,
    show: function() {
      for each (var window in winUtils.windowIterator()) {
        if ("chrome://browser/content/browser.xul" != window.location) return;

        let doc = window.document;
        let $ = function (id) doc.getElementById(id);
        let overlay = $(options.id);
        if (overlay)
          overlay.removeAttribute("hidden");
      }
    },
  };
};
