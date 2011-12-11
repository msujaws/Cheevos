// todo: https://etherpad.mozilla.org/SrTmdsPQ5m

exports.main = function(options) {
  const notifications = require("notifications"),
        ss = require("simple-storage").storage,
        obbs = require("observer-service"),
        tabs = require("tabs"),
        urlFactory = require("url"),
        data = require("self").data,
        winUtils = require("window-utils"),
        {Cc,Ci,Cu} = require("chrome"),
        {AboutHandler, ProtocolHandler} = require('./protocol'),
        {MatchPattern} = require("match-pattern"),
        panelFactory = require("panel"),
        tbb = require("toolbarbutton"),
        {unload} = require("unload+"),
        {listen} = require("listen"),
        ao = require("achievement-overlay");

  let protocol = {
    about: function(about, handler) {
      return AboutHandler.extend(handler, { scheme: about }).new()
    },
    protocol: function(scheme, handler) {
      return ProtocolHandler.extend(handler, { scheme: scheme }).new()
    }
  }
  const aboutCheevosUrl = "about:cheevos";

  let objHolder = {};
  Cu.import("resource://gre/modules/PlacesUtils.jsm", objHolder);
  let PlacesUtils = objHolder.PlacesUtils;

  const debug = true;
  log("cheevos loaded");

  const PTS_PER_BASIC  = 5,
        PTS_PER_BRONZE = 5,
        PTS_PER_SILVER = 10,
        PTS_PER_GOLD   = 25;
  let totalAwards = 0,
      acquiredAwards = 0,
      acquiredPoints = 0,
      unloaders = [],
      destroyFuncs = [];

  let strings = {
    cheevos: {
      lwThemeChanged: {
        id: "lightweight-theme-changed",
        obs: "lightweight-theme-changed",
        description: "'Wearing' a persona is just one of the many ways to customize Firefox.",
        hint: "I'm always told that I have multiple personalities.",
        learnMoreUrl: "http://www.getpersonas.com",
        learnMoreLabel: "Your Firefox, Your Style",
        name: "Wardrobe malfunction",
        award: "bronze"
      },
      dmRemoveDownload: {
        id: "download-manager-remove-download",
        obs: "download-manager-remove-download",
        description: "Keeping your downloads list clean can make it easier to find your special files.",
        hint: "Ever wanted to forget something you downloaded?",
        learnMoreUrl: "http://support.mozilla.com/kb/Downloads window",
        learnMoreLabel: "Downloads window",
        name: "Tidy up!",
        subAwards: true,
        bronzeId: "dmRemoveDownloadBronze",
        silverId: "dmRemoveDownloadSilver",
        goldId: "dmRemoveDownloadGold"
      },
      privateBrowsingEnter: {
        id: "private-browsing",
        obs: "private-browsing",
        description: "In Private Browsing mode, Firefox won't keep any history or cookies.",
        hint: "All your secrets are belong to you.",
        learnMoreUrl: "http://support.mozilla.com/kb/Private Browsing",
        learnMoreLabel: "Private Browsing",
        name: "Shopping for jewelry?",
        award: "bronze"
      },
      pmLoginAdded: {
        id: "passwordmgr-storage-changed",
        obs: "passwordmgr-storage-changed",
        description: "The Password Manager securely stores the usernames and passwords so you don't have to.",
        hint: "An improvement over hidden Post-it notes.",
        learnMoreUrl: "http://support.mozilla.com/kb/make-firefox-remember-usernames-and-passwords",
        learnMoreLabel: "Password Manager",
        name: "hunter2",
        award: "bronze"
      },
      homepageChanged: {
        id: "homepageChanged",
        obs: "browser.startup.homepage",
        description: "Setting a homepage allows you to see your favorite webpage every time you open Firefox.",
        hint: "There's no place like home.",
        learnMoreUrl: "http://support.mozilla.com/kb/How to set the home page",
        learnMoreLabel: "Setting a home page",
        name: "Home Sweet Home",
        award: "bronze"
      },
      addOnsOpened: {
        id: "Tools:Addons",
        obs: "Tools:Addons",
        description: "Add-ons provide thousands of extra features and styles to make Firefox your own.",
        hint: "Go-go-gadget!",
        learnMoreUrl: "https://addons.mozilla.org",
        learnMoreLabel: "Find more",
        name: "Inspector Gadget",
        url: "about:addons",
        subAwards: true,
        bronzeId: "addOnsBronze",
        silverId: "addOnsSilver",
        goldId: "addOnsGold",
      },
      aboutMisc: {
        id: "aboutMisc",
        obs: "aboutMisc",
        description: "Mozilla has a long history of adding both quirky and useful about: pages.",
        hint: "Have I ever told you about&hellip;",
        learnMoreUrl: "http://www.mozilla.org",
        learnMoreLabel: "Learn more",
        name: "Let's talk about it",
        subAwards: true,
        bronzeId: "aboutPagesBronze",
        silverId: "aboutPagesSilver",
        goldId: "aboutPagesGold"
        },
      configOpened: {
        id: "about:config",
        obs: "about:config",
        description: "At 'about:config' all user preferences can be viewed and modified.",
        hint: "It's always good to keep you options open.",
        learnMoreUrl: "http://kb.mozillazine.org/About:config",
        learnMoreLabel: "Learn more",
        name: "Super User",
        url: "about:config",
        award: "bronze"
      },
      knowUrRights: {
        id: "about:rights",
        obs: "about:rights",
        description: "You may use, modify, copy and distribute Firefox to others.",
        hint: "The truth won't be told by the few who know. ",
        learnMoreUrl: "http://www.mozilla.org/about/manifesto.html",
        learnMoreLabel: "The Mozilla Manifesto",
        name: "Know Your Rights",
        url: "about:rights",
        award: "bronze"
      },
      frequentFlyer: {
        id: "frequentFlyer",
        obs: "frequentFlyer",
        description: "Open multiple tabs at the same time for super-advanced high speed browsing.",
        hint: "Have you ever been in many places at the same time?",
        name: "Same time, same place",
        subAwards: true,
        bronzeId: "frequentFlyerBronze",
        silverId: "frequentFlyerSilver",
        goldId: "frequentFlyerGold"
      },
      revolutionTelevised: {
        id: "revolutionTelevised",
        obs: "revolutionTelevised",
        description: "Air Mozilla is the Internet multimedia presence of Mozilla.",
        hint: "The Revolution Will Not Be Televised",
        learnMoreUrl: "https://air.mozilla.org",
        learnMoreLabel: "Tune in",
        name: "Mozilla, in Video",
        url: "*.air.mozilla.org",
        award: "bronze"
      },
      yoDawg: {
        id: "yoDawg",
        obs: "chrome://browser/content/browser.xul",
        description: "Firefox is made using XUL, JavaScript, and CSS. Very similar technology to websites.",
        hint: "I heard you like browsers",
        learnMoreUrl: "https://developer.mozilla.org/En/XUL",
        learnMoreLabel: "Learn more",
        name: "Yo Dawg",
        url: "chrome://browser/content/browser.xul",
        award: "silver"
      },
      bookmarkAdded: {
        id: "bookmarkAdded",
        obs: "bookmarkAdded",
        description: "Bookmarks keep track of websites that you would like to come back to.",
        learnMoreUrl: "http://support.mozilla.com/kb/how-do-i-use-bookmarks",
        learnMoreLabel: "Learn more",
        hint: "When you wish upon a star&hellip;",
        name: "Dog eared",
        subAwards: true,
        bronzeId: "bookmarkAddedBronze",
        silverId: "bookmarkAddedSilver",
        goldId: "bookmarkAddedGold"
      },
      feedbackSubmitted: {
        id: "feedbackSubmitted",
        obs: "feedbackSubmitted",
        description: "Your feedback will be used to create a better experience in future releases of Firefox.",
        learnMoreUrl: "https://input.mozilla.org/feedback",
        learnMoreLabel: "Submit more feedback",
        hint: "If you're happy and you know it&hellip;",
        url: /https?:\/\/input.mozilla.(org|com)\/[^/]*\/thanks/,
        name: "Your opinion matters",
        award: "bronze"
      },
    },
    cheevoAcquired: "Cheevo acquired (#1/#2) "
  };

  let totalCheevos = [];
  for (let index in strings.cheevos) {
    totalCheevos[totalCheevos.length] = strings.cheevos[index];
    totalAwards += strings.cheevos[index].subAwards ? 3 : 1;
  }

  for (let i in strings.cheevos) {
    let cheevo = strings.cheevos[i];
    if (cheevo.subAwards) {
      if (ss[cheevo.bronzeId]) {
        acquiredAwards++;
        acquiredPoints += PTS_PER_BRONZE;
      }
      if (ss[cheevo.silverId]) {
        acquiredAwards++;
        acquiredPoints += PTS_PER_SILVER;
      }
      if (ss[cheevo.goldId]) {
        acquiredAwards++;
        acquiredPoints += PTS_PER_GOLD;
      }
    } else if (ss[cheevo.id]) {
      acquiredAwards++;
      acquiredPoints += PTS_PER_BASIC;
    }
  }

  if (!ss.hostCount)
    ss.hostCount = [{},{},{}];
  if (!ss.aboutsVisited)
    ss.aboutsVisited = {};
  if (!ss.aboutsVisitedCount)
    ss.aboutsVisitedCount = 0;
  if (!ss.downloadsRemoved)
    ss.downloadsRemoved = 0;
  if (!ss.bookmarksAdded)
    ss.bookmarksAdded = 0;
  addObs(strings.cheevos.lwThemeChanged.obs, onLightweightThemeChanged, this);
  addObs(strings.cheevos.dmRemoveDownload.obs, onDownloadManagerRemoveDownload, this);
  addObs(strings.cheevos.privateBrowsingEnter.obs, onPrivateBrowsingEnter, this);
  addObs(strings.cheevos.pmLoginAdded.obs, onPMLoginAdded, this);
  tabs.on('ready', onDOMContentLoaded);

  function toolbarbuttonLabel(points) {
    return points.toString() + (points == 1 ? "pt" : "pts");
  };

  let toolbarbutton = tbb.ToolbarButton({
    id: "cheevos-toolbarbutton",
    label: toolbarbuttonLabel(acquiredAwards),
    alwaysShowLabel: true,
    title: "Cheevos",
    image: data.url("trophy_icon.png"),
    onCommand: function () { loadCheevosPage(); }
  });
  if (!ss[strings.cheevos.addOnsOpened.goldId]) {
    toolbarbutton.moveTo({
      toolbarID: "nav-bar",
      forceMove: true
    });
  }
  let achievementOverlay = ao.AchievementOverlay({
    id: "cheevos-achievementOverlay",
    onCommand: function () { loadCheevosPage(); }
  });
  let sss = Cc["@mozilla.org/content/style-sheet-service;1"]
              .getService(Ci.nsIStyleSheetService);
  let ios = Cc["@mozilla.org/network/io-service;1"]
              .getService(Ci.nsIIOService);
  let toolbarbuttonStylesheet = data.url("toolbarbutton.css");
  log(toolbarbuttonStylesheet);
  let uri = ios.newURI(toolbarbuttonStylesheet, null, null);
  sss.loadAndRegisterSheet(uri, sss.AGENT_SHEET);

  // show cheevo for installing the addon
  onObservation(strings.cheevos.addOnsOpened, true, "bronze");

  function addObs(topic, callback, thisRef) {
    obbs.add(topic, callback, thisRef);
  }

  function log(aMessage) {
    if (debug)
      console.info("cheevos: " + aMessage);
  }

  function cheevoTitle() {
    return strings.cheevoAcquired.replace("#1", acquiredAwards)
                                 .replace("#2", totalAwards);
  }

  function getCheevoListBlockText() {
    log("getCheevoListBlockText");
    let h = '';
    for (let i in totalCheevos) {
      let cheevo = totalCheevos[i];
      let achieved = cheevo.subAwards ? ss[cheevo.goldId] : ss[cheevo.id];
      if (cheevo.subAwards)
        h += ss[cheevo.goldId] ? "<li class='cheevo-block awards achieved'>" : "<li class='cheevo-block'>";
      else
        h += ss[cheevo.id] ? "<li class='cheevo-block achieved'>" : "<li class='cheevo-block'>";
      h += "<h3 class=name>" + cheevo.name + "</h3>"
      h += "<p class=message>" + (achieved ? cheevo.description : cheevo.hint) + "</p>";
      if (cheevo.subAwards) {
        h += "<ol class=awards>";
        if (ss[cheevo.bronzeId])
          h += "<li class='bronze achieved' title='" + ss[cheevo.bronzeId] + "'></li>";
        else
          h += "<li class='bronze'></li>";
        if (ss[cheevo.silverId])
          h += "<li class='silver achieved' title='" + ss[cheevo.silverId] + "'></li>";
        else
          h += "<li class='silver'></li>";
        if (ss[cheevo.goldId])
          h += "<li class='gold achieved' title='" + ss[cheevo.goldId] + "'></li>";
        else
          h += "<li class='gold'></li>";
        h += "</ol>";
      } else {
        if (ss[cheevo.id])
          h += "<div class='" + cheevo.award + "' title='" + ss[cheevo.id] + "'></div>";
        else
          h += "<div class='" + cheevo.award + "'></div>";

      }
      if (achieved && cheevo.learnMoreUrl && cheevo.learnMoreLabel) {
        h += "<div class=learnMore><a href='" + cheevo.learnMoreUrl + "'>" + cheevo.learnMoreLabel + "</a></div>";
      }
      h += "</li>";
    }
    return h;
  }

  function onCheevosPageOpened(tab, cheevo) {
    let title = cheevoTitle();
    log("onCheevosPageOpened: " + cheevo);
    let styleCss = data.url("cheevo.css");
    if (!cheevo) {
      cheevo = {};
      cheevo.name = "Cheevos for Firefox"
      cheevo.description = "Use Firefox, gain achievements."
      title = "";
    }
    tab.attach({
      contentScriptFile: data.url("cheevo.js"),
      contentScript: "populateTemplate('" + escape(cheevo.name) + "','" + escape(cheevo.description) +
                                       "','" + escape(title) + "','" + escape(getCheevoListBlockText()) + "','" + escape(styleCss) + "');"
    });
  }

  function loadCheevosPage(cheevo) {
    tabs.open({
      url: aboutCheevosUrl,
      onReady: function onReady(tab) { onCheevosPageOpened(tab, cheevo); }
    });
  }

  function notify(cheevo) {
    log("showing notification: " + cheevo.name);

    // commented out until the overlay looks good enough
    //achievementOverlay.show();
    notifications.notify({
      title: cheevoTitle() + cheevo.name,
      text: cheevo.hint,
      iconURL: data.url("trophy.gif"),
      onClick: function() { loadCheevosPage(cheevo); }
    });
  }

  function onObservation(cheevo, shouldShow, specificAward) {
    log("onObservation: " + cheevo.obs);
    function acquireCheevo(cheevo, id) {
      if (!ss[id]) {
        ss[id] = new Date().toDateString();
        acquiredAwards++;
        notify(cheevo);
        toolbarbutton.updateLabel(toolbarbuttonLabel(acquiredPoints));
      };
    };
    if (!shouldShow)
      return;
    if (specificAward) {
      switch (specificAward) {
        case "bronze":
          if (ss[cheevo.bronzeId])
            return;
          acquiredPoints += PTS_PER_BRONZE;
          acquireCheevo(cheevo, cheevo.bronzeId);
          break;
        case "silver":
          if (ss[cheevo.silverId])
            return;
          acquiredPoints += PTS_PER_SILVER;
          acquireCheevo(cheevo, cheevo.silverId);
          break;
        case "gold":
          if (ss[cheevo.goldId])
            return;
          acquiredPoints += PTS_PER_GOLD;
          acquireCheevo(cheevo, cheevo.goldId);
          break;
        default:
          console.error("Cheevo: Unexpected observation specificAward");
          break;
      }
    } else {
      if (ss[cheevo.bronzeId])
        return;
      acquiredPoints += PTS_PER_BASIC;
      acquireCheevo(cheevo, cheevo.id);
    }
  }

  function onURLOpened(cheevo) {
    return onObservation(cheevo, true);
  }

  function onLightweightThemeChanged(subject, data) {
    onObservation(strings.cheevos.lwThemeChanged, true);
  }

  function onDownloadManagerRemoveDownload(subject, data) {
    ss.downloadsRemoved++;
    if (subject) {
      if (ss.downloadsRemoved >= 1)
        onObservation(strings.cheevos.dmRemoveDownload, true, "bronze");
      if (ss.downloadsRemoved >= 3)
        onObservation(strings.cheevos.dmRemoveDownload, true, "silver");
    } else {
      onObservation(strings.cheevos.dmRemoveDownload, true, "bronze");
      onObservation(strings.cheevos.dmRemoveDownload, true, "silver");
      onObservation(strings.cheevos.dmRemoveDownload, true, "gold");
    }
  }

  function onPrivateBrowsingEnter(subject, data) {
    onObservation(strings.cheevos.privateBrowsingEnter, data == "enter");
  }

  function onPMLoginAdded(subject, data) {
    onObservation(strings.cheevos.pmLoginAdded, data == "addLogin");
  }

  function onBookmarkAdded() {
    ss.bookmarksAdded++;
    onObservation(strings.cheevos.bookmarkAdded, true, "bronze");
    if (ss.bookmarksAdded > 100)
      onObservation(strings.cheevos.bookmarkAdded, true, "silver");
    if (ss.bookmarksAdded > 1000)
      onObservation(strings.cheevos.bookmarkAdded, true, "gold");
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

    if (tab.url.toLowerCase() == aboutCheevosUrl) {
      onCheevosPageOpened(tab);
      return;
    }

    url = urlFactory.URL(tab.url);
    for (let index in strings.cheevos) {
      if ("url" in strings.cheevos[index]) {
        var pattern = new MatchPattern(strings.cheevos[index].url);
        if (pattern.test(tab.url)) {
          if (strings.cheevos[index] == strings.cheevos.addOnsOpened)
            onObservation(strings.cheevos.addOnsOpened, true, "silver");
          else
            onURLOpened(strings.cheevos[index]);
        }
      }
    }

    if (tab.url.toLowerCase().indexOf("about:") == 0 &&
        tab.url.toLowerCase() != "about:home" &&
        tab.url.toLowerCase() != "about:blank" &&
        tab.url.toLowerCase() != "about:privatebrowsing" &&
        tab.url.toLowerCase() != "about:sessionrestore" &&
        !(tab.url.toLowerCase() in ss.aboutsVisited)) {
      ss.aboutsVisited[tab.url.toLowerCase()] = true;
      ss.aboutsVisitedCount++;
      if (ss.aboutsVisitedCount >= 3)
        onObservation(strings.cheevos.aboutMisc, true, "bronze");
      if (ss.aboutsVisitedCount >= 9)
        onObservation(strings.cheevos.aboutMisc, true, "silver");
      if (ss.aboutsVisitedCount >= 19)
        onObservation(strings.cheevos.aboutMisc, true, "gold");
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
        if (window.location != "chrome://browser/content/browser.xul")
          return;

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
      function addCustomizationEventListener(window) {
        function acquireGoldAddonsAchievement() {
          onObservation(strings.cheevos.addOnsOpened, true, "bronze");
          onObservation(strings.cheevos.addOnsOpened, true, "silver");
          onObservation(strings.cheevos.addOnsOpened, true, "gold");
        }
        window.addEventListener("aftercustomization", function() { acquireGoldAddonsAchievement(); }, false);

        // add unloader to unload+'s queue
        var unloadFunc = function() {
          // todo: this event listener isn't being removed
          //window.removeEventListener("aftercustomization", acquireGoldAddonsAchievement, false);
        };
        var index = destroyFuncs.push(unloadFunc) - 1;
        listen(window, window, "unload", function() {
          destroyFuncs[index] = null;
        }, false);
        unloaders.push(unload(unloadFunc, window));
      }
      addMenuItem(window);
      addCustomizationEventListener(window);
    },
    onUntrack: function (window) {
      if (window.location == "chrome://browser/content/browser.xul") {
        log("removing menu item");
        const fileMenuitemID = "menu_CheevoItem";
        var $ = function(id) window.document.getElementById(id);
        var menuitem = $(fileMenuitemID);
        menuitem && menuitem.parentNode.removeChild(menuitem);
      }

      // run unload functions
      destroyFuncs.forEach(function(f) f && f());
      destroyFuncs.length = 0;

      // remove unload functions from unload+'s queue
      unloaders.forEach(function(f) f());
      unloaders.length = 0;
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

  var bmsvc = Cc["@mozilla.org/browser/nav-bookmarks-service;1"]
                .getService(Ci.nsINavBookmarksService);
  var myExt_bookmarkListener = {
    onBeforeItemRemoved: function() {},
    onBeginUpdateBatch: function() {},
    onEndUpdateBatch: function() {},
    onFolderAdded: function() {},
    onFolderChanged: function() {},
    onFolderMoved: function() {},
    onFolderRemoved: function() {},
    onItemAdded: function(aItemId, aParentId, aIndex, aItemType, aURI) { if (!PlacesUtils.itemIsLivemark(aParentId)) onBookmarkAdded(); },
    onItemChanged: function() {},
    onItemMoved: function() {},
    onItemRemoved: function() {},
    onItemReplaced: function() {},
    onItemVisited: function() {},
    onSeparatorAdded: function() {},
    onSeparatorRemoved: function() {}
  };
  bmsvc.addObserver(myExt_bookmarkListener, false);

  let aboutCheevosHandler = protocol.about('cheevos', {
    onRequest: function(request, response) {
      log("about cheevos request");
      response.uri = data.url("cheevo.html");
    }
  });
  aboutCheevosHandler.register();
};
