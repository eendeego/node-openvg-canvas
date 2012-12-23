/*jslint indent: 2, node: true */
"use strict";

var vg = require('openvg');
var m = require('./matrix');

var Pattern = module.exports = function (image, repetition) {
  repetition = repetition === 'no-repeat' ? 'no-repeat' : 'repeat';

  this.type = 'pattern';
  this.image = image;
  this.tilingMode = repetition === 'repeat' ?
    vg.VGTilingMode.VG_TILE_REPEAT :
    vg.VGTilingMode.VG_TILE_FILL;
  this.repetition = repetition;
  this.transform = new m.SVGMatrix();
};

Pattern.prototype.setTransform = function (transform) {
  this.transform = transform;
};
