/*jslint indent: 2, node: true */
"use strict";

var vg = require('openvg');
var color = require('./color');

/**
 * Allocating Typed Arrays is extremely expensive, so, taking
 * single-threadedness into an advantage, all necessary typed arrays are
 * eagerly allocated, and shared by all gradients.
 *
 * All this busy work to avoid going to C land.
 */

var MAX_STOPS_ESTIMATE = 10;
var EXCESS_FACTOR = 2;

var colorBuffer = new Float32Array(4);
var defaultStopArray = new Float32Array([0, 0, 0, 0, 0,  1, 1, 1, 1, 1]);
var parameterArray = new Float32Array(5);
var stopArray = new Float32Array(MAX_STOPS_ESTIMATE * 5);

function ensureStopArrayCapacity(stopCount) {
  if (stopArray.length < 5 * stopCount) {
    stopArray = new Float32Array(stopCount * 5 * EXCESS_FACTOR);
  }
}

var Gradient = module.exports = function (type, parameters) {
  this.type = type;
  this.parameters = parameters;
  this.stopCount = 0;
  this.stops = null;
};

Gradient.prototype.addColorStop = function (stop, baseColor) {
  color.parseColor(colorBuffer, baseColor);
  this.stops = {
    next : this.stops,
    stop : stop,
    r : colorBuffer[0],
    g : colorBuffer[1],
    b : colorBuffer[2],
    a : colorBuffer[3]
  };

  this.stopCount++;
};

Gradient.prototype.stopArray = function (alpha) {
  if (this.stopCount === 0) {
    defaultStopArray[9] = alpha;
    return defaultStopArray;
  }

  ensureStopArrayCapacity(this.stopCount);

  var i = this.stopCount * 5;
  var stop = this.stops;
  do {
    stopArray[--i] = stop.a * alpha;
    stopArray[--i] = stop.b;
    stopArray[--i] = stop.g;
    stopArray[--i] = stop.r;
    stopArray[--i] = stop.stop;
    stop = stop.next;
  } while (i > 0);

  return stopArray;
};

Gradient.prototype.parameterArray = function () {
  for (var i = 0; i < this.parameters.length; i++) {
    parameterArray[i] = this.parameters[i];
  }
  return parameterArray;
};

Gradient.prototype.configurePaint = function (paint, alpha) {
  var paintType, paintParam;

  if ('linearGradient' === this.type) {
    paintType  = vg.VGPaintType.VG_PAINT_TYPE_LINEAR_GRADIENT;
    paintParam = vg.VGPaintParamType.VG_PAINT_LINEAR_GRADIENT;
  } else {
    paintType  = vg.VGPaintType.VG_PAINT_TYPE_RADIAL_GRADIENT;
    paintParam = vg.VGPaintParamType.VG_PAINT_RADIAL_GRADIENT;
  }

  vg.setParameterI(paint, vg.VGPaintParamType.VG_PAINT_TYPE, paintType);
  vg.setParameterFVOL(paint, paintParam, this.parameterArray(), 0, this.parameters.length);

  vg.setParameterI(paint,
                   vg.VGPaintParamType.VG_PAINT_COLOR_RAMP_SPREAD_MODE,
                   vg.VGColorRampSpreadMode.VG_COLOR_RAMP_SPREAD_PAD);
  vg.setParameterI(paint,
                   vg.VGPaintParamType.VG_PAINT_COLOR_RAMP_PREMULTIPLIED,
                   0 /* VG_FALSE */);
  vg.setParameterFVOL(paint,
                      vg.VGPaintParamType.VG_PAINT_COLOR_RAMP_STOPS,
                      this.stopArray(alpha), 0, this.stopCount * 5);
};
