exports.main = function(options) {
  const {AboutHandler, ProtocolHandler} = require('protocol'),
        ao = require("achievement-overlay"),
        BrandStringBundle = require("app-strings").StringBundle("chrome://branding/locale/brand.properties"),
        {Cc,Ci,Cu} = require("chrome"),
        data = require("self").data,
        {listen} = require("listen"),
        {MatchPattern} = require("match-pattern"),
        obbs = require("observer-service"),
        panelFactory = require("panel"),
        ss = require("simple-storage").storage,
        tabs = require("tabs"),
        tbb = require("toolbarbutton"),
        {unload} = require("unload+"),
        urlFactory = require("url"),
        winUtils = require("window-utils"),
        _ = require("l10n").get;

  const brandShortName = BrandStringBundle.get("brandShortName");
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

  const debug = false;
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
  let socialSites = ["*.facebook.com",
                     "*.twitter.com",
                     "*.linkedin.com",
                     "*.myspace.com",
                     "*.ning.com",
                     "*.plus.google.com",
                     "*.tagged.com",
                     "*.orkut.com",
                     "*.hi5.com",
                     "*.renren.com"],
      geekCredSites = ["*.reddit.com",
                       "*.stackoverflow.com",
                       "*.ycombinator.com",
                       "*.slashdot.org",
                       "*.stumbleupon.com"];

  let cheevos = {
    lwThemeChanged: {
      id: "lightweight-theme-changed",
      obs: "lightweight-theme-changed",
      description: _("lwThemeChanged.description", brandShortName),
      hint: _("lwThemeChanged.hint"),
      learnMoreUrl: "http://www.getpersonas.com",
      learnMoreLabel: _("lwThemeChanged.learnMoreLabel", brandShortName),
      name: _("lwThemeChanged.name"),
      subAwards: true,
      bronzeId: "lightweight-theme-changed", /* migrated from generic award */
      silverId: "lightweight-theme-changedSilver",
      goldId: "lightweight-theme-changedGold"
    },
    dmRemoveDownload: {
      id: "download-manager-remove-download",
      obs: "download-manager-remove-download",
      description: _("dmRemoveDownload.description"),
      hint: _("dmRemoveDownload.hint"),
      learnMoreUrl: "http://support.mozilla.com/kb/Downloads window",
      learnMoreLabel: _("dmRemoveDownload.learnMoreLabel"),
      name: _("dmRemoveDownload.name"),
      subAwards: true,
      bronzeId: "dmRemoveDownloadBronze",
      silverId: "dmRemoveDownloadSilver",
      goldId: "dmRemoveDownloadGold"
    },
    privateBrowsingEnter: {
      id: "private-browsing",
      obs: "private-browsing",
      description: _("privateBrowsingEnter.description", brandShortName),
      hint: _("privateBrowsingEnter.hint"),
      learnMoreUrl: "http://support.mozilla.com/kb/Private Browsing",
      learnMoreLabel: _("privateBrowsingEnter.learnMoreLabel"),
      name: _("privateBrowsingEnter.name"),
      subAwards: true,
      bronzeId: "private-browsing", /* migrated from generic award */
      silverId: "private-browsingSilver",
      goldId: "private-browsingGold",
    },
    pmLoginAdded: {
      id: "passwordmgr-storage-changed",
      obs: "passwordmgr-storage-changed",
      description: _("pmLoginAdded.description"),
      hint: _("pmLoginAdded.hint"),
      learnMoreUrl: "http://support.mozilla.com/kb/make-firefox-remember-usernames-and-passwords",
      learnMoreLabel: _("pmLoginAdded.learnMoreLabel"),
      name: _("pmLoginAdded.name"),
      subAwards: true,
      bronzeId: "passwordmgr-storage-changed", /* migrated from generic award */
      silverId: "passwordmgr-storage-changedSilver",
      goldId: "passwordmgr-storage-changedGold",
    },
    homepageChanged: {
      id: "homepageChanged",
      obs: "browser.startup.homepage",
      description: _("homepageChanged.description", brandShortName),
      hint: _("homepageChanged.hint"),
      learnMoreUrl: "http://support.mozilla.com/kb/How to set the home page",
      learnMoreLabel: _("homepageChanged.learnMoreLabel"),
      name: _("homepageChanged.name"),
      award: "bronze",
    },
    addOnsOpened: {
      id: "Tools:Addons",
      obs: "Tools:Addons",
      description: _("addOnsOpened.description", brandShortName),
      hint: _("addOnsOpened.hint"),
      learnMoreUrl: "https://addons.mozilla.org",
      learnMoreLabel: _("addOnsOpened.learnMoreLabel"),
      name: _("addOnsOpened.name"),
      url: "about:addons",
      subAwards: true,
      bronzeId: "addOnsBronze",
      silverId: "addOnsSilver",
      goldId: "addOnsGold",
    },
    aboutMisc: {
      id: "aboutMisc",
      obs: "aboutMisc",
      description: _("aboutMisc.description"),
      hint: _("aboutMisc.hint"),
      learnMoreUrl: "http://www.mozilla.org",
      learnMoreLabel: _("aboutMisc.learnMoreLabel"),
      name: _("aboutMisc.name"),
      subAwards: true,
      bronzeId: "aboutPagesBronze",
      silverId: "aboutPagesSilver",
      goldId: "aboutPagesGold",
    },
    configOpened: {
      id: "about:config",
      obs: "about:config",
      description: _("configOpened.description"),
      hint: _("configOpened.hint"),
      learnMoreUrl: "http://kb.mozillazine.org/About:config",
      learnMoreLabel: _("configOpened.learnMoreLabel"),
      name: _("configOpened.name"),
      url: "about:config",
      award: "silver",  /* migrated from generic award */
      subAwards: true,
      bronzeId: "about:configBronze",
      silverId: "about:config", /* migrated from generic award */
      goldId: "about:configGold",
    },
    knowUrRights: {
      id: "about:rights",
      obs: "about:rights",
      description: _("knowUrRights.description", brandShortName),
      hint: _("knowUrRights.hint"),
      learnMoreUrl: "http://www.mozilla.org/about/manifesto.html",
      learnMoreLabel: _("knowUrRights.learnMoreLabel"),
      name: _("knowUrRights.name"),
      url: "about:rights",
      award: "bronze",
    },
    frequentFlyer: {
      id: "frequentFlyer",
      obs: "frequentFlyer",
      description: _("frequentFlyer.description"),
      hint: _("frequentFlyer.hint"),
      name: _("frequentFlyer.name"),
      subAwards: true,
      bronzeId: "frequentFlyerBronze",
      silverId: "frequentFlyerSilver",
      goldId: "frequentFlyerGold",
    },
    revolutionTelevised: {
      id: "revolutionTelevised",
      obs: "revolutionTelevised",
      description: _("revolutionTelevised.description"),
      hint: _("revolutionTelevised.hint"),
      learnMoreUrl: "https://air.mozilla.org",
      learnMoreLabel: _("revolutionTelevised.learnMoreLabel"),
      name: _("revolutionTelevised.name"),
      url: "*.air.mozilla.org",
      award: "bronze",
    },
    yoDawg: {
      id: "yoDawg",
      obs: "chrome://browser/content/browser.xul",
      description: _("yoDawg.description", brandShortName),
      hint: _("yoDawg.hint"),
      learnMoreUrl: "https://developer.mozilla.org/En/XUL",
      learnMoreLabel: _("yoDawg.learnMoreLabel"),
      name: _("yoDawg.name"),
      url: "chrome://browser/content/browser.xul",
      award: "bronze",
    },
    bookmarkAdded: {
      id: "bookmarkAdded",
      obs: "bookmarkAdded",
      description: _("bookmarkAdded.description"),
      learnMoreUrl: "http://support.mozilla.com/kb/how-do-i-use-bookmarks",
      learnMoreLabel: _("bookmarkAdded.learnMoreLabel"),
      hint: _("bookmarkAdded.hint"),
      name: _("bookmarkAdded.name"),
      subAwards: true,
      bronzeId: "bookmarkAddedBronze",
      silverId: "bookmarkAddedSilver",
      goldId: "bookmarkAddedGold",
    },
    feedbackSubmitted: {
      id: "feedbackSubmitted",
      obs: "feedbackSubmitted",
      description: _("feedbackSubmitted.description", brandShortName),
      learnMoreUrl: "https://input.mozilla.org/feedback",
      learnMoreLabel: _("feedbackSubmitted.learnMoreLabel"),
      hint: _("feedbackSubmitted.hint"),
      url: /https?:\/\/input.mozilla.(org|com)\/[^/]*\/thanks/,
      name: _("feedbackSubmitted.name"),
      award: "bronze",
    },
    releaseChannels: {
      id: "releaseChannels",
      obs: "releaseChannels",
      description: _("releaseChannels.description", brandShortName),
      learnMoreUrl: "http://www.mozilla.org/projects/firefox/prerelease.html",
      learnMoreLabel: _("releaseChannels.learnMoreLabel", brandShortName),
      hint: _("releaseChannels.hint"),
      name: _("releaseChannels.name"),
      subAwards: true,
      bronzeId: "releaseChannelsBronze",
      silverId: "releaseChannelsSilver",
      goldId: "releaseChannelsGold",
      hidden: true,
    },
    devTools: {
      id: "devTools",
      obs: "devTools",
      description: _("devTools.description", brandShortName),
      learnMoreUrl: "http://hacks.mozilla.org/category/developer-tools/",
      learnMoreLabel: _("devTools.learnMoreLabel"),
      hint: _("devTools.hint"),
      name: _("devTools.name"),
      subAwards: true,
      bronzeId: "devToolsBronze",
      silverId: "devToolsSilver",
      goldId: "devToolsGold",
    },
    sociallyAwesomePenguin: {
      id: "sociallyAwesomePenguin",
      obs: "sociallyAwesomePenguin",
      description: _("sociallyAwesomePenguin.description"),
      hint: _("sociallyAwesomePenguin.hint"),
      name: _("sociallyAwesomePenguin.name"),
      subAwards: true,
      bronzeId: "sociallyAwesomePenguinBronze",
      silverId: "sociallyAwesomePenguinSilver",
      goldId: "sociallyAwesomePenguinGold",
    },
    socialButterfly: {
      id: "socialButterfly",
      obs: "socialButterfly",
      description: _("socialButterfly.description", brandShortName),
      hint: _("socialButterfly.hint"),
      name: _("socialButterfly.name"),
      subAwards: true,
      bronzeId: "socialButterflyBronze",
      silverId: "socialButterflySilver",
      goldId: "socialButterflyGold",
    },
    tabCandy: {
      id: "tabCandy",
      obs: "tabCandy",
      description: _("tabCandy.description"),
      hint: _("tabCandy.hint"),
      name: _("tabCandy.name"),
      subAwards: true,
      bronzeId: "tabCandyBronze",
      silverId: "tabCandySilver",
      goldId: "tabCandyGold",
      hidden: true,
    },
    concurrentTabs: {
      id: "concurrentTabs",
      obs: "concurrentTabs",
      description: _("concurrentTabs.description"),
      hint: _("concurrentTabs.hint"),
      name: _("concurrentTabs.name"),
      subAwards: true,
      bronzeId: "concurrentTabsBronze",
      silverId: "concurrentTabsSilver",
      goldId: "concurrentTabsGold",
      hidden: true,
    },
    geekCred: {
      id: "geekCred",
      obs: "geekCred",
      description: _("geekCred.description"),
      hint: _("geekCred.hint"),
      name: _("geekCred.name"),
      subAwards: true,
      bronzeId: "geekCredBronze",
      silverId: "geekCredSilver",
      goldId: "geekCredGold",
    }
  };

  let totalCheevos = [];
  for (let index in cheevos) {
    totalCheevos[totalCheevos.length] = cheevos[index];
    totalAwards += cheevos[index].subAwards ? 3 : 1;
  }

  if (!ss.cheevosAcquired)
    ss.cheevosAcquired = {};

  for (let i in cheevos) {
    let cheevo = cheevos[i];
    if (cheevo.subAwards) {
      if (ss.cheevosAcquired[cheevo.bronzeId]) {
        acquiredAwards++;
        acquiredPoints += PTS_PER_BRONZE;
      }
      if (ss.cheevosAcquired[cheevo.silverId]) {
        acquiredAwards++;
        acquiredPoints += PTS_PER_SILVER;
      }
      if (ss.cheevosAcquired[cheevo.goldId]) {
        acquiredAwards++;
        acquiredPoints += PTS_PER_GOLD;
      }
    } else if (ss.cheevosAcquired[cheevo.id]) {
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
  if (!ss.tabsCount)
    ss.tabsCount = 1;
  if (!ss.socialVisits) {
    ss.socialVisits = 0;
    ss.specificSocialSiteVisits = {};
  }
  if (!ss.newsSites)
    ss.newsSites = 0;
  if (!ss.privateBrowsingEntrances)
    ss.privateBrowsingEntrances = 0;
  if (!ss.lwThemeChanges)
    ss.lwThemeChanges = 0;
  if (!ss.pmLoginsAdded)
    ss.pmLoginsAdded = 0;
  if (!ss.scratchPadOpenings)
    ss.scratchPadOpenings = 0;
  if (!ss.errorConsoleOpenings)
    ss.errorConsoleOpenings = 0;
  if (!ss.viewSourceOpenings)
    ss.viewSourceOpenings = 0;
  if (!ss.geekCredVisits)
    ss.geekCredVisits = 0;
  addObs(cheevos.lwThemeChanged.obs, onLightweightThemeChanged, this);
  addObs(cheevos.dmRemoveDownload.obs, onDownloadManagerRemoveDownload, this);
  addObs(cheevos.privateBrowsingEnter.obs, onPrivateBrowsingEnter, this);
  addObs(cheevos.pmLoginAdded.obs, onPMLoginAdded, this);
  tabs.on('ready', onDOMContentLoaded);

  let toolbarbutton = tbb.ToolbarButton({
    id: "cheevos-toolbarbutton",
    label: _("points", acquiredPoints.toString()),
    title: _("addOnShortName"),
    image: data.url("coins.png"),
    onCommand: function () {
      let aboutCheevosAlreadyOpen = false;
      for each (let tab in tabs) {
        if (tab.url == aboutCheevosUrl) {
          aboutCheevosAlreadyOpen = true;
          tab.activate();
          tab.reload();
        }
      }

      if (!aboutCheevosAlreadyOpen)
        loadCheevosPage();
    }
  });
  if (!ss.cheevosAcquired[cheevos.addOnsOpened.goldId]) {
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
  let chromeStylesheet = data.url("chrome.css");
  let chromeStylesheetUri = ios.newURI(chromeStylesheet, null, null);
  sss.loadAndRegisterSheet(chromeStylesheetUri, sss.AGENT_SHEET);

  // show cheevo for installing the addon
  onObservation(cheevos.addOnsOpened, true, "bronze");

  function addObs(topic, callback, thisRef) {
    obbs.add(topic, callback, thisRef);
  }

  function log(aMessage) {
    if (debug)
      console.info("cheevos: " + aMessage);
  }

  function getCheevoListBlockText() {
    log("getCheevoListBlockText");
    let h = '';
    for (let i in totalCheevos) {
      let cheevo = totalCheevos[i];
      if (cheevo.hidden && !ss.cheevosAcquired[cheevo.id] && !ss.cheevosAcquired[cheevo.bronzeId] &&
          !ss.cheevosAcquired[cheevo.silverId] && !ss.cheevosAcquired[cheevo.goldId])
        continue;
      let achieved = cheevo.subAwards ? ss.cheevosAcquired[cheevo.goldId] : ss.cheevosAcquired[cheevo.id];
      log(cheevo.id + " is " + (achieved ? "achieved" : "not achieved"));
      if (cheevo.subAwards)
        h += achieved ? "<li class='cheevo-block awards achieved'>" : "<li class='cheevo-block'>";
      else
        h += achieved ? "<li class='cheevo-block achieved'>" : "<li class='cheevo-block'>";
      h += "<h3 class=name>" + cheevo.name + "</h3>"
      h += "<p class=message>" + (achieved ? cheevo.description : cheevo.hint) + "</p>";
      if (cheevo.subAwards) {
        h += "<ol class=awards>";
        if (ss.cheevosAcquired[cheevo.bronzeId])
          h += "<li class='bronze achieved' title='" + ss.cheevosAcquired[cheevo.bronzeId] + "'></li>";
        else
          h += "<li class='bronze'></li>";
        if (ss.cheevosAcquired[cheevo.silverId])
          h += "<li class='silver achieved' title='" + ss.cheevosAcquired[cheevo.silverId] + "'></li>";
        else
          h += "<li class='silver'></li>";
        if (ss.cheevosAcquired[cheevo.goldId])
          h += "<li class='gold achieved' title='" + ss.cheevosAcquired[cheevo.goldId] + "'></li>";
        else
          h += "<li class='gold'></li>";
        h += "</ol>";
      } else {
        if (ss.cheevosAcquired[cheevo.id])
          h += "<div class='" + cheevo.award + "' title='" + ss.cheevosAcquired[cheevo.id] + "'></div>";
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

  function onCheevosPageOpened(tab) {
    log("onCheevosPageOpened");
    let tweetText = _("tweetText", acquiredPoints, _("addOnShortName"), brandShortName);
    let stats = _("stats", acquiredPoints, acquiredAwards, totalAwards);
    let addOnFullName = _("addOnFullName", _("addOnShortName"), brandShortName);
    let addOnTagLine = _("addOnTagLine", brandShortName);
    let addOnHomepageLink = _("addOnHomepageLink");
    let supportLink = _("supportLink");
    let authorHomepageLink = _("authorHomepageLink");
    let styleCss = data.url("cheevo.css");
    tab.attach({
      contentScriptFile: data.url("cheevo.js"),
      contentScript: "populateTemplate('" + escape(tweetText) + "','" + escape(stats) + "','" +
                                       escape(getCheevoListBlockText()) + "','" + escape(styleCss) + "','" +
                                       escape(addOnFullName) + "','" + escape(addOnTagLine) + "','" +
                                       escape(addOnHomepageLink) + "','" + escape(supportLink) + "','" + escape(authorHomepageLink) + "');",
    });
  }

  function loadCheevosPage() {
    tabs.open({
      url: aboutCheevosUrl,
      onReady: function onReady(tab) { onCheevosPageOpened(tab); }
    });
  }

  function notify(cheevo, points, awardsClass) {
    log("showing notification: " + cheevo.name);

    for each (let tab in tabs) {
      if (tab.url == aboutCheevosUrl) {
        tab.reload();
      }
    }

    achievementOverlay.show({
      title: cheevo.name,
      text: cheevo.hint,
      points: points,
      awardsClass: awardsClass,
    });
  }

  function updateToolbarButtonLabel(aPoints) {
    let text = _("points", aPoints.toString());
    for each (var win in winUtils.windowIterator()) {
      if ("chrome://browser/content/browser.xul" != win.location) return;

      let doc = win.document;
      let $ = function (id) doc.getElementById(id);
      let t = $("cheevos-toolbarbutton");
      if (t) {
        t.setAttribute("label", text);
        t.setAttribute("tooltiptext", text);
        _generateNewIcon(t, aPoints.toString());
      }
    }
  }

  function _generateNewIcon(t, aOverlayText) {
    let XHTML_NS = 'http://www.w3.org/1999/xhtml';
    let doc = t.ownerDocument;
    let canvas = doc.createElementNS(XHTML_NS, 'canvas');
    canvas.setAttribute("width", 16);
    canvas.setAttribute("height", 16);
    let ctx = canvas.getContext("2d");

    let img = doc.createElementNS(XHTML_NS, 'img');
    img.onload = function() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      if (aOverlayText) {
        ctx.textBaseline = "top";
        ctx.textAlign = "center";
        ctx.font = "9px sans-serif";
        let height = 9;
        let y = canvas.height - height - 1;  // 1 = bottom padding
        ctx.fillStyle = "#000";
        ctx.strokeStyle = "#F5DEB3";
        ctx.lineWidth = 4;
        ctx.strokeText(aOverlayText, canvas.width / 2, y);
        ctx.fillText(aOverlayText, canvas.width / 2, y);
        t.setAttribute("image", canvas.toDataURL("image/png"));
      }
    };
    img.src = t.getAttribute("image");
  }

  function onObservation(cheevo, shouldShow, specificAward) {
    log("onObservation: " + cheevo.obs);
    function acquireCheevo(cheevo, id, points, awardsClass) {
      if (!ss.cheevosAcquired[id]) {
        ss.cheevosAcquired[id] = new Date().toDateString();
        acquiredAwards++;
        notify(cheevo, points, awardsClass);
        updateToolbarButtonLabel(acquiredPoints);
      };
    };
    if (!shouldShow)  
      return;
    if (specificAward) {
      switch (specificAward) {
        case "bronze":
          if (ss.cheevosAcquired[cheevo.bronzeId])
            return;
          acquiredPoints += PTS_PER_BRONZE;
          acquireCheevo(cheevo, cheevo.bronzeId, PTS_PER_BRONZE, "bronze");
          break;
        case "silver":
          if (ss.cheevosAcquired[cheevo.silverId])
            return;
          acquiredPoints += PTS_PER_SILVER;
          acquireCheevo(cheevo, cheevo.silverId, PTS_PER_SILVER, "silver");
          break;
        case "gold":
          if (ss.cheevosAcquired[cheevo.goldId])
            return;
          acquiredPoints += PTS_PER_GOLD;
          acquireCheevo(cheevo, cheevo.goldId, PTS_PER_GOLD, "gold");
          break;
        default:
          console.error("Cheevo: Unexpected observation specificAward: " + specificAward);
          break;
      }
    } else {
      if (ss.cheevosAcquired[cheevo.id])
        return;
      acquiredPoints += PTS_PER_BASIC;
      acquireCheevo(cheevo, cheevo.id, PTS_PER_BASIC, "bronze generic");
    }
  }

  function onURLOpened(cheevo) {
    return onObservation(cheevo, true, (cheevo.award != "bronze") ? cheevo.award : false);
  }

  function onLightweightThemeChanged(subject, data) {
    ss.lwThemeChanges++;
    onObservation(cheevos.lwThemeChanged, true, "bronze");
    if (ss.lwThemeChanges > 10)
      onObservation(cheevos.lwThemeChanged, true, "silver");
    if (ss.lwThemeChanges > 50)
      onObservation(cheevos.lwThemeChanged, true, "gold");
  }

  function onDownloadManagerRemoveDownload(subject, data) {
    ss.downloadsRemoved++;
    if (subject) {
      if (ss.downloadsRemoved >= 1)
        onObservation(cheevos.dmRemoveDownload, true, "bronze");
      if (ss.downloadsRemoved >= 3)
        onObservation(cheevos.dmRemoveDownload, true, "silver");
    } else {
      onObservation(cheevos.dmRemoveDownload, true, "bronze");
      onObservation(cheevos.dmRemoveDownload, true, "silver");
      onObservation(cheevos.dmRemoveDownload, true, "gold");
    }
  }

  function onPrivateBrowsingEnter(subject, data) {
    ss.privateBrowsingEntrances++;
    onObservation(cheevos.privateBrowsingEnter, data == "enter", "bronze");
    if (ss.privateBrowsingEntrances > 10)
      onObservation(cheevos.privateBrowsingEnter, data == "enter", "silver");
    if (ss.privateBrowsingEntrances > 50)
      onObservation(cheevos.privateBrowsingEnter, data == "enter", "gold");
  }

  function onPMLoginAdded(subject, data) {
    if (data == "addLogin")
      ss.pmLoginsAdded++;
    onObservation(cheevos.pmLoginAdded, data == "addLogin", "bronze");
    if (ss.pmLoginsAdded > 10)
      onObservation(cheevos.pmLoginAdded, data == "addLogin", "silver");
    if (ss.pmLoginsAdded > 20)
      onObservation(cheevos.pmLoginAdded, data == "addLogin", "gold");
  }

  function onBookmarkAdded() {
    ss.bookmarksAdded++;
    onObservation(cheevos.bookmarkAdded, true, "bronze");
    if (ss.bookmarksAdded > 10)
      onObservation(cheevos.bookmarkAdded, true, "silver");
    if (ss.bookmarksAdded > 25)
      onObservation(cheevos.bookmarkAdded, true, "gold");
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
    for (let index in cheevos) {
      if ("url" in cheevos[index]) {
        var pattern = new MatchPattern(cheevos[index].url);
        if (pattern.test(tab.url)) {
          if (cheevos[index] == cheevos.addOnsOpened)
            onObservation(cheevos.addOnsOpened, true, "silver");
          else
            onURLOpened(cheevos[index]);
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
        onObservation(cheevos.aboutMisc, true, "bronze");
      if (ss.aboutsVisitedCount >= 9)
        onObservation(cheevos.aboutMisc, true, "silver");
      if (ss.aboutsVisitedCount >= 19)
        onObservation(cheevos.aboutMisc, true, "gold");
    }

    for (var i = 0; i < socialSites.length; i++) {
      let socialSite = socialSites[i];
      if (new MatchPattern(socialSite).test(tab.url)) {
        ss.socialVisits++;
        if (ss.socialVisits >= 3)
          onObservation(cheevos.socialButterfly, true, "bronze");
        if (ss.socialVisits >= 10)
          onObservation(cheevos.socialButterfly, true, "silver");
        if (ss.socialVisits >= 20)
          onObservation(cheevos.socialButterfly, true, "gold");
        if (socialSite in ss.specificSocialSiteVisits) {
          let specificSocialSiteVisit = ++ss.specificSocialSiteVisits[socialSite];
          if (specificSocialSiteVisit >= 5 && specificSocialSiteVisit != ss.socialVisits)
            onObservation(cheevos.sociallyAwesomePenguin, true, "bronze");
          if (specificSocialSiteVisit >= 15 && specificSocialSiteVisit != ss.socialVisits)
            onObservation(cheevos.sociallyAwesomePenguin, true, "silver");
          if (specificSocialSiteVisit >= 25 && specificSocialSiteVisit != ss.socialVisits)
            onObservation(cheevos.sociallyAwesomePenguin, true, "gold");
        } else {
          ss.specificSocialSiteVisits[socialSite] = 1;
        }
        break;
      }
    }

    for (var i = 0; i < geekCredSites.length; i++) {
      let geekCredSite = geekCredSites[i];
      if (new MatchPattern(geekCredSite).test(tab.url)) {
        ss.geekCredVisits++;
        if (ss.geekCredVisits >= 3)
          onObservation(cheevos.geekCred, true, "bronze");
        if (ss.geekCredVisits >= 10)
          onObservation(cheevos.geekCred, true, "silver");
        if (ss.geekCredVisits >= 20)
          onObservation(cheevos.geekCred, true, "gold");
        break;
      }
    }

    clearOldBuckets();
    trackHost(tab.url);
    let hosts = getHostCount();
    if (hosts >= 10)
      onObservation(cheevos.frequentFlyer, true, "bronze");
    if (hosts >= 20)
      onObservation(cheevos.frequentFlyer, true, "silver");
    if (hosts >= 30)
      onObservation(cheevos.frequentFlyer, true, "gold");
  }

  function tabAdded() {
    ss.tabsCount++;
    if (ss.tabsCount >= 5)
      onObservation(cheevos.tabCandy, true, "bronze");
    if (ss.tabsCount >= 50)
      onObservation(cheevos.tabCandy, true, "silver");
    if (ss.tabsCount >= 500)
      onObservation(cheevos.tabCandy, true, "gold");

    let concurrentTabs = tabs.length;
    if (concurrentTabs >= 5)
      onObservation(cheevos.concurrentTabs, true, "bronze");
    if (concurrentTabs >= 25)
      onObservation(cheevos.concurrentTabs, true, "silver");
    if (concurrentTabs >= 100)
      onObservation(cheevos.concurrentTabs, true, "gold");
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

        function removeMI(id) {
          var menuitem = $(id);
          menuitem && menuitem.parentNode.removeChild(menuitem);
        }
        removeMI(fileMenuitemID);
        removeMI("appmenu_CheevoItem");

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
          onObservation(cheevos.addOnsOpened, true, "bronze");
          onObservation(cheevos.addOnsOpened, true, "silver");
          onObservation(cheevos.addOnsOpened, true, "gold");
        }
        if (window.location == "chrome://browser/content/browser.xul") {
          window.addEventListener("aftercustomization", function() {
            acquireGoldAddonsAchievement();
            updateToolbarButtonLabel(acquiredPoints);
          }, false);
          window.addEventListener("TabOpen", tabAdded, false);
        }

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
      log("window opened: " + window.location);
      addMenuItem(window);
      addCustomizationEventListener(window);
      if (window.location == "chrome://mozapps/content/preferences/changemp.xul")
        onObservation(cheevos.pmLoginAdded, true, "gold");
      if (window.location == "chrome://browser/content/preferences/preferences.xul")
        onObservation(cheevos.configOpened, true, "bronze");
      if (window.location == "chrome://browser/content/aboutDialog.xul") {
        onObservation(cheevos.aboutMisc, true, "bronze");
        let prefService = Cc["@mozilla.org/preferences-service;1"]
                          .getService(Ci.nsIPrefService);
        let defaults = prefService.getBranch("");
        let currentChannel = defaults.getCharPref("app.update.channel");
        if (currentChannel == "beta")
          onObservation(cheevos.releaseChannels, true, "bronze");
        if (currentChannel == "aurora") {
          onObservation(cheevos.releaseChannels, true, "bronze");
          onObservation(cheevos.releaseChannels, true, "silver");
        }
        if (currentChannel == "nightly" || currentChannel == "nightly-ux") {
          onObservation(cheevos.releaseChannels, true, "bronze");
          onObservation(cheevos.releaseChannels, true, "silver");
          onObservation(cheevos.releaseChannels, true, "gold");
        }
      }
      if (window.location == "chrome://browser/content/scratchpad.xul" ||
          window.location == "chrome://global/content/console.xul" ||
          window.location == "chrome://global/content/viewSource.xul") {
        ss.scratchPadOpenings += window.location == "chrome://browser/content/scratchpad.xul" ? 1 : 0;
        ss.errorConsoleOpenings += window.location == "chrome://global/content/console.xul" ? 1 : 0;
        ss.viewSourceOpenings += window.location == "chrome://global/content/viewSource.xul" ? 1 : 0;
        onObservation(cheevos.devTools, true, "bronze");
        if (ss.scratchPadOpenings > 10 ||
            ss.errorConsoleOpenings > 10 ||
            ss.viewSourceOpenings > 10)
          onObservation(cheevos.devTools, true, "silver");
        if (ss.scratchPadOpenings > 15 &&
            ss.errorConsoleOpenings > 15 &&
            ss.viewSourceOpenings > 15)
          onObservation(cheevos.devTools, true, "gold");
      }
      updateToolbarButtonLabel(acquiredPoints);
    },
    onUntrack: function (window) {
      if (window.location == "chrome://browser/content/browser.xul") {
        log("removing menu item");
        const fileMenuitemID = "menu_CheevoItem";
        var $ = function(id) window.document.getElementById(id);
        var menuitem = $(fileMenuitemID);
        menuitem && menuitem.parentNode.removeChild(menuitem);
      }

      window.removeEventListener("TabOpen", tabAdded, false);

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
        case cheevos.homepageChanged.obs:
          onObservation(cheevos.homepageChanged, true);
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
