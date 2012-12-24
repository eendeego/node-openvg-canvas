/*jslint indent: 2, node: true */
"use strict";

var color = require('./color');

var MAX_STOPS_ESTIMATE = 10;
var GROWTH_FACTOR = 1.5;

var Gradient = module.exports = function (type, parameters) {
  this.type = type;
  this.parameters = parameters;
  this.nextStopIndex = 0;
  this.stops = new Float32Array(5 * MAX_STOPS_ESTIMATE);
};

Gradient.prototype.addColorStop = function (stop, baseColor) {
  if (this.nextStopIndex === this.stops.length) {
    var newStops = new Float32Array(this.stopColors.length * GROWTH_FACTOR);
    newStops.set(this.stops);
    this.stops = newStops;
  }

  this.stops[this.nextStopIndex++] = stop;

  var colorArray = this.stops.subarray(this.nextStopIndex);
  color.parseColor(colorArray, baseColor);
  this.nextStopIndex += 4;
};

Gradient.prototype.calculateStopArray = function (alpha) {
  if (this.nextStopIndex === 0)
    return new Float32Array([0, 0, 0, 0, 0,  1, 1, 1, 1, alpha]);

  var result = new Float32Array(this.nextStopIndex);
  result.set(this.stops.subarray(0, this.nextStopIndex));

  for (var i = 4; i < this.nextStopIndex; i += 5)
    result[i] *= alpha;

  return result;
};
