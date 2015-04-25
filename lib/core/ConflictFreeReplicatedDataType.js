// # Conflict-free replicated data type (CRDT).
// [lib/index.js](../index.html) > lib/core/ConflictFreeReplicatedDataType.js

// This attempts to create a basic *un-opinionated* framework for implementing operation based CRDT.
// See the [wikipedia page on CRDT.](http://en.wikipedia.org/wiki/Conflict-free_replicated_data_type)
//
// The goal is not just to deal with state, but to also deal with communication.
// Custom operations can be defined to suit whatever data structure.
// As long as it is possible for the data structure to be defined by a CRDT.

// The [soundcloud roshi project](https://github.com/soundcloud/roshi#crdt) has an excellent explanation:
// > Operations on CRDTs need to adhere to [the following rules](http://book.mixu.net/distsys/eventual.html):
// > * Associativity (a+(b+c)=(a+b)+c), so that grouping doesn't matter.
// > * Commutativity (a+b=b+a), so that order of application doesn't matter.
// > * Idempotence (a+a=a), so that duplication doesn't matter.

// ----
// **NOTE:** If you're someone who actually reads the papers on these devices,
// or a math genius, and you notice anything wrong with this framework.
// I would be happy to hear from you. I started writting this code to learn these concepts myself.

// ----
// Promises are used to acknowledge operation delivery.
// Which could be considered a prerversion of what CRDTs are all about.
// It is nice to know when operations have been acknowledged by the sources.
'use strict';
/*global Promise*/
if (typeof Promise !== 'function')
  { throw new Error('CRDT: Promise constructor unavailable.'); }

// NPM depenedencies are imported first.
var events = require('events'),
    util = require('util'),
    uuid = require('uuid');

// **NOTE:** This allows Source to get access to CRDT in spite of circular require calls.
exports.CRDT = ConflictFreeReplicatedDataType;

// Local dependencies are imported second.
var common = require('../common.js'),
    debug = require('../debug.js'),
    Operation = require('./Operation.js'),
    Relay = require('./Relay.js'),
    Source = require('./Source.js');

// `CRDT` is much easier to type.
var CRDT = ConflictFreeReplicatedDataType;
module.exports = CRDT;

// ### CRDT Constructor
// Generally you wouldn't want to use this class directly.
// It should be extended into a sub-class. *(I personally think inheritance is evil, but it seems to be the de jure.)*

// All CRDT sub-classes should adhere to this argument list:
// * `id` -- Optional, a string or number for uniquely identifying a CRDT.
// * `options.author` -- Optional, a string or number
// * `options.sources` -- Operation, an *extra* set of sources. See [lib/Source.js](core/Source.html).
// * `options.relays` -- Operation, an *extra* set of relays. See [lib/Relay.js](core/Relay.html).
function ConflictFreeReplicatedDataType(id, config) {
  this.id = id || this.uuid();

  // Only allows one instance per ID for each different type.
  if (this.cache[id]) { return this.cache[id]; }
  this.cache[id] = this;

  events.EventEmitter.call(this);
  config = config || {};

  this.author = config.author || this.author || '';

  this.lastOperationTime = 0;
  this.log = [];

  this.relays = this.relays ? this.relays.slice(0) : [];
  this.sources = this.sources ? this.sources.slice(0) : [];

  this.state = null;
  this.tombstone = false;
  this.type = this.constructor.type;
  this.version = CRDT.initVersion;

  this.addSources(this.sources).addSources(config.sources);
  this.addRelays(this.relays).addRelays(config.relays);

  // Uses the first set of sources if one is not already present.
  // hoistList(this, 'sources');
  // hoistList(this, 'relays');
  //
  // function hoistList(self, type) {
  //   if (!self.constructor.prototype.hasOwnProperty(type))
  //     { self.constructor.prototype[type] = self[type]; }
  // }

  debug.log(this.type + '..init:', '', id, config);
  this.init(config);

  return this;
}
// **Example:**
// ```javascript
// var Foo = CRDT.extend('Foo');
//
// Foo.prototype.author = 'default-author';
//
// // It is important to declare sources on the prototype.
// Foo.prototype.sources = [new Source()];
//
// Foo.defineOperation('action',
//                     function (params, operation) {
//                       ...
//                     });
//
// var bar = new Foo('bar', 'actual-author',
//                   [new AdditionalSource()]);
//
// bar.sync().then(function () {
//   console.log('synced:', bar);
//   bar.action();
// });
// ```

