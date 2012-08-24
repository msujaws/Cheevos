'use strict';

const { Loader } = require('test-harness/loader');
const { data } = require('self');
const tabs = require('tabs');

exports.testStylesheetIsRegistered = function(test) {
  let loader = Loader(module);
  loader.require('main');
  test.assertEqual(
    require('userstyles').registered(data.url("chrome.css"), {type: 'agent'}),
    true,
    'The cheeevos style sheet was registered'
  );
  loader.unload();
};

exports.testAboutCheevos = function(test) {
  test.waitUntilDone();
  let loader = Loader(module);
  loader.require('main');
  tabs.open({
    url: 'about:cheevos',
    inBackground: true,
    onReady: function(tab) {
      test.assertEqual(tab.url, 'about:cheevos', 'about:cheevos works');
      test.assertEqual(tab.title, 'about:cheevos', 'about:cheevos works');

      // end test
      tab.close(test.done());
    }
  });
};
