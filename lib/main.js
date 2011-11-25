// todo: https://etherpad.mozilla.org/SrTmdsPQ5m

exports.main = function() {
  const debug = true;
  log("cheevos loaded");

  const notifications = require("notifications"),
        ss = require("simple-storage").storage,
        obbs = require("observer-service"),
        tabs = require("tabs"),
        urlFactory = require("url"),
        data = require("self").data;
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
          name: "Inspector Gadget",
          aboutScheme: true,
          url: "about:addons"
      },
      robotsOpened: {
          id: "about:robots",
          obs: "about:robots",
          message: "I'm sorry, Dave, I'm afraid I can't do that.",
          name: "Domo arigato",
          aboutScheme: true,
          url: "about:robots"
      },
      configOpened: {
          id: "about:config",
          obs: "about:config",
          message: "All your controls are belong to you.",
          name: "Super User",
          aboutScheme: true,
          url: "about:config"
      },
      mozillaOpened: {
          id: "about:mozilla",
          obs: "about:mozilla",
          message: "Nice find!",
          name: "Egg Hunt",
          aboutScheme: true,
          url: "about:mozilla"
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
          name: "The Revolution",
          host: "air.mozilla.org"
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

  function getCheevoListText() {
    log("getCheevoList");
    let h = '';
    for (let i in totalCheevos) {
      let cheevo = totalCheevos[i];
      h += ss[cheevo.id] ? "<li class=achieved>" : "<li class=cheevo>";
      h += cheevo.name + "</li>";
    }
    return h;
  }
  
  function getCheevoListBlockText() {
    log("getCheevoBlockTest");
    let h = '';
    for (let i in totalCheevos) {
      let cheevo = totalCheevos[i];
      h += ss[cheevo.id] ? "<li class=inline><div class=cheevo-content><div id=achieved-two class=cheevo-block>" : "<li class=inline><div class=cheevo-content><div class=cheevo-block>";
      h += cheevo.name + "</div></div></li>";
    }
    return h;  
  }

  function onCheevosPageOpened(tab, cheevo) {
    tab.attach({
      contentScriptFile: data.url("cheevo.js"),
      contentScript: "populateTemplate('" + escape(cheevo.name) + "','" + escape(cheevo.message) +
                                       "','" + escape(cheevoTitle()) + "','" + escape(getCheevoListText()) + "','" + escape(getCheevoListBlockText()) + "');"
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
      onClick: function() { loadCheevosPage(cheevo); }
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
    if (hosts > 20)
      onObservation(strings.cheevos.hostCountSilver, true);
    else if (hosts > 10)
      onObservation(strings.cheevos.hostCountBronze, true);
  }
};