// CRDT inherits from EventEmitter base class.
util.inherits(CRDT, events.EventEmitter);

// All CRDT classes must have a type string.
CRDT.type = 'GenericCRDT';

CRDT.initVersion = -1;

// All CRDT sub-classes are stored in a table.
// This allows any source to get the CRDT class by type string.
var typeTable = {
  GenericCRDT: CRDT,
  ConflictFreeReplicatedDataType: CRDT,
  CRDT: CRDT
};

// #### CRDT Methods

// **CRDT.getType(type)** -- Is a getter for CRDT sub-classes by type string.
CRDT.getType = function (type) {
  if (!typeTable[type])
    { throw new Error('CRDT: "' + type + '" unavailable.'); }
  return typeTable[type];
};

// **CRDT.getById(id, ensure)** -- Is a getter for CRDT instances.
CRDT.getById = function (id, ensure) {
  var crdt = this.prototype.cache[id],
      isObject;
  if (ensure && !crdt) {
    isObject = typeof isObject === 'object';
    crdt = new (this)(id, {
      author: isObject && ensure.author || undefined,
      relays: isObject && ensure.relays || undefined,
      sources: isObject && ensure.sources || undefined
    });
  }
  return crdt;
};

// **CRDT.extend(type)** -- Creates an abstract CRDT sub-class that can be used to
//                          implement different data structures with special operations.
CRDT.extend = function (type) {
  var CRDT = this;
  // Prevent the more than one CRDT with the same type name.
  if (typeTable[type])
    { throw new Error('CRDT: "' + type + '" already exists.'); }

  // Create a new `AbstractCRDT` constructor that always calls the base constructor.
  function AbstractCRDT() {
    return ConflictFreeReplicatedDataType.apply(this, arguments);
  }

  // Apply inheritance.
  util.inherits(AbstractCRDT, CRDT);

  // Add constructor methods.
  AbstractCRDT.define = CRDT.define;
  AbstractCRDT.defineOperation = CRDT.defineOperation;
  AbstractCRDT.defineOperationBehavior = CRDT.defineOperationBehavior;
  AbstractCRDT.defineOperationHandler = CRDT.defineOperationHandler;
  AbstractCRDT.extend = CRDT.extend;
  AbstractCRDT.getById = CRDT.getById;

  // Reset the cache, each CRDT is given its own cache.
  // This allows the same ID to be used on different types.
  AbstractCRDT.prototype.cache = {};

  // Operations need their own inheritance applied since they are stored in a nested object.
  AbstractCRDT.prototype.operations = Object.create(CRDT.prototype.operations);

  // Set the type of this abstract CRDT.
  // This will make it easier to debug different CRDT objects.
  AbstractCRDT.type = type;

  // Store this CRDT in the type table.
  typeTable[type] = AbstractCRDT;

  return AbstractCRDT;
};

// **CRDT.define(name, func)** -- A helper method for overriding previously declared methods.
CRDT.define = common.defineMethod;

// **CRDT.defineOperation(name, behavior)** -- Is a class method for defining an operations behavior.
CRDT.defineOperation = function (name, behavior) {
  var prototype = this.prototype;

  // There cannot be an operation called "operation".
  if (name === 'operation')
    { throw new Error('CRDT: "operation" is not a valid operation name.'); }

  // Prevent the same operation from being defined twice.
  if (prototype.operations[name] || prototype[name])
    { throw new Error('CRDT: Unable to define operation: "' + name + '" because it already exists.'); }

  // Declares operation handler:
  prototype.operations[name] = this.defineOperationHandler(name);

  // Declares method and operation behavior:
  prototype[name] = this.defineOperationBehavior(name, behavior);

  return this;
};

