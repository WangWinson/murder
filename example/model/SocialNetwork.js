// # Social Network Graph
// [lib/index.js](index.html) > example/model/SocialNetwork.js
'use strict';

var common = require('../lib/common.js');

var Graph = require('../../lib/types/Graph.js');

var SocialNetworkGraph = Graph.extend('SocialNetworkGraph');

module.exports = SocialNetworkGraph;

common.configureCRDT(SocialNetworkGraph, {isServer: false});
