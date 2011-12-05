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
        winUtils = require("window-utils"),
        {Cc,Ci} = require("chrome");
  let panelFactory = require("panel"),
      p,
      totalCheevos = 0,
      acquiredCheevos = 0;

  let strings = {
    cheevos: {
      lwThemeChanged: {
        id: "lightweight-theme-changed",
        obs: "lightweight-theme-changed",
        description: "Nice outfit :) You've just changed your persona.",
        name: "Wardrobe malfunction",
        award: "bronze"
      },
      dmRemoveDownload: {
        id: "download-manager-remove-download",
        obs: "download-manager-remove-download",
        description: "$ rm foo",
        name: "Tidy up!",
        award: "bronze"
      },
      dmRemoveDownloads: {
        id: "download-manager-remove-download2",
        obs: "download-manager-remove-download",
        description: "$ rm *",
        name: "OCD checking in...",
        award: "bronze"
      },
      privateBrowsingEnter: {
        id: "private-browsing",
        obs: "private-browsing",
        description: "All your secrets are belong to you.",
        name: "Shopping for jewelry?",
        award: "bronze"
      },
      pmLoginAdded: {
        id: "passwordmgr-storage-changed",
        obs: "passwordmgr-storage-changed",
        description: "Login added",
        name: "Hi! My name is ____",
        award: "bronze"
      },
      homepageChanged: {
        id: "homepageChanged",
        obs: "browser.startup.homepage",
        description: "Welcome home my dear.",
        name: "Home Sweet Home",
        award: "bronze"
      },
      addOnsOpened: {
        id: "Tools:Addons",
        obs: "Tools:Addons",
        description: "This message will self destruct.",
        name: "Inspector Gadget",
        exactUrl: true,
        url: "about:addons",
        award: "bronze"
      },
      robotsOpened: {
        id: "about:robots",
        obs: "about:robots",
        description: "I'm sorry, Dave, I'm afraid I can't do that.",
        name: "Domo arigato",
        exactUrl: true,
        url: "about:robots",
        award: "silver"
      },
      configOpened: {
        id: "about:config",
        obs: "about:config",
        description: "All your controls are belong to you.",
        name: "Super User",
        exactUrl: true,
        url: "about:config",
        award: "bronze"
      },
      mozillaOpened: {
        id: "about:mozilla",
        obs: "about:mozilla",
        description: "Nice find!",
        name: "Egg Hunt",
        exactUrl: true,
        url: "about:mozilla",
        award: "bronze"
      },
      knowUrRights: {
        id: "about:rights",
        obs: "about:rights",
        description: "The truth won't be told by the few who know. ",
        name: "Know Your Rights",
        exactUrl: true,
        url: "about:rights",
        award: "bronze"
      },
      frequentFlyer: {
        id: "frequentFlyer",
        obs: "frequentFlyer",
        description: "Nice job, lotsa domains in a three minute timespan.",
        name: "Frequent flyer",
        subAwards: true,
        bronzeId: "frequentFlyerBronze",
        silverId: "frequentFlyerSilver",
        goldId: "frequentFlyerGold"
      },
      revolutionTelevised: {
        id: "revolutionTelevised",
        obs: "revolutionTelevised",
        description: "The Revolution Will Not Be Televised",
        name: "The Revolution",
        host: "air.mozilla.org",
        award: "bronze"
      },
      yoDawg: {
        id: "yoDawg",
        obs: "chrome://browser/content/browser.xul",
        description: "I herd you like browsers",
        name: "Yo Dawg",
        exactUrl: true,
        url: "chrome://browser/content/browser.xul",
        award: "silver"
      }
    },
    cheevoAcquired: "Cheevo acquired (#1/#2) "
  };

  let totalCheevos = [];
  for (let index in strings.cheevos)
    totalCheevos[totalCheevos.length] = strings.cheevos[index];

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
        h += ss[cheevo.goldId] ? "<li class='cheevo-block awards achieved'>" : "<li class='cheevo-block'>";
      else
        h += ss[cheevo.id] ? "<li class='cheevo-block achieved'>" : "<li class='cheevo-block'>";
      h += "<h3 class=name>" + cheevo.name + "</h3>"
      h += "<p class=message>" + cheevo.description + "</p>";
      if (cheevo.subAwards) {
        h += "<ol class=awards>";
        if (ss[cheevo.bronzeId])
          h += "<li class='bronze achieved'></li>";
        else
          h += "<li class='bronze'></li>";
        if (ss[cheevo.silverId])
          h += "<li class='silver achieved'></li>";
        else
          h += "<li class='silver'></li>";
        if (ss[cheevo.goldId])
          h += "<li class='gold achieved'></li>";
        else
          h += "<li class='gold'></li>";
        h += "</ol></li>";
      } else {
        h += "<div class='" + cheevo.award + "' />";
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
      cheevo.description = "Use Firefox, gain achievements."
      title = "";
    }
    tab.attach({
      contentScriptFile: data.url("cheevo.js"),
      contentScript: "populateTemplate('" + escape(cheevo.name) + "','" + escape(cheevo.description) +
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
      text: cheevo.description,
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
    for (let bucket in ss.hostCount) {
      for (let i in ss.hostCount[bucket]) {
        if (milliseconds - (ss.hostCount[bucket])[i] > threeMinutesAsMS)
          ss.hostCount[bucket] = {};
        break;
      }
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
      if (strings.cheevos[index].exactUrl) {
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
    if (hosts >= 30)
      onObservation(strings.cheevos.frequentFlyer, true, "gold");
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
  };
  var tracker = new winUtils.WindowTracker(windowDelegate);

  var myPrefObserver = {
    register: function() {
      // First we'll need the preference services to look for preferences.
      var prefService = Cc["@mozilla.org/preferences-service;1"]
                          .getService(Ci.nsIPrefService);

      // For this._branch we ask that the preferences for extensions.myextension. and children
      this._branch = prefService.getBranch("");

      // Now we queue the interface called nsIPrefBranch2. This interface is described as:
      // "nsIPrefBranch2 allows clients to observe changes to pref values."
      this._branch.QueryInterface(Ci.nsIPrefBranch2);

      // Finally add the observer.
      this._branch.addObserver("", this, false);
    },

    unregister: function() {
      if (!this._branch) return;
      this._branch.removeObserver("", this);
    },

    observe: function(aSubject, aTopic, aData) {
      if(aTopic != "nsPref:changed") return;
      // aSubject is the nsIPrefBranch we're observing (after appropriate QI)
      // aData is the name of the pref that's been changed (relative to aSubject)
      switch (aData) {
        case strings.cheevos.homepageChanged.obs:
          onObservation(strings.cheevos.homepageChanged, true);
          break;
      }
    }
  };
  myPrefObserver.register();
};