// **CRDT.defineOperationHandler(name)** -- Is used to generate a handler so that incomming operations can be applied.
CRDT.defineOperationHandler = function (name) {
  return function (operation, origin, localOnly) {
    debug.log(this.type + '..' + name + '-handler:', '', operation.toString());

    operation = this.Operation.create(operation);

    // Throws an error if an invalid operation is detected.
    if (!(operation instanceof this.Operation))
      { throw new Error('CRDT: Handler received an invalid operation.'); }
    if (operation.method !== name)
      { throw new Error('CRDT: Mismatched operation method name.'); }
    if (operation.id !== this.id)
      { throw new Error('CRDT: Mismatched operation id.'); }

    var promise;

    try {
      // Emit an event incase a continuation is waiting for a response for this operation.
      // if (/*!localOnly &&*/
        this.emitContinuation(operation, origin);//)
        // { localOnly = true; }

      // Call the behavior method, which may return a promise.
      promise = this[name](operation.params, operation, origin, localOnly);
    }

    catch (error) {
      // Since this uses event emitters and promises errors are easily lost.
      // A simple `try..catch` is used to prevent errors from being ignored.
      debug.error(this.type + '..' + name + '-handler:', 'Error:', '\n', error);
      throw error;
    }

    return promise;
  };
};

// **CRDT.defineOperationBehavior(name, behavior)** -- Generates an instance method for an operation.
CRDT.defineOperationBehavior = function (name, behavior) {
  return function replay(params, operation, origin, localOnly) {
    /*jshint maxstatements:30*/
    debug.log(this.type + '..' + name + '-behavior: ' + operation);

    if (this.isResolving/* && !localOnly*/)
      { return setTimeout(replay.bind(this, params, operation, origin, localOnly), this.resolveDelayMin); }

    debug.log(this.type + '..' + name + '-behavior-run:', '', '\n',
      util.inspect(params), '\n',
      operation + '', '\n',
      origin && origin.type || 'default', localOnly ? 'private' : 'public');

    if (!operation) { this.version += 1; }
    operation = operation || this.newOperation(name, params);

    // Create a continuation promise if this operation is going to broadcast.
    var continuationPromise = !localOnly && this.newContinuation(operation, origin);

    var behaviorPromise,
        promises = [];

    if (this.tombstone) { return this.emptyPromise(); }

    try {
      // Remember this operation's time as the last operation time handled.
      this.lastOperationTime = operation.time;

      // Operation behavior methods may return a promise.
      behaviorPromise = behavior.call(this, params, operation, origin, localOnly);

      // They also may change the operation params.
      params = operation.params;

      this.emit(name, params, operation, origin);
      this.emit('operation', operation, origin);

      if (behaviorPromise && typeof behaviorPromise.then === 'function')
        { promises.push(behaviorPromise); }

      if (continuationPromise)
        { promises.push(continuationPromise); }

      promises.push(new Promise(function (resolve, reject) {
        var finish = function () {
          this.append(operation, origin, localOnly).then(localOnly ? resolve : function () {
            this.broadcast(operation, origin).then(resolve, reject);
          }.bind(this), reject);
        }.bind(this);
        if (this.isUnresolvedOperation(operation)) { this.resolveState(finish); }
        else { finish(); }
      }.bind(this)));
    }

    catch (error) {
      // Due to the use of promises and event emitters, errors can easily be lost when thrown.
      // This `try..catch` attempts to mitigate this problem.
      this.handleError(error);
    }

    return Promise.all(promises).then(function () {
      debug.info(this.type, this.version, operation.toString());
    }.bind(this), this.handleError.bind(this));
  };
};

// #### CRDT Prototype

// Allow custom CRDT implementations to override their dependencies.
CRDT.prototype.Operation = Operation;
CRDT.prototype.Relay = Relay;
CRDT.prototype.Source = Source;

// `CRDT:cache` -- Is used to prevent multiple instances with the same ID.
CRDT.prototype.cache = {};

// `CRDT:author` -- Declares the default operation author from this session.
CRDT.prototype.author = null;

// `CRDT:sources` -- Is used as the default source list.
CRDT.prototype.sources = [];

// `CRDT:relays` -- .
CRDT.prototype.relays = [];

// **CRDT:init()** -- Is called at the end of the CRDT constructor. In this case a no-op.
CRDT.prototype.init = function () {};

