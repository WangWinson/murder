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
// I would love to hear from you. I started writting this code to learn these concepts myself.

// ----
// Promises are used to acknowledge operation delivery.
// Which could be considered a prerversion of what CRDTs are all about.
// It is nice to know when operations have been acknowledged by the sources.
'use strict';
/*global Promise*/
if (typeof Promise !== 'function') { throw new Error('CRDT: Promise constructor unavailable.'); }

// NPM depenedencies are imported first.
var events = require('events'),
    util = require('util'),
    uuid = require('uuid');

// **NOTE:** This allows Source to get access to CRDT in spite of circular require calls.
exports.CRDT = ConflictFreeReplicatedDataType;

// Local dependencies are imported second.
var debug = require('../debug.js'),
    Operation = require('./Operation.js'),
    Source = require('./Source.js');

// `CRDT` is much easier to type.
var CRDT = ConflictFreeReplicatedDataType;
module.exports = CRDT;

// ### CRDT Constructor
// Generally you wouldn't want to use this class directly.
// It should be extended into a sub-class. *(I personally think inheritance is evil, but it seems to be the de jure.)*

// All CRDT sub-classes should adhere to this argument list:
// * `id` -- Optional, a string or number for uniquely identifying a CRDT.
// * `author` -- Optional, a string or number
// * `sources` -- Operation, an *extra* set of sources. See [lib/source.js](source.html).
function ConflictFreeReplicatedDataType(id, author, sources) {
  this.id = id || this.uuid();
  // Only allows one instance per ID for each different type.
  if (this.cache[id]) { return this.cache[id]; }
  this.cache[id] = this;
  events.EventEmitter.call(this);
  this.author = author || this.author || '';
  this.lastOperationTime = null;
  this.log = [];
  this.sources = this.sources ? this.sources.slice(0) : [];
  this.state = null;
  this.tombstone = false;
  this.type = this.constructor.type;
  this.version = -1;
  this.addSources(this.sources);
  this.addSources(sources);
  // Uses the first set of sources if one is not already present.
  if (!this.constructor.prototype.hasOwnProperty('sources')) {
    this.constructor.prototype.sources = sources;
  }
  debug.log(this.type + '..init:', '', '\n', id, author);
  this.init();
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

// All CRDT sub-classes are stored in a table.
// This allows any source to get the CRDT class by type string.
var typeTable = {};

// #### CRDT Methods

// **CRDT.getType(type)** -- Is a getter for CRDT sub-classes by type string.
CRDT.getType = function (type) {
  if (!typeTable[type]) {
    throw new Error('CRDT: "' + type + '" unavailable.');
  }
  return typeTable[type];
};

// **CRDT.get(id, ensure)** -- Is a getter for CRDT instances.
CRDT.get = function (id, ensure) {
  var crdt = this.prototype.cache[id];
  if (ensure) {
    crdt = crdt || new (this)(id,
      typeof ensure === 'object' && ensure.author || undefined,
      typeof ensure === 'object' && ensure.sources || undefined);
  }
  return crdt;
};

// **CRDT.extend(type)** -- Creates an abstract CRDT sub-class that can be used to
//                          implement different data structures with special operations.
CRDT.extend = function (type) {
  var CRDT = this;
  // Prevent the more than one CRDT with the same type name.
  if (typeTable[type]) {
    throw new Error('CRDT: "' + type + '" already exists.');
  }
  // Create a new `AbstractCRDT` constructor that always calls the base constructor.
  function AbstractCRDT() {
    return ConflictFreeReplicatedDataType.apply(this, arguments);
  }
  // Apply inheritance.
  util.inherits(AbstractCRDT, CRDT);
  // Add constructor methods.
  AbstractCRDT.extend = CRDT.extend;
  AbstractCRDT.define = CRDT.define;
  AbstractCRDT.defineOperation = CRDT.defineOperation;
  AbstractCRDT.defineOperationHandler = CRDT.defineOperationHandler;
  AbstractCRDT.defineOperationBehavior = CRDT.defineOperationBehavior;
  AbstractCRDT.get = CRDT.get;
  // Set the type of this abstract CRDT.
  // This will make it easier to debug different CRDT objects.
  AbstractCRDT.type = type;
  // Reset the cache, each CRDT is given its own cache.
  // This allows the same ID to be used on different types.
  AbstractCRDT.prototype.cache = {};
  // Operations need their own inheritance applied since they are stored in a nested object.
  AbstractCRDT.prototype.operations = Object.create(CRDT.prototype.operations);
  // Store this CRDT in the type table.
  typeTable[type] = AbstractCRDT;
  return AbstractCRDT;
};

// **CRDT.define(name, func)** -- See [lib/core/Source.js](core/Source.html)
//                                A helper method for overriding previously declared methods.
CRDT.define = Source.define;

// **CRDT.defineOperation(name, behavior)** -- Is a class method for defining an operations behavior.
CRDT.defineOperation = function (name, behavior, _skip) {
  var prototype = this.prototype;
  // Prevent the same operation from being defined twice.
  if (prototype.operations[name] || prototype[name]) {
    throw new Error('CRDT: Unable to define operation: "' + name + '" because it already exists.');
  }
  // Declares operation handler:
  prototype.operations[name] = this.defineOperationHandler(name);
  // Declares method and operation behavior:
  prototype[name] = this.defineOperationBehavior(name, behavior, _skip);
  return this;
};

// **CRDT.defineOperationHandler(name)** -- Is used to generate a handler so that incomming operations can be applied.
CRDT.defineOperationHandler = function (name) {
  return function (operation) {
    debug.log(this.type + '..' + name + '-handler:', '', '\n', operation.toString());
    operation = this.cleanOperation(operation);
    // Throws an error if an invalid operation is detected.
    if (!(operation instanceof this.Operation)) {
      throw new Error('CRDT: Handler received invalid operation.');
    }
    if (operation.method !== name) {
      throw new Error('CRDT: Mismatched operation method name.');
    }
    if (operation.id !== this.id) {
      throw new Error('CRDT: Mismatched operation id.');
    }
    // Remember this operation's time as the last operation time handled.
    this.lastOperationTime = operation.time;
    var promise;
    try {
      // Call the behavior method, which may return a promise.
      promise = this[name](operation.params, operation, true);
      // Emit an event incase a continuation is waiting for a response for this operation.
      this.emitContinuation(operation);
    } catch (error) {
      // Since this uses event emitters and promises errors are easily lost.
      // A simple `try..catch` is used to prevent errors from being ignored.
      debug.error(this.type + '..' + name + '-handler:', 'Error:', '\n', error);
      throw error;
    }
    return promise;
  };
};

// **CRDT.defineOperationBehavior(name, behavior)** -- Generates an instance method for an operation.
CRDT.defineOperationBehavior = function (name, behavior, _skip) {
  return function (params, operation, noBroadcast) {
    debug.log(this.type + '..' + name + '-behavior:', '\n',
      util.inspect(params), !!operation, noBroadcast);
    operation = operation || this.newOperation(name, params);
    // Create a continuation promise if this operation is going to broadcast.
    var continuationPromise = !noBroadcast && this.newContinuation(operation);
    params = params || {};
    var behaviorPromise;
    try {
      // Operation behavior methods may return a promise.
      behaviorPromise = behavior.call(this, params, operation);
      // They also may change the operation params.
      params = operation.params;
      this.emit(name, params, operation);
    } catch (error) {
      // Due to the use of promises and event emitters, errors can easily be lost when thrown.
      // This `try..catch` attempts to mitigate this problem.
      debug.error(this.type + '..' + name + '-behavior', 'Error:', '\n', error);
      throw error;
    }
    var promises = [];
    if (behaviorPromise && typeof behaviorPromise.then === 'function') {
      promises.push(behaviorPromise);
    }
    if (!noBroadcast) {
      // If this operation is broadcasted then it should also be pushed to the log.
      this.log.push(operation);
      promises.push(continuationPromise);
      promises.push(this.broadcast(operation, _skip));
    }
    return Promise.all(promises);
  };
};

// #### CRDT Prototype

// Allow custom CRDT implementations to override their dependencies.
CRDT.prototype.Operation = Operation;
CRDT.prototype.Source = Source;

// `CRDT:cache` -- Is used to prevent multiple instances with the same ID.
CRDT.prototype.cache = {};

// `CRDT:author` -- Declares the default operation author from this session.
CRDT.prototype.author = null;

// `CRDT:sources` -- Is used as the default source list.
CRDT.prototype.sources = null;

// **CRDT:init()** -- Is called at the end of the CRDT constructor. In this case a no-op.
CRDT.prototype.init = function () {};

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
  var isSource = source instanceof this.Source;
  if (!isSource) { throw new Error('CRDT: Invalid source.'); }
  if (this.sources.indexOf(source) === -1) { this.sources.push(source); }
  return this;
};

