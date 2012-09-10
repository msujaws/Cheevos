"use strict";

const winUtils = require("window-utils");
const {isBrowser} = require("api-utils/window/utils");
const {unload} = require("unload+");

const NS_XUL = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
const NS_HTML = "http://www.w3.org/1999/xhtml";

const debug = false;

exports.AchievementOverlay = function AchievementOverlay(options) {
  var unloaders = [],
      insertbefore = "browser-bottombox",
      destroyed = false,
      id = options.id;

  var delegate = {
    onTrack: function (window) {
      if (!isBrowser(window) || destroyed) return;

      let doc = window.document;
      function $(id) doc.getElementById(id);
      let xul = node.bind(null, doc, NS_XUL);
      let html = node.bind(null, doc, NS_HTML);

      let box1 = xul("hbox", {
        id: id,
        hidden: true
      });
      let box2 = xul("hbox", {pack: "center"}, box1);
      let box3 = xul("hbox", {id: id + "-message"}, box2);
      let achievement = html("div", {id: id + "-achievement"}, box3);
      let award       = html("img", {id: id + "-award"}, achievement);
      let h1          = html("h1", {id: id + "-h1"}, achievement);
      let h2          = html("h2", {id: id + "-h2"}, achievement);
      let meta        = html("div", {id: id + "-meta"}, achievement);
      let points      = html("div", {id: id + "-points"}, meta);
      let medals      = html("ol", {id: id + "-medals"}, meta);
      let bronze      = html("li", {}, medals);
      let silver      = html("li", {}, medals);
      let gold        = html("li", {}, medals);

      box1.addEventListener("command", function() {
        options.onCommand && options.onCommand({});
      }, true);
      h1.textContent = "Cheevo acquired!";

      let overlay = $(id);
      // if the overlay element dne, then add it
      if (!overlay)
        overlay = $("browser-panel").insertBefore(box1, $(insertbefore));

      overlay.addEventListener("transitionend", function onAchievementHidden(event) {
        if (debug)
          console.log('onAchievementHidden reached');
        if (event.propertyName != "opacity")
          return;
        if (overlay) {
          overlay.hidden = true;
          overlay.removeAttribute("fadeOut");
        }
      }, false);

      unloaders.push(unload(function() {
        overlay.parentNode.removeChild(overlay);
      }, window));
    }
  };
  winUtils.WindowTracker(delegate);

  return {
    destroy: function() {
      if (destroyed) return;
      destroyed = true;
      unloaders.forEach(function(unload) unload());
    },
    show: function(data) {
      for each (var window in winUtils.windowIterator()) {
        if (!isBrowser(window)) return;

        updateOverlay(
            id, data, function(id) window.document.getElementById(id));
      }
    },
  };
};

function updateOverlay(id, data, $) {
  let overlay = $(id);
  if (!overlay) return;

  $("cheevos-achievementOverlay-achievement").className = data.awardsClass;
  $("cheevos-achievementOverlay-h1").textContent = data.title;
  $("cheevos-achievementOverlay-h2").textContent = data.text;
  $("cheevos-achievementOverlay-points").textContent = data.points;
  $("cheevos-achievementOverlay-meta").className = data.awardsClass;

  overlay.hidden = false;
  // Trigger a reflow so the setting of the attributes are separate.
  overlay.boxObject.height;
  overlay.setAttribute("fadeOut", true);
}

function node(doc, ns, type, attrs, parent) {
  let ele = doc.createElementNS(ns, type);
  attrs && Object.keys(attrs).forEach(function(attr) {
    ele.setAttribute(attr, attrs[attr]);
  });
  parent && parent.appendChild(ele);
  return ele;
}
