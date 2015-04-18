// # Topic Model
// [lib/index.js](index.html) > example/model/SocialNetwork.js
'use strict';

var common = require('../lib/common.js');

var Model = require('../../lib/types/Model.js');

var UserModel = Model.extend('UserModel');

module.exports = UserModel;

// TODO: add schema support to Model
UserModel.schema = {
  name: { type: String }
};

common.configureCRDT(UserModel, {isServer: false});
