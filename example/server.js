// # Server-side Example
// [lib/index.js](index.html) > example/server.js
'use strict';

require('../lib/index.js');

var browserify = require('browserify'),
    express = require('express'),
    ws = require('ws');

var author = require('./author.js')(true),
    config = require('./config.js'),
    debug = require('../lib/debug.js'),
    relays = require('./relays.js');

var app = express(),
    wss = new ws.Server({port: config.webSocketPort});

wss.on('connection', function wsConn(ws) {
  debug.info('New incoming WebSocket connection...');
  relays.websocket.connect(ws);
});

app.get('/main.js', function (req, res) {
  debug.info('Received main.js request, bundling client.js...');
  res.setHeader('content-type', 'application/javascript');
  var b = browserify(__dirname + '/client.js', {debug: true}).bundle();
  b.on('error', debug.error);
  b.pipe(res);
});

app.use(express.static(__dirname + '/public'));

exports.app = app;
exports.wss = wss;

exports.listen = function (cb) {
  app.listen(3000, function (err) {
    if (err) { throw err; }

    debug.info('Running server at http://localhost:3000 ...');
    if (cb) { cb(); }

    // Import data model classes.
    var Crow = require('./Crow.js'),
        Murder = require('./Murder.js');

    // Overwrite sources for server, since it is the centralized source.
    // Crow.prototype.sources =
    // Murder.prototype.sources = storageSources;

    // Overwrite author for server side to use server author id.
    Crow.prototype.author =
    Murder.prototype.author = author;

    // Construct a murder of crows with the id of this server and the list of sources.
    var murder = new Murder('of_crows');

    // Initialize the muder.
    // debugger;
    murder.sync().then(function () {
      console.log('murder synced', murder);
      // debugger;

      // Then construct a crow for this client instance.
      var crow = new Crow(author);

      // Initialize the crow.
      // crow.sync().then(function () {
        // Have the new crow join our murder of crows.
        // crow.fly();
        murder.add(crow.id);

        // Every 10 seconds have the crow fly.
        // setInterval(crow.fly.bind(crow), 20000);
      // });

      // var crowTimers = {};
      //
      // murder.on('add', function (params) {
      //   function timeoutCrow() {
      //     clearTimeout(crowTimers[params.id]);
      //     crowTimers[params.id] = setTimeout(
      //       murder.remove.bind(murder, params.id), 30000);
      //   }
      //
      //   timeoutCrow();
      //
      //   new Crow(params.id).on('fly', function () {
      //     timeoutCrow();
      //   });
      // });
      //
      // murder.on('remove', function (params) {
      //   clearTimeout(crowTimers[params.id]);
      //
      //   new Crow(params.id).delete();
      // });
    });
  });
};

if (!module.parent) { exports.listen(); }

// ## ISC LICENSE

// Permission to use, copy, modify, and/or distribute this software for any purpose
// with or without fee is hereby granted, provided that there is no copyright notice
// and this permission notice appear in all copies.

// **THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
// WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
// AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
// INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
// LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
// OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE
// OF THIS SOFTWARE.**