// **CRDT:removeSource(source)** -- Will remove a source from the CRDT.
CRDT.prototype.removeSource = function (source) {
  debug.log(this.type + '..removeSource');
  this.sources = this.sources.filter(function (any) { return any !== source; });
  return this;
};

// **CRDT:uuid()** -- Generates a universally unique identifier.
CRDT.prototype.uuid = function () { return uuid.v4(); };

// **CRDT:time()** -- Returns a local timestamp.
CRDT.prototype.time = function () { return Date.now(); };

// **CRDT:newOperation(method, params)** -- Will generate a serialized operations which can be sent to sources.
CRDT.prototype.newOperation = function (method, params) {
  debug.log(this.type + '..newOperation:', method);
  return new this.Operation(
    this.type,
    this.id,
    this.version + 1,
    this.time(),
    this.author,
    method,
    // **NOTE:** Params may change before the operation is delivered.
    //           For example anything with a reference to the operation could:
    //           `operation.params = newParams;`
    params
  );
};

// **CRDT:free()** -- Will remove this from local memory, without removing it from any sources.
//                    Without calling this CRDT and Source instances will leak.
CRDT.prototype.free = function () {
  debug.log(this.type + '..free');
  this.sources.forEach(this.removeSource.bind(this));
  this.sources = [];
  this.state = null;
  delete this.cache[this.id];
  return this;
};

// **CRDT:emitContinuation(operation)** -- Emits a continuation event.
CRDT.prototype.emitContinuation = function (operation) {
  this.emit(operation.continuationHash(), operation);
};

// **CRDT:newContinuation(operation)** -- Adds a continuation event listener, with a promise
//                                        that will be rejected after 5 seconds.
//                                        Every source needs to acknowledge the operation.
CRDT.prototype.newContinuation = function (operation) {
  // Each source should respond to the oepration within 5 seconds.
  // If there are two sources then the continuation should be emitted twice.
  // However the continuation should only resolve when all sources acknowledge the operation.
  // **TODO:** -- Figure out how to make sure all sources respond.
  var //sourceCount = this.sources.length,
      rejected = false,
      timer = null;//,
      //count = 0;
  return new Promise(function (resolve, reject) {
    // Continuations will timeout after 5 seconds. This will reject the promise.
    timer = setTimeout(function () {
      rejected = true;
      reject(new Error('CRDT: Coninuation timed-out.'));
    }, 5000);
    var listener = function (op) {
      if (rejected) {
        // Cleanup orphaned listeners when a continuation times out.
        return this.removeListener(continuationHash, listener);
      }
      if (operation === op || operation.toString() === op.toString()) {
        // count += 1;
        // if (count >= sourceCount) {
          clearTimeout(timer);
          resolve(this);
          this.removeListener(continuationHash, listener);
        // }
      }
    }.bind(this);
    // It is okay that the `continuationHash` is defined after the listener.
    // The listener can't be called until it is added.
    var continuationHash = operation.continuationHash();
    this.on(continuationHash, listener);
  }.bind(this));
};

// **CRDT:cleanOperation(operation)** -- See [lib/core/Source.js](core/Source.html).
//                                       Converts an operation string into an operation object.
CRDT.prototype.cleanOperation = Source.prototype.cleanOperation;

// **CRDT:invoke(operation)** -- Can be called with a serialized operation
//                               and it will perform the operation on this CRDT.
CRDT.prototype.invoke = function (operation) {
  debug.log(this.type + '..invoke:', '', '\n', operation.toString());
  var handler = this.operations[operation.method];
  if (typeof handler !== 'function') {
    throw new Error('CRDT: Invalid method specified by operation.');
  }
  return handler.call(this, operation);
};