// **CRDT:emptyPromise()** --
CRDT.prototype.emptyPromise = common.emptyPromise;

CRDT.prototype.handleError = function (error) {
  debug.error(this.type, 'Error:', '\n', error);
  throw error;
};

// **CRDT:checkType()** --
CRDT.prototype.checkType = function (kind, object) {
  if (typeof kind === 'string') { kind = this[kind]; }
  var isKind = object instanceof kind;
  if (!isKind) { throw new Error('CRDT: Invalid ' + kind.type + '.'); }
};

// **CRDT:filterList()** --
CRDT.prototype.filterList = function (list, blacklist) {
  blacklist = Array.isArray(blacklist) ? blacklist : [blacklist];
  return this[list].filter(function (item) {
    return blacklist.indexOf(item) === -1;
  });
};

// **CRDT:addSources(sources)** -- Allows an array of sources to be added.
CRDT.prototype.addSources = function (sources) {
  debug.log(this.type + '..addSources');
  if (sources) { sources.forEach(this.addSource.bind(this)); }
  return this;
};

// **CRDT:addSource(source)** -- Connects a CRDT to a data source.
//                         Sources can represent local storage, or a remote data source.
CRDT.prototype.addSource = function (source) {
  debug.log(this.type + '..addSource');
  this.checkType('Source', source);
  source.open();
  if (this.sources.indexOf(source) === -1) { this.sources.push(source); }
  return this;
};

// **CRDT:removeSource(source)** -- Will remove a source from the CRDT.
CRDT.prototype.removeSource = function (source) {
  debug.log(this.type + '..removeSource');
  this.sources = this.filterList('sources', source);
  return this;
};

// **CRDT:filterSources(blacklist)** --
CRDT.prototype.filterRelays = function (blacklist) {
  return this.filterList('relays', blacklist);
};

// **CRDT:addRelays(relays)** --
CRDT.prototype.addRelays = function (relays) {
  debug.log(this.type + '..addRelays');
  if (relays) { relays.forEach(this.addRelay.bind(this)); }
  return this;
};

// **CRDT:addRelay(relay)** --
CRDT.prototype.addRelay = function (relay) {
  debug.log(this.type + '..addRelay');
  this.checkType('Relay', relay);
  relay.open();
  if (this.relays.indexOf(relay) === -1) { this.relays.push(relay); }
  return this;
};

// **CRDT:removeRelay(relay)** --
CRDT.prototype.removeRelay = function (relay) {
  debug.log(this.type + '..removeRelay');
  this.relays = this.filterList('relays', relay);
  return this;
};

// **CRDT:filterRelays(blacklist)** --
CRDT.prototype.filterRelays = function (blacklist) {
  return this.filterList('relays', blacklist);
};

// **CRDT:uuid()** -- Generates a universally unique identifier.
CRDT.prototype.uuid = function () { return uuid.v4(); };

// **CRDT:time()** -- Returns a local timestamp.
CRDT.prototype.time = function () { return Date.now(); };

// **CRDT:newOperation(method, params)** -- Will generate a serialized operations which can be sent to sources.
CRDT.prototype.newOperation = function (method, params) {
  debug.log(this.type + '..newOperation:', method);
  return new this.Operation({
    author: this.author,
    id: this.id,
    method: method,
    // **NOTE:** Params may change before the operation is delivered.
    //           For example anything with a reference to the operation could:
    //           `operation.params = newParams;`
    params: params,
    time: this.time(),
    type: this.type,
    version: this.version
  });
};

// **CRDT:free()** -- Will remove this from local memory, without removing it from any sources.
//                    Without calling this CRDT and Source instances will leak.
CRDT.prototype.free = function (timeout) {
  debug.log(this.type + '..free');
  if (typeof timeout !== 'number') { timeout = 0; }
  clearTimeout(this.freeTimeout);
  this.freeTimeout = setTimeout(function () {
    this.sources.forEach(this.removeSource.bind(this));
    this.relays.forEach(this.removeRelay.bind(this));
    this.state = null;
    delete this.cache[this.id];
  }.bind(this), timeout);
  return this;
};

