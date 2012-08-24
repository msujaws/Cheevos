'use strict';

const {data} = require('self');

exports.generate = function(options) {
  let text = options.text || "";
  let callback = options.onReady;

  let port = require("page-worker").Page({
    contentScriptFile: data.url('icon-generator.js'),
    contentURL: data.url('icon-generator.html') 
  }).port;
  port.on('icon', function(details) {
    callback({icon: details.icon});
  });
  port.emit('icon', {text: text});
}