# MURDER README
[lib/index.js](index.html) > README.md

A murder is a group of highly intelligent birds that are known to visually recognize humans. They will transmit information about humans by squawking.

>  NOTE: If you are viewing this from GitHub or NPM, try viewing it from the
>  [documentation site](rolandpoulter.github.io/murder/README.html)

Murder is based mainly on Swarm. I wanted an easier API, and better documentation. I also wanted the code to be much simpler than Swarm, like the crdt npm module. I also wanted state changes to acknowledge that they've been distributed with promises.

>  NOTE: Existing source adapters are implemented against node modules that
>  are written in pure JavaScript so that they do not require a compile step.
>  This was done to make murder more portable. It is easy to write custom
>  source adapters that use modules which depend on compiled extensions.

# Docs

API methods are specified in the documentation in two ways:
1. `Object.method()` -- Describes a class level method or a module method.
2. `Object:method()` -- Describes a method on the prototype of the `Object`. This is a shorthand for `Object.prototype.method()` in the documentation.

```javascript
var myDocument = new Model('id', 'author', [localStorage, remoteSource]);
myDocument.sync().then(function () {
  myDocument.change({key: 'value'}).then(function () {
    console.log('done');
  });
});
```

This project is designed to run on a Tessel. In order to meet this requirement no compiled dependencies are used.

https://github.com/collin/crdt
https://github.com/dominictarr/crdt
https://github.com/rkusa/or-set
https://github.com/gritzko/swarm
http://book.mixu.net/distsys/eventual.html
http://research.microsoft.com/apps/video/default.aspx?id=153540&r=1
https://hal.archives-ouvertes.fr/file/index/docid/397981/filename/RR-6956.pdf
http://hal.upmc.fr/file/index/docid/555588/filename/techreport.pdf
http://arxiv.org/pdf/1210.3368v1.pdf
http://christophermeiklejohn.com/crdt/2014/07/22/readings-in-crdts.html
https://github.com/soundcloud/roshi#crdt

https://github.com/louischatriot/nedb#compacting-the-database

## ISC LICENSE

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that there is no copyright notice and this permission notice appear in all copies.

**THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.**