// **CRDT:emitContinuation(operation)** -- Emits a continuation event.
CRDT.prototype.emitContinuation = function (operation, origin) {
  debug.log(this.type + '..emitContinuation:', '', operation.toString());
  debugger;

  var exists = false;

  if (origin === true || origin instanceof this.Relay) {
    debug.log(this.type + '..emitContinuation-emit');

    var event = operation.localHash();
    exists = this._events[event] && this._events[event];
    this.emit(event);

    // **HACK:** Contiunation is already handled by CRDT:broadcastSyncResponse()
    //           This prevents the `sync` operation from sending extra messages to clients.
    if (operation.method !== 'sync') {
      this.relays.forEach(function (relay) {
        relay.publishContinuation(operation, origin);
      }.bind(this));
    }
  }

  if (!exists)
    { debug.warn(new Error('No local event found for continuation: ' + operation.toString())); }

  return exists;
};

// **CRDT:newContinuation(operation)** -- Adds a continuation event listener, with a promise
//                                        that will be rejected after 5 seconds.
//                                        Every source needs to acknowledge the operation.
CRDT.prototype.newContinuation = function (operation, origin) {
  debug.log(this.type + '..newContinuation:', '', operation.toString());
  debugger;
  if (origin && origin !== this) { return; }
  // Each source should respond to the oepration within 5 seconds.
  // If there are two sources then the continuation should be emitted twice.
  // However the continuation should only resolve when all sources acknowledge the operation.
  // **TODO:** -- Figure out how to make sure all sources respond.
  //              DONE?
  var relayCount = this.relays.length,
      rejected = false,
      timer = null,
      count = 0;

  return new Promise(function (resolve, reject) {
    // Continuations will timeout after 10 seconds. This will reject the promise.
    timer = setTimeout(function () {
      rejected = true;
      var error = new Error('CRDT: Coninuation timed-out: ' + operation);
      debug.error(error);
      reject(error);
    }, 5000);

    var listener = function () {
      debug.log(this.type + '..newContinuation-listener:', '', operation.toString());
      if (rejected) {
        // Cleanup orphaned listeners when a continuation times out.
        return this.removeListener(continuationHash, listener);
      }

      count += 1;

      if (count >= relayCount) {
        clearTimeout(timer);
        resolve(this);
        debug.log(this.type + '..newContinuation-resolve:', '', operation.toString());
        this.removeListener(continuationHash, listener);
      }
    }.bind(this);

    // It is okay that the `continuationHash` is defined after the listener.
    // The listener can't be called until it is added.
    var continuationHash = operation.localHash();
    this.on(continuationHash, listener);
  }.bind(this));
};

// **CRDT:invoke(operation)** -- Can be called with a serialized operation
//                               and it will perform the operation on this CRDT.
CRDT.prototype.invoke = function (operation, origin, localOnly) {
  operation = this.Operation.create(operation);
  debug.log(this.type + '..invoke:', '', operation.toString());

  var handler =// localOnly && origin instanceof this.Source ?
    // this[operation.method] :
    this.operations[operation.method];

  if (typeof handler !== 'function')
    { throw new Error('CRDT: Invalid method specified by operation.'); }

  return handler.call(this, operation, origin || this, localOnly);
};

// **CRDT:append(operation)** --
CRDT.prototype.append = function (operation, origin, localOnly) {
  operation = this.Operation.create(operation);
  debug.log(this.type + '..append:', '', operation.toString());

  // No need to store sync operations with no params.
  if (!localOnly && operation.method === 'sync' && (!operation.params || !operation.originalParams))
    { return this.emptyPromise(); }

  var localHash = operation.localHash(),
      list = this.log[localHash],
      op = operation.toString();

  var isDuplicate = list && list.some(function (item) {
    return item.toString() === op.toString();
  });

  if (isDuplicate) { return this.emptyPromise(); }

  if (list) { list.push(op); }
  else { this.log[localHash] = [op]; }

  this.log.push(op);

  debug.log(this.type + '..append-local', '', 'Only:' + localOnly);

  if (localOnly) { return this.emptyPromise(); }

  var promises = this.sources.map(function (source) {
    if (origin !== source) { source.append(operation, origin); }
  }.bind(this));

  return Promise.all(promises);
};

