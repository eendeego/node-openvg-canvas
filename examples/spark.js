#!/usr/bin/env node-canvas
/*jslint indent: 2, node: true */
"use strict";

// Original code at:
// https://github.com/LearnBoost/node-canvas/blob/master/examples/spark.js

var Canvas = require('../lib/canvas');
var canvas = new Canvas(40, 15);
var ctx = canvas.getContext('2d');
var fs = require('fs');

var eu = require('./examples-util');

ctx.clearRect(0, 0, canvas.width, canvas.height);

Object.defineProperty(Array.prototype, 'max', {
  get: function () {
    var max = 0;
    for (var i = 0, len = this.length; i < len; ++i) {
      var n = this[i];
      if (n > max) max = n;
    }
    return max;
  }
});

function spark(ctx, data) {
  var len = data.length;
  var pad = 1;
  var width = ctx.canvas.width;
  var height = ctx.canvas.height;
  var barWidth = width / len;
  var max = data.max;
  ctx.fillStyle = 'rgba(0,0,255,0.5)';
  ctx.strokeStyle = 'red';
  ctx.lineWidth = 1;
  data.forEach(function (n, i) {
    var x = i * barWidth + pad;
    var y = height * (n / max);
    ctx.lineTo(x, height - y);
    ctx.fillRect(x, height, barWidth - pad, -y);
  });
  ctx.stroke();
}

spark(ctx, [1, 2, 4, 5, 10, 4, 2, 5, 4, 3, 3, 2]);

canvas.vgSwapBuffers();
eu.handleTermination();
eu.waitForInput();
