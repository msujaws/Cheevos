// todo: https://etherpad.mozilla.org/SrTmdsPQ5m

exports.main = function() {
  const debug = true;
  log("cheevos loaded");

  const notifications = require("notifications"),
        ss = require("simple-storage").storage,
        obbs = require("observer-service"),
        tabs = require("tabs"),
        urlFactory = require("url"),
        data = require("self").data,
        winUtils = require("window-utils");
  let panelFactory = require("panel"),
      p,
      totalCheevos = 0,
      acquiredCheevos = 0;

  let strings = {
    cheevos: {
      lwThemeChanged: {
          id: "lightweight-theme-changed",
          obs: "lightweight-theme-changed",
          message: "Nice outfit :) You've just changed your persona.",
          name: "Wardrobe malfunction",
          award: "bronze"
      },
      dmRemoveDownload: {
          id: "download-manager-remove-download",
          obs: "download-manager-remove-download",
          message: "$ rm foo",
          name: "Tidy up!",
          award: "bronze"
      },
      dmRemoveDownloads: {
          id: "download-manager-remove-download2",
          obs: "download-manager-remove-download",
          message: "$ rm *",
          name: "OCD checking in...",
          award: "bronze"
      },
      privateBrowsingEnter: {
          id: "private-browsing",
          obs: "private-browsing",
          message: "All your secrets are belong to you.",
          name: "Shopping for jewelry?",
          award: "bronze"
      },
      pmLoginAdded: {
          id: "passwordmgr-storage-changed",
          obs: "passwordmgr-storage-changed",
          message: "Login added",
          name: "Hi! My name is ____",
          award: "bronze"
      },
      addOnsOpened: {
          id: "Tools:Addons",
          obs: "Tools:Addons",
          message: "This message will self destruct.",
          name: "Inspector Gadget",
          aboutScheme: true,
          url: "about:addons",
          award: "bronze"
      },
      robotsOpened: {
          id: "about:robots",
          obs: "about:robots",
          message: "I'm sorry, Dave, I'm afraid I can't do that.",
          name: "Domo arigato",
          aboutScheme: true,
          url: "about:robots",
          award: "silver"
      },
      configOpened: {
          id: "about:config",
          obs: "about:config",
          message: "All your controls are belong to you.",
          name: "Super User",
          aboutScheme: true,
          url: "about:config",
          award: "bronze"
      },
      mozillaOpened: {
          id: "about:mozilla",
          obs: "about:mozilla",
          message: "Nice find!",
          name: "Egg Hunt",
          aboutScheme: true,
          url: "about:mozilla",
          award: "bronze"
      },
      frequentFlyer: {
          id: "frequentFlyer",
          obs: "frequentFlyer",
          message: "Nice job, XX domains in a three minute timespan.",
          name: "Frequent flyer",
          subAwards: true,
          bronzeId: "frequentFlyerBronze",
          silverId: "frequentFlyerSilver"
      },
      revolutionTelevised: {
          id: "revolutionTelevised",
          obs: "revolutionTelevised",
          message: "The Revolution Will Not Be Televised",
          name: "The Revolution",
          host: "air.mozilla.org",
          award: "bronze"
      }
    },
    cheevoAcquired: "Cheevo acquired (#1/#2) "
  };

  let totalCheevos = [];
  for (let index in strings.cheevos)
    totalCheevos[totalCheevos.length] = strings.cheevos[index];

  // TODO: remove before publishing
  for (let i in ss)
    delete ss[i];

  for (let c in ss)
    acquiredCheevos++;

  ss.hostCount = [{},{},{}];
  addObs(strings.cheevos.lwThemeChanged.obs, onLightweightThemeChanged, this);
  addObs(strings.cheevos.dmRemoveDownload.obs, onDownloadManagerRemoveDownload, this);
  addObs(strings.cheevos.privateBrowsingEnter.obs, onPrivateBrowsingEnter, this);
  addObs(strings.cheevos.pmLoginAdded.obs, onPMLoginAdded, this);
  tabs.on('ready', onDOMContentLoaded);

  function addObs(topic, callback, thisRef) {
    obbs.add(topic, callback, thisRef);
  }

  function log(aMessage) {
    if (debug)
      console.info("cheevos: " + aMessage);
  }

  function cheevoTitle() {
    return strings.cheevoAcquired.replace("#1", acquiredCheevos)
                                 .replace("#2", totalCheevos.length);
  }

  function getCheevoListBlockText() {
    log("getCheevoBlockTest");
    let h = '';
    for (let i in totalCheevos) {
      let cheevo = totalCheevos[i];
      if (cheevo.subAwards)
        h += ss[cheevo.goldId] ? "<li class='cheevo-block achieved'>" : "<li class=cheevo-block>";
      else
        h += ss[cheevo.id] ? "<li class='cheevo-block achieved'>" : "<li class=cheevo-block>";
      h += "<h3 class=name>" + cheevo.name + "</h3>";
      h += "<p class=message>" + cheevo.message + "</p>";
      if (cheevo.subAwards) {
        h += "<ol class=awards>";
        if (ss[cheevo.bronzeId])
          h += "<li class=bronze></li>";
        if (ss[cheevo.silverId])
          h += "<li class=silver></li>";
        if (ss[cheevo.goldId])
          h += "<li class=gold></li>";
        h += "</ol></li>";
      } else {
        h += "<span class='" + cheevo.award + "' />";
      }
    }
    return h;
  }

  function onCheevosPageOpened(tab, cheevo) {
    let title = cheevoTitle();
    log("onCheevosPageOpened: " + cheevo);
    if (!cheevo) {
      cheevo = {};
      cheevo.name = "Cheevos for Firefox"
      cheevo.message = "Use Firefox, gain achievements."
      title = "";
    }
    tab.attach({
      contentScriptFile: data.url("cheevo.js"),
      contentScript: "populateTemplate('" + escape(cheevo.name) + "','" + escape(cheevo.message) +
                                       "','" + escape(title) + "','" + escape(getCheevoListBlockText()) + "');"
    });
  }

  function loadCheevosPage(cheevo) {
    tabs.open({
      url: data.url("cheevo.html"),
      onReady: function onReady(tab) { onCheevosPageOpened(tab, cheevo); }
    });
  }

  function notify(cheevo) {
    log("showing notifcation: " + cheevo.name);
    notifications.notify({
      title: cheevoTitle() + cheevo.name,
      text: cheevo.message,
      iconURL: data.url("trophy.gif"),
      onClick: function() { loadCheevosPage(cheevo); }
    });
  }

  function onObservation(cheevo, shouldShow, specificAward) {
    log(cheevo.obs);
    function checkForCheevoId(cheevo, id) { if(!ss[id]) { acquiredCheevos++; notify(cheevo); }; };
    if (specificAward) {
      if (shouldShow) {
        switch (specificAward) {
          case "bronze":
            checkForCheevoId(cheevo, cheevo.bronzeId);
            ss[cheevo.bronzeId] = true;
            break;
          case "silver":
            checkForCheevoId(cheevo, cheevo.silverId);
            ss[cheevo.silverId] = true;
            break;
          case "gold":
            checkForCheevoId(cheevo, cheevo.goldId);
            ss[cheevo.goldId] = true;
            break;
          default:
            console.error("Cheevo: Unexpected observation specificAward");
            break;
        }
      }
    } else if (shouldShow && !ss[cheevo.id]) {
      acquiredCheevos++;
      ss[cheevo.id] = true;
      notify(cheevo);
    }
  }

  function onURLOpened(cheevo) {
    return onObservation(cheevo, true);
  }

  function onLightweightThemeChanged(subject, data) {
    onObservation(strings.cheevos.lwThemeChanged, true);
  }

  function onDownloadManagerRemoveDownload(subject, data) {
    let cheevo = subject ? strings.cheevos.dmRemoveDownload : strings.cheevos.dmRemoveDownloads;
    onObservation(cheevo, true);
  }

  function onPrivateBrowsingEnter(subject, data) {
    onObservation(strings.cheevos.privateBrowsingEnter, data == "enter");
  }

  function onPMLoginAdded(subject, data) {
    onObservation(strings.cheevos.pmLoginAdded, data == "addLogin");
  }
  
  function clearOldBuckets() {
    const date = new Date(),
          milliseconds = date.getTime(),
          threeMinutesAsMS = 180000;
    for (let bucket in ss.hostCount)
      for (let i in ss.hostCount[bucket]) {
        if (milliseconds - (ss.hostCount[bucket])[i] > threeMinutesAsMS)
          ss.hostCount[bucket] = {};
        break;
      }
  }
  
  function trackHost(url) {
    let visited;
    const date = new Date(),
          minutes = date.getMinutes(),
          milliseconds = date.getTime(),
          threeMinutesAsMS = 180000,
          host = urlFactory.URL(url).host;
    for (let bucket in ss.hostCount)
      if (host in ss.hostCount[bucket]) {
        visited = true;
        break;
      }
    if (!visited) {
      let bucket = minutes % 3;
      (ss.hostCount[bucket])[host] = milliseconds;
    }
  }
  
  function getHostCount() {
    let hosts = 0;
    for (let bucket in ss.hostCount) {
      for (let i in ss.hostCount[bucket]) {
        hosts++;
      }
    }
    log("totalHosts: " + hosts);
    return hosts;
  }

  function onDOMContentLoaded(tab) {
    log("onDOMContentLoaded: " + tab.url);
    url = urlFactory.URL(tab.url);
    for (let index in strings.cheevos) {
      if (strings.cheevos[index].aboutScheme) {
        if (tab.url.toLowerCase() == strings.cheevos[index].url)
          onURLOpened(strings.cheevos[index]);
      } else if (url.host && url.host.toLowerCase() == strings.cheevos[index].host) {
        onURLOpened(strings.cheevos[index]);
      }
    }

    clearOldBuckets();
    trackHost(tab.url);
    let hosts = getHostCount();
    if (hosts >= 10)
      onObservation(strings.cheevos.frequentFlyer, true, "bronze");
    if (hosts >= 20)
      onObservation(strings.cheevos.frequentFlyer, true, "silver");
  }

  var windowDelegate = {
    onTrack: function (window) {
      function addMenuItem(window) {
        log("adding menu item");
        const NS_XUL = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
        const keysetID = "cheevo-keyset";
        const keyID = "Cheevo:Cheevo";
        const fileMenuitemID = "menu_CheevoItem";
        let logo = data.url("trophy_icon.png");
        var $ = function(id) window.document.getElementById(id);

        function removeMI() {
          var menuitem = $(fileMenuitemID);
          menuitem && menuitem.parentNode.removeChild(menuitem);
        }
        removeMI();

        // add the new menuitem to File menu
        let (cheevoMI = window.document.createElementNS(NS_XUL, "menuitem")) {
          cheevoMI.setAttribute("id", fileMenuitemID);
          cheevoMI.setAttribute("class", "menuitem-iconic");
          cheevoMI.setAttribute("label","View Cheevos");
          cheevoMI.setAttribute("key", keyID);
          cheevoMI.style.listStyleImage = "url('" + logo + "')";
          cheevoMI.addEventListener("command", function() { loadCheevosPage(); }, true);

          if ($("menu_ToolsPopup"))
            $("menu_ToolsPopup").insertBefore(cheevoMI, $("devToolsSeparator"));

          // add app menu item to Firefox button for Windows 7
          let appMenu = $("appmenuSecondaryPane"), cheevoAMI;
          if (appMenu) {
            cheevoAMI = $(fileMenuitemID).cloneNode(false);
            cheevoAMI.setAttribute("id", "appmenu_CheevoItem");
            cheevoAMI.setAttribute("class", "menuitem-iconic menuitem-iconic-tooltip");
            cheevoAMI.style.listStyleImage = "url('" + logo + "')";
            cheevoAMI.addEventListener("command", function() { loadCheevosPage(); }, true);
            appMenu.insertBefore(cheevoAMI, $("appmenuSecondaryPane-spacer"));
          }
        }
      }
      addMenuItem(window);
    },
    onUntrack: function (window) {
      log("removing menu item");
      const fileMenuitemID = "menu_CheevoItem";
      var $ = function(id) window.document.getElementById(id);
      var menuitem = $(fileMenuitemID);
      menuitem && menuitem.parentNode.removeChild(menuitem);
    }
  }

  var tracker = new winUtils.WindowTracker(windowDelegate);
};