// **CRDT:broadcast(operation)** -- Is used to deliver an operation to each source, unless there is a skip function.
CRDT.prototype.broadcast = function (operation, origin) {
  debug.log(this.type + '..broadcast:', '', operation.toString());

  var sourcePromises = Promise.all(this.sources.map(function (source) {
    debugger;
    if (origin !== source) { return source.deliver(operation, origin); }
  }.bind(this)));

  return new Promise(function (resolve, reject) {
    sourcePromises.then(function () {
      debug.log(this.type + '..broadcast-relay');
      if (this.relays.length === 0) {
        this.emitContinuation(operation, true);
        return resolve(this);
      }
      Promise.all(this.relays.map(function (relay) {
        debugger;
        if (origin !== relay) { return relay.publish(operation, origin); }
      }.bind(this))).then(resolve, reject);
    }.bind(this), reject);
  }.bind(this));
};

CRDT.prototype.delays = null;

// **CRDT:throttle()** --
CRDT.prototype.throttle = function (name, minTime, maxTime, callback) {
  debug.log(this.type + '..throttle:', '', name);
  this.delays = this.delays || {};
  var delay = this.delays[name] || (this.delays[name] = {});
  if (!delay.expires || delay.expires <= Date.now()) {
    debug.log(this.type + '..throttle-step:', '', name);
    delay.expires = Date.now() + (maxTime - minTime);
    clearTimeout(delay.timeout);
    delay.timeout = setTimeout(function () {
      delay.expires = null;
      delete this.delays[name];
      debug.log(this.type + '..throttle-called:', '', name);
      callback.call(this);
    }.bind(this), minTime);
  }
};

CRDT.prototype.compressDelayMin = 100;
CRDT.prototype.compressDelayMax = 10000;

// **CRDT:compress()** --
CRDT.prototype.compress = function (callback) {
  debug.log(this.type + '..compress');
  return this.throttle('compress',
    this.compressDelayMin,
    this.compressDelayMax,
    function () {
      debug.log(this.type + '..compress-callback');
      if (this.version <= CRDT.initVersion) {
        if (callback) { callback.call(this, null); }
        return;
      }
      var compressedSync = this.newOperation('sync', {merge: this.state, version: this.version});
      Promise.all(this.sources.map(function (source) {
        return source.compress(compressedSync);
      }.bind(this))).then(function () {
        if (callback) { callback.call(this, compressedSync); }
      }.bind(this), function (err) {
        throw err;
      });
    });
};

CRDT.prototype.resolveDelayMin = 10;
CRDT.prototype.resolveDelayMax = 1000;
CRDT.prototype.isResolving = false;

// **CRDT:resolveState()** -- When operations are received out of order this method can be called to
//                            reset the state and cycle through operation logs to rebuild the state in order.
CRDT.prototype.resolveState = function (callback) {
  debug.log(this.type + '..resolveState');

  if (this.isResolving) { return; }

  return this.throttle('resolve',
    this.resolveDelayMin,
    this.resolveDelayMax,
    function () {
      // We don't want this method to be called while it is in the middle of resolving state.
      // That would cause a stack overflow.
      if (this.isResolving) { return; }
      this.isResolving = true;

      debug.log(this.type + '..resolveState-run');

      // Reset last operation time, state, tombestone and version fields.
      this.lastOperationTime = 0;
      this.state = {};
      this.tombstone = false;

      var maxVersion = -1;

      this.log.sort(function (a, b) {
        return a.time - b.time || a.version - b.version;
      });

      this.log.forEach(function (operation) {
        debug.log(this.type + '..resolveState-log: ' + operation);
        operation = this.Operation.create(operation);
        maxVersion = Math.max(operation.version, maxVersion);
        this.invoke(operation, this, true);
      }.bind(this));

      this.version = Math.max(maxVersion, this.log.length);

      debug.log(this.type + '..resolveState-done');
      this.isResolving = false;

      this.compress(callback);
    }.bind(this));
};

// **CRDT:syncState(state)** -- Will sync the current state to all sources.
//                              If no `state` value is passed it will use `this.state`.
CRDT.prototype.syncState = function (state) {
  debug.log(this.type + '..syncState');
  return this.sync({state: state || this.state});
};

