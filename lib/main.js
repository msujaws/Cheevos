// todo: https://etherpad.mozilla.org/SrTmdsPQ5m

exports.main = function() {
  const debug = true;
  log("cheevos loaded");

  const notifications = require("notifications"),
        ss = require("simple-storage").storage,
        obbs = require("observer-service"),
        tabs = require("tabs"),
        urlFactory = require("url");
  let panelFactory = require("panel"),
      p,
      totalCheevos = 0,
      acquiredCheevos = 0;

  let strings = {
    lwThemeChanged: {
        id: "lightweight-theme-changed",
        obs: "lightweight-theme-changed",
        message: "Nice outfit :) You've just changed your persona.",
        name: "Wardrobe malfunction"
    },
    dmRemoveDownload: {
        id: "download-manager-remove-download",
        obs: "download-manager-remove-download",
        message: "$ rm foo",
        name: "Tidy up!"
    },
    dmRemoveDownloads: {
        id: "download-manager-remove-download2",
        obs: "download-manager-remove-download",
        message: "$ rm *",
        name: "OCD checking in..."
    },
    privateBrowsingEnter: {
        id: "private-browsing",
        obs: "private-browsing",
        message: "All your secrets are belong to you.",
        name: "Shopping for jewelry?"
    },
    pmLoginAdded: {
        id: "passwordmgr-storage-changed",
        obs: "passwordmgr-storage-changed",
        message: "Login added",
        name: "Hi! My name is ____"
    },
    addOnsOpened: {
        id: "Tools:Addons",
        obs: "Tools:Addons",
        message: "This message will self destruct.",
        name: "Inspector Gadget"
    },
    robotsOpened: {
        id: "about:robots",
        obs: "about:robots",
        message: "I'm sorry, Dave, I'm afraid I can't do that.",
        name: "Domo arigato"
    },
    configOpened: {
        id: "about:config",
        obs: "about:config",
        message: "All your controls are belong to you.",
        name: "Super User"
    },
    mozillaOpened: {
        id: "about:mozilla",
        obs: "about:mozilla",
        message: "Nice find :)",
        name: "Egg Hunt"
    },
    hostCountBronze: {
        id: "hostCountBronze",
        obs: "hostCountBronze",
        message: "Nice job, 10 domains in a three minute timespan.",
        name: "Frequent flyer"
    },
    hostCountSilver: {
        id: "hostCountBronze",
        obs: "hostCountBronze",
        message: "Whoa, 20 domains in a three minute timespan!",
        name: "Pro surfer"
    },
    revolutionTelevised: {
        id: "revolutionTelevised",
        obs: "revolutionTelevised",
        message: "The Revolution Will Not Be Televised",
        name: "The Revolution"
    },
    cheevoAcquired: "Cheevo acquired (#1/#2): ",
    panelStyle: "<style>body{background:-moz-radial-gradient(bottom,darkgray,black)no-repeat fixed;color:silver;font-family:Helvetica,Arial,sans-serif;}h1{margin-top:0;margin-bottom:0;font-size:36px;color:black;text-shadow:0 0 10px goldenrod;}h2{margin-top:0;font-size:10px;}p{font-size:12px;}.list{position:absolute;bottom:0;right:10px;}a{display:block;text-align:right;color:goldenrod;font-weight:bold;font-style:italic;}ul{padding:0;margin:0;list-style-type:square;}li{color:black;}.achieved{color:goldenrod;font-weight:bold;}</style>"
  };

  let totalCheevos = [
    strings.lwThemeChanged,
    strings.dmRemoveDownload,
    strings.dmRemoveDownloads,
    strings.privateBrowsingEnter,
    strings.pmLoginAdded,
    strings.addOnsOpened,
    strings.robotsOpened,
    strings.configOpened,
    strings.mozillaOpened,
    strings.hostCountBronze,
    strings.hostCountSilver,
    strings.revolutionTelevised
  ];

  // TODO: remove before publishing
  for (let i in ss)
    delete ss[i];
  for (let c in ss)
    acquiredCheevos++;

  ss.hostCount = [{},{},{}];
  addObs(strings.lwThemeChanged.obs, onLightweightThemeChanged, this);
  addObs(strings.dmRemoveDownload.obs, onDownloadManagerRemoveDownload, this);
  addObs(strings.privateBrowsingEnter.obs, onPrivateBrowsingEnter, this);
  addObs(strings.pmLoginAdded.obs, onPMLoginAdded, this);
  tabs.on('ready', onDOMContentLoaded);

  function addObs(topic, callback, thisRef) {
    obbs.add(topic, callback, thisRef);
  }

  function log(aMessage) {
    if (debug)
      console.error("cheevos: " + aMessage);
  }

  function cheevoTitle() {
    return strings.cheevoAcquired.replace("#1", acquiredCheevos)
                                 .replace("#2", totalCheevos.length);
  }

  function getCheevoListText() {
    log("getCheevoList");
    let h = "data:text/html,";
    h += strings.panelStyle;
    h += "<h1>Cheevos</h1><ul>";
    for (let i in totalCheevos) {
      let cheevo = totalCheevos[i];
      h += ss[cheevo.id] ? "<li class=achieved>" : "<li>";
      h += cheevo.name + "</li>";
    }
    h += "</ul>";
    return h;
  }

  function getNotifyText(cheevo) {
    let h = "data:text/html,<!DOCTYPE html><html><body>";
    h += strings.panelStyle;
    h += "<h1>" + cheevo.name + "</h1>";
    h += "<h2>" + cheevoTitle() + "</h2>";
    h += "<p>" + cheevo.message + "</p>";
    h += "<p class=list><a href='" + getCheevoListText() + "'>See all cheevos</a></p>";
    h += "</body></html>";
    return h;
  }

  function showPanel(cheevo) {
    log("showing panel: " + cheevo.name);
    p = panelFactory.Panel({ contentURL: getNotifyText(cheevo) });
    p.show();
  }

  function notify(cheevo) {
    log("showing notifcation: " + cheevo.name);
    notifications.notify({
      title: cheevoTitle() + cheevo.name,
      text: cheevo.message,
      onClick: function() { showPanel(cheevo); }
    });
  }

  function onObservation(cheevo, shouldShow) {
    log(cheevo.obs);
    if (shouldShow && !ss[cheevo.id]) {
      acquiredCheevos++;
      ss[cheevo.id] = true;
      notify(cheevo);
    }
  }
  
  function onURLOpened(cheevo) {
    return onObservation(cheevo, true);
  }

  function onLightweightThemeChanged(subject, data) {
    onObservation(strings.lwThemeChanged, true);
  }

  function onDownloadManagerRemoveDownload(subject, data) {
    let cheevo = subject ? strings.dmRemoveDownload : strings.dmRemoveDownloads;
    onObservation(cheevo, true);
  }

  function onPrivateBrowsingEnter(subject, data) {
    onObservation(strings.privateBrowsingEnter, data == "enter");
  }

  function onPMLoginAdded(subject, data) {
    onObservation(strings.pmLoginAdded, data == "addLogin");
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
    if (url.scheme == "about") {
      switch(tab.url.toLowerCase()) {
        case "about:addons":
          onURLOpened(strings.addOnsOpened);
          break;
        case "about:robots":
          onURLOpened(strings.robotsOpened);
          break;
        case "about:config":
          onURLOpened(strings.configOpened);
          break;
        case "about:mozilla":
          onURLOpened(strings.mozillaOpened);
          break;
      }
    } else {
      switch(url.host) {
        case "air.mozilla.org":
          onURLOpened(strings.revolutionTelevised);
          break;
      }
    }
    
    clearOldBuckets();
    trackHost(tab.url);
    let hosts = getHostCount();
    if (hosts > 20)
      onObservation(strings.hostCountSilver, true);
    else if (hosts > 10)
      onObservation(strings.hostCountBronze, true);
  }
};





