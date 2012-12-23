/*jslint indent: 2, node: true */
"use strict";

var color = require('./color');

var Gradient = module.exports = function (type, parameters) {
  this.type = type;
  this.parameters = parameters;
  this.stops = [];
};

Gradient.prototype.addColorStop = function (stop, baseColor) {
  this.stops.push({
    stop: stop,
    color: color.parseColor(baseColor)
  });
};
