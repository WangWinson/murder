// # Post Model
// [lib/index.js](index.html) > example/model/Post.js
'use strict';

var common = require('../lib/common.js');

require('../../lib/types/Collection.js');
require('../../lib/types/Text.js');

var Model = require('../../lib/types/Model.js');

var PostModel = Model.extend('PostModel');

module.exports = PostModel;

// TODO: add schema support to Model
PostModel.schema = {
  author: { type: String },
  children: { type: 'Collection' },
  text: { type: 'Text' },
  time: { type: Date }
};

common.configureCRDT(PostModel, {isServer: false});
