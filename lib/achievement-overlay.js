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
      box1.appendChild(box2);
      box2.appendChild(box3);
      box3.appendChild(text);

      box1.setAttribute("hidden", true);
      box1.setAttribute("id", options.id);
      box1.addEventListener("command", function() {
        if (options.onCommand)
          options.onCommand({});
      }, true);
      text.setAttribute("label", "look ma!");

      let overlay = $(options.id);
      if (!overlay) {
        let b4,
            parentNode = $('browser-panel');

        if (insertbefore) {
          b4 = $(insertbefore);
        }
        parentNode.insertBefore(box1, b4);
      }
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