// **CRDT:replaceState(state)** -- Sets the local state to whatever value is passed.
CRDT.prototype.replaceState = function (state) {
  debug.log(this.type + '..replaceState');
  this.state = state;
  return this;
};

// **CRDT:mergeState(state, arrayLookup)** -- Is a method for merging another state into the current state.
CRDT.prototype.mergeState = function (state, arrayLookup) {
  debug.log(this.type + '..mergeState');

  arrayLookup = arrayLookup || Array.prototype.indexOf;

  merge(this, this.state, state, this, 'state');

  function merge(crdt, target, source, parent, key) {
    if (source === undefined) { return; }

    /*jshint validthis:true*/
    if (Array.isArray(target) && Array.isArray(source)) {
      // Append only, unique-able
      // Do not use nested arrays in state is removal is needed.
      source.forEach(function (item) {
        var index = arrayLookup.call(target, item);
        if (index === -1) { target.push(item); }
      }.bind(crdt));
    }

    if (typeof target === 'object' && typeof source === 'object') {
      target = target || {};
      Object.keys(source).forEach(function (key) {
        merge(crdt, target[key], source[key], target, key);
      }.bind(crdt));
    }

    else { target = parent[key] = source; }
  }
};

// `CRDT:invalidOffsetTime` -- Is used to offset the last operation time when comparing it to another operation's time.
CRDT.prototype.invalidOffsetTime = 16;

// **CRDT:isUnresolvedOperation(operation) -- Will determine if an operation that was received
//                                            could make the state inconsistent.
CRDT.prototype.isUnresolvedOperation = function (operation) {
  debug.log(this.type + '..isUnresolvedOperation');
  // If the operation is falsy, or if the operation time is before the last operation.
  // Then the operation is invalid.
  return operation &&
    operation.time < (this.lastOperationTime - this.invalidOffsetTime);
};

// **CRDT:broadcastSyncResponse()** --
CRDT.prototype.broadcastSyncResponse = function (operation, origin) {
  debug.log(this.type + '..broadcastSyncResponse');

  console.log('bsr-or', origin);
  debugger;

  if (this.version > CRDT.initVersion) {
    console.log('GOT HERE');
    if (!operation.params && this.state)
      { operation.params = {merge: this.state, version: this.version}; }

    // if (origin === this)
    //   { return origin.broadcast(operation, origin); }

    if (origin instanceof this.Source)
      { return origin.deliver(operation, origin); }

    else
    if (origin instanceof this.Relay)
     { return origin.publish(operation, origin); }

    else
      { this.emitContinuation(operation, true); }
  }

  // else {
  //   this.emitContinuation(operation, origin);
  // }

  return this.emptyPromise();
};

CRDT.prototype.lastSyncTime = 0;

// **CRDT:syncOnce()** --
CRDT.prototype.syncOnce = function (params) {
  if (!this.lastSyncTime) { return this.sync(params); }
  return this.emptyPromise();
};

// #### CRDT Operation Methods
CRDT.prototype.operations = {};

// **CRDT:sync(params, operation, origin)** --
// Is an operation that requests state from other sources,
// or declares state to other sources.
CRDT.defineOperation('sync', function (params, operation, origin) {
  debug.log(this.type + '..sync-method');

  this.lastSyncTime = Date.now();

  debugger;

  if (params) {
    // Allow the state to be blindly replace, or merged.
    if (params.version && params.version > this.version)
      { this.version = params.version; }

    if (params.state) { this.replaceState(params.state); }
    if (params.merge) { this.mergeState(params.merge); }
  }

  // /*else */if (origin instanceof this.Relay)
  // else if (origin && origin !== this)
  else
  // if (origin instanceof this.Relay)

    { this.broadcastSyncResponse(operation, origin); }
      //this.Operation.create(operation, true), origin); }

  // else {
  //   this.state = {};
  //   operation.params = {state: this.state, version: this.version};
  // }
});

// **CRDT:delete()** -- This operation will eventually delete the CRDT object locally,
//                      and from any replicas on other sources.
CRDT.defineOperation('delete', function () {
  debug.log(this.type + '..delete-method');
  this.tombstone = true;
  // `free()` allows memory to be garbage collected.
  this.free(0);
});
