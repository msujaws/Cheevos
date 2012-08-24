'use strict';

const { Loader } = require('test-harness/loader');
const { data } = require('self');

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