// **CRDT:broadcast(operation)** -- Is used to deliver an operation to each source, unless there is a skip function.
CRDT.prototype.broadcast = function (operation, _skip) {
  debug.log(this.type + '..broadcast:', '', '\n', operation.toString());
  return Promise.all(this.sources.map(function (source) {
    // `_skip` -- An operation function that can be passed, it allows sources to be skipped.
    if (typeof _skip === 'function' && _skip(operation, source)) { return; }
    return source.deliver(operation, this);
  }));
};

// **CRDT:sourceProxy(operation, fromSource)** -- This method can be called from a source and
//                                                it will broadcast to all other sources.
CRDT.prototype.sourceProxy = function (operation, fromSource) {
  debug.log(this.type + '..sourceProxy');
  return this.broadcast(operation, function (op, source) {
    return fromSource === source;
  });
};

// **CRDT:otherSources(excludeSource)** --
CRDT.prototype.otherSources = function (excludeSource) {
  debug.log(this.type + '..otherSources');
  return this.sources.filter(function (source) { return source !== excludeSource; });
};

// **CRDT:resolveState()** -- When operations are received out of order this method can be called to
//                            reset the state and cycle through operation logs to rebuild the state in order.
CRDT.prototype.resolveState = function () {
  debug.log(this.type + '..resolveState');
  // We don't want this method to be called while it is in the middle of resolving state.
  // That would cause a stack overflow.
  if (this.isResolving) { return; }
  this.isResolving = true;
  // Reset last operation time, state, tombestone and version fields.
  this.lastOperationTime = 0;
  this.state = {};
  this.tombstone = false;
  this.version = -1;
  // Sort the log by time and then invoke each operation in order.
  // This should rebuild the state correctly.
  this.log.sort(function (a, b) { return a.time - b.time; });
  this.log.forEach(this.invoke.bind(this));
  delete this.isResolving;
  return this;
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

// **CRDT:mergeState(state)** -- Is a placeholder method for merging another state into the current state.
//                               By default it replaces the old state with the new state.
CRDT.prototype.mergeState = CRDT.prototype.replaceState;

// `CRDT:invalidOffsetVersion` -- Is used to offset the local version when comparing it to an operation's version.
CRDT.prototype.invalidOffsetVersion = 2;

// `CRDT:invalidOffsetTime` -- Is used to offset the last operation time when comparing it to another operation's time.
CRDT.prototype.invalidOffsetTime = 16;

// **CRDT:isInvalidOperation(operation) -- Will determine if an operation that was received
//                                         could make the state inconsistent.
CRDT.prototype.isInvalidOperation = function (operation) {
  // If the operation is falsy, or the version is old than the current version.
  // Or if the operation time is before the last operation.
  // Then the operation is invalid.
  return operation &&
         operation.version < (this.version - this.invalidOffsetVersion) &&
         operation.time < (this.lastOperationTime - this.invalidOffsetTime);
};

// #### CRDT Operation Methods
CRDT.prototype.operations = {};

// **CRDT:sync(params, operation)** -- Is an operation that requests state from other sources,
//                                     or declares state to other sources.
CRDT.defineOperation('sync', function (params, operation) {
  debug.log(this.type + '..sync-method');
  if (this.tombstone) { return; }
  if (this.isInvalidOperation(operation)) { return this.resolveState(); }
  if (params) {
    // Allow the state to be blindly replace, or merged.
    if (params.state) { this.replaceState(params.state); }
    if (params.merge) { this.mergeState(params.state); }
  }
  // Update the version.
  if (operation.version > this.version) { this.version = operation.version; }
});

// **CRDT:delete(_, operation)** -- This operation will eventually delete the CRDT object locally,
//                                  and from any replicas on other sources.
CRDT.defineOperation('delete', function (_, operation) {
  debug.log(this.type + '..delete-method');
  this.tombstone = true;
  this.version = operation.version;
  // `free()` allows memory to be garbage collected.
  this.free();
});

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
