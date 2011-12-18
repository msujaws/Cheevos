const NS_XUL = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
const NS_HTML = "http://www.w3.org/1999/xhtml";

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
      function html(type) doc.createElementNS(NS_HTML, type);

      let box1 = xul("hbox");
      let box2 = xul("hbox");
      let box3 = xul("hbox");
      let achievement = html("div");
      let award       = html("img");
      let h1          = html("h1");
      let h2          = html("h2");
      let meta        = html("div");
      let points      = html("div");
      let medals      = html("ol");
      let bronze      = html("li");
      let silver      = html("li");
      let gold        = html("li");

      box1.setAttribute("hidden", true);
      box1.setAttribute("id", options.id);
      box1.addEventListener("command", function() {
        if (options.onCommand)
          options.onCommand({});
      }, true);
      box2.setAttribute("pack", "center");
      box3.setAttribute("id", options.id + "-message");
      achievement.setAttribute("id", options.id + "-achievement");
      award.setAttribute("id", options.id + "-award");
      h1.setAttribute("id", options.id + "-h1");
      h2.setAttribute("id", options.id + "-h2");
      meta.setAttribute("id", options.id + "-meta");
      points.setAttribute("id", options.id + "-points");
      medals.setAttribute("id", options.id + "-medals");
      h1.textContent = "Cheevo acquired!";

      box1.appendChild(box2);
      box2.appendChild(box3);
      box3.appendChild(achievement);
      achievement.appendChild(award);
      achievement.appendChild(h1);
      achievement.appendChild(h2);
      achievement.appendChild(meta);
      meta.appendChild(points);
      meta.appendChild(medals);
      medals.appendChild(bronze);
      medals.appendChild(silver);
      medals.appendChild(gold);

      let overlay = $(options.id);
      if (!overlay) {
        let b4,
            parentNode = $('browser-panel');

        if (insertbefore) {
          b4 = $(insertbefore);
        }
        overlay = parentNode.insertBefore(box1, b4);
      }
      this.onAchievementHidden = function(event) {
        console.log('onAchievementHidden reached');
        if (event.propertyName != "opacity")
          return;
        if (overlay) {
          overlay.hidden = true;
          overlay.removeAttribute("fadeOut");
        }
      }.bind(this);
      overlay.addEventListener("transitionend", this.onAchievementHidden, false);
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
    show: function(data) {
      for each (var window in winUtils.windowIterator()) {
        if ("chrome://browser/content/browser.xul" != window.location) return;

        let doc = window.document;
        let $ = function (id) doc.getElementById(id);
        let overlay = $(options.id);
        if (overlay) {
          $("cheevos-achievementOverlay-h1").textContent = data.title;
          $("cheevos-achievementOverlay-h2").textContent = data.text;
          $("cheevos-achievementOverlay-points").textContent = data.points;
          overlay.hidden = false;
          // Trigger a reflow so the setting of the attributes are separate.
          overlay.boxObject.height;
          overlay.setAttribute("fadeOut", true);
        }
      }
    },
  };
};
