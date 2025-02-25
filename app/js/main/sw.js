const electron = require('electron'),
  path = require('path'),
  url = require('url'),
  whois = require('../common/whoiswrapper.js'),
  debug = require('debug')('main.sw');

require('../main.js');

const {
  app,
  BrowserWindow,
  Menu,
  ipcMain,
  dialog,
  remote
} = electron;

var {
  appSettings
} = require('../appsettings.js');

ipcMain.on('sw:lookup', function(event, domain) {
  debug('Starting whois lookup');
  whois.lookup(domain)
    .then(function(data) {
      debug('Sending back whois reply');
      event.sender.send('sw:results', data);
    })
    .catch(function(err) {
      debug('Whois lookup threw an error');
      event.sender.send('sw:results', err);
    });
});

ipcMain.on('sw:openlink', function(event, domain) {
  var win = new BrowserWindow({
    frame: true,
    height: appSettings.window.height,
    width: appSettings.window.width,
    icon: appSettings.window.icon
  });

  win.setSkipTaskbar(true);
  win.setMenu(null);
  win.loadURL(domain);

  win.on('closed', function() {
    win = null;
  });
});
