// # Murder Docs
// **(lib/index.js)**

// Please read the [README](README.html) before diving into the other documentation.

// Here is an overview of the Murder codebase:
// * **docs/** -- Target directory for generated documentation.
// Everything that follows, is a result of what you see here.
// * **example/** -- Example use case for Murder.
//   * [example/author.js](author.html) -- Author ID generator for client and server.
//   * [example/client.js](client.html) -- Basic client example script, used as bundle entry point with browserify.
//   * [example/config.js](config.html) -- Basic client/server config.
//   * [example/Crow.js](Crow.html) -- Model sub-class represents a crow.
//   * [example/Murder.js](Murder.html) -- Collection sub-class for a Murder of crows.
//   * package.json -- Example uses seperate dependencies.
//   * **example/public/** -- Public HTTP file server directory.
//     * example/public/index.html -- Main HTML file.
//     * example/public/main.css -- Main CSS file.
//   * [example/relays.js](relays.html) -- Common relays definition script.
//   * [example/server.js](server.html) -- Basic server example script.
//   * [example/sources.js](sources.html) -- Common sources definition script.
//   * [example/tessel.js](sources.html) -- Basic client on a tessel.
// * [gulpfile.js](gulpfile.html) -- Useful gulp tasks for development.
// * **lib/** -- Core CRDT implementation plus extra adapters and types.
//   * **lib/core/** -- Core CRDT implementation plus extra adapters and types.
//     * [lib/core/ConflictFreeReplicatedDataType.js](core/ConflictFreeReplicatedDataType.html) -- CRDT base class.
//     * [lib/core/Operation.js](core/Operation.html) -- CRDT operation class.
//     * [lib/core/Relay.js](core/Relay.html) -- Source message relay class.
//     * [lib/core/Source.js](core/Source.html) -- CRDT source base class.
//   * lib/debug.js -- Debug logger.
//   * **lib/extras/** -- Extra integration resources.
//     * [lib/extras/ReactMixin.js](extras/ReactMixin.html) -- Easy React integration.
//   * lib/index.js -- Default module entry point. **This file.**
//   * **lib/relays/** -- Different Relay implementations.
//     * [lib/relays/HTTPSource.js](relays/HTTPSource.html) -- HTTP Relay implementation.
//     * [lib/relays/StompSource.js](relays/StompSource.html) -- Stomp Relay implementation.
//     * [lib/relays/WebRTCSource.js](relays/WebRTCSource.html) -- WebRTC Relay implementation.
//     * [lib/relays/WebSocketSource.js](relays/WebSocketSource.html) -- WebSocket Relay implementation.
//   * **lib/sources/** -- Different Source implementations.
//     * [lib/sources/NedbSource.js](sources/NedbSource.html) -- NeDB Source adapter.
//     * [lib/sources/RedisSource.js](sources/RedisSource.html) -- Redis Source adapter.
//     * [lib/sources/WebStorageSource.js](sources/WebStorageSource.html) -- WebStorage Source adapter.
//   * **lib/types/** -- Various CRDT data structures.
//     * [lib/types/Collection.js](types/Collection.html) -- A list of other CRDT objects.
//     * [lib/types/Graph.js](types/Graph.html) -- A graph of other CRDT objects.
//     * [lib/types/Model.js](types/Model.html) -- A basic CRDT document object.
//     * [lib/types/Text.js](types/Text.html) -- A text CRDT for collaboration.
// * LICENSE -- Modified copyleft ISC license. It is in every file. See bottom.
// * package.json -- Core module dependencies and NPM details.
// * [README.md](README.html) -- Read this file first.
// * **test/** -- Test scripts. Omitted from docs.
'use strict';

exports.ConflictFreeReplicatedDataType =
  require('./core/ConflictFreeReplicatedDataType.js');
exports.CRDT = exports.ConflictFreeReplicatedDataType;

exports.debug = require('./debug.js');

exports.Operation = require('./core/Operation.js');

exports.Relay = require('./core/Relay.js');

exports.Source = require('./core/Source.js');

exports.uuid = require('uuid');

// ## ISC LICENSE

// *Copyright (c) 2015, Roland Poulter <rolandpoulter@gmail.com>*

// > Permission to use, copy, modify, and/or distribute this software for any purpose
// with or without fee is hereby granted, provided that the above copyright notice
// and this permission notice appear in all copies.

// **THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
// WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
// AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
// INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
// LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
// OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE
// OF THIS SOFTWARE.**
