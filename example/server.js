// # Server-side Example
// [lib/index.js](index.html) > example/server.js
'use strict';

require('../lib/index.js');

var browserify = require('browserify'),
    express = require('express'),
    ws = require('ws');

var author = require('./lib/author.js')(true),
    config = require('./lib/config.js'),
    debug = require('../lib/debug.js'),
    relays = require('./lib/relays.js');

debug.log('Server initializing...');

var app = express(),
    wss = new ws.Server({port: config.webSocketPort});

debug.log('Server initialized.');

wss.on('connection', function wsConn(ws) {
  debug.info('New incoming WebSocket connection...');
  relays.websocket.connect(ws);
});

app.get('/main.js', function (req, res) {
  debug.info('Received main.js request...');
  res.setHeader('content-type', 'application/javascript');
  browserify(__dirname + '/client.js', {debug: true}).
    bundle().
    on('error', debug.error).
    pipe(res);
});

app.use(express.static(__dirname + '/public'));

exports.app = app;
exports.wss = wss;

exports.model = {
  Crow: require('./model/Crow.js'),
  Murder: require('./model/Murder.js'),
  Post: require('./model/Post.js'),
  SocialNetwork: require('./model/SocialNetwork.js'),
  Topic: require('./model/Topic.js'),
  User: require('./model/User.js')
};

exports.listen = function (cb) {
  app.listen(3000, function (err) {
    if (err) { throw err; }

    debug.info('Running server at http://localhost:3000 ...');
    if (cb) { cb(); }

    // Import data model classes.
    var Crow = require('./model/Crow.js'),
        Murder = require('./model/Murder.js');

    // Overwrite sources for server, since it is the centralized source.
    // Crow.prototype.sources =
    // Murder.prototype.sources = storageSources;

    // Overwrite author for server side to use server author id.
    // TODO: set author for every model
    Crow.prototype.author =
    Murder.prototype.author = author;

    // Construct a murder of crows with the id of this server and the list of sources.
    var murder = new Murder('of_crows');

    // Initialize the muder.
    murder.sync().then(function () {
      // Then construct a crow for this client instance.
      var crow = new Crow(author);

      // Initialize the crow.
      crow.sync().then(function () {
        // Have the new crow join our murder of crows.
        crow.fly();
        murder.add(crow.id);

        // Every 10 seconds have the crow fly.
        setInterval(crow.fly.bind(crow), 10000);
      });

      var crowTimers = {};

      murder.toArray().forEach(removeIdleCrows);

      murder.on('add', removeIdleCrows);

      function removeIdleCrows(params) {
        function timeoutCrow() {
          clearTimeout(crowTimers[params.id]);
          crowTimers[params.id] = setTimeout(
            murder.remove.bind(murder, params.id), 45000);
        }

        timeoutCrow();

        new Crow(params.id).on('fly', function (params, operation) {
          if (operation.author === operation.id) {
            timeoutCrow();
          }
        });
      }

      murder.on('remove', function (params) {
        clearTimeout(crowTimers[params.id]);

        new Crow(params.id).delete();
      });
    });
  });
};

if (!module.parent) { exports.listen(); }
