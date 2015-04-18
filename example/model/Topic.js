// # Topic Model
// [lib/index.js](index.html) > example/model/SocialNetwork.js
'use strict';

var common = require('../lib/common.js');

require('../../lib/types/Collection.js');

var Model = require('../../lib/types/Model.js');

var TopicModel = Model.extend('TopicModel');

module.exports = TopicModel;

// TODO: add schema support to Model
TopicModel.schema = {
  name: { type: String },
  posts: { type: 'Collection' }
};

common.configureCRDT(TopicModel, {isServer: false});
