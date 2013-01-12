#!/usr/bin/env node-canvas
/*jslint indent: 2, node: true */
"use strict";

var Canvas = require('../lib/canvas');
var canvas = new Canvas(320, 320);
var ctx = canvas.getContext('2d');
var eu = require('./util');

var h_stops = 12;
var s_stops = 32;
var l_stops = 32;

var ww = 2;
var hh = 2;
var margin = 0;

var width = 4 * ww * s_stops + 2 * 10,
    height = 3 * hh * l_stops + 2 * 10;

ctx.clearRect(0, 0, canvas.width, canvas.height);
ctx.fillStyle = '#404040';
ctx.fillRect(0, 0, width, height);

// ctx.fillStyle = 'red';

for (var i = 0; i < h_stops; i++) {
  for (var j = 0; j < l_stops; j++) {
    for (var k = 0; k < s_stops; k++) {
      var h = i * 360 / h_stops;
      var s = 100 - 100 * k / (s_stops - 1);
      var l = 100 - 100 * j / (l_stops - 1);
      ctx.fillStyle = 'hsl(' + h + ', ' + s + '%, ' + l + '%)';
      ctx.fillRect(10 + (i % 4) * (s_stops * ww) + k * (ww + margin),
                   10 + Math.floor(i / 4) * (l_stops * hh) + j * (hh + margin),
                   ww, hh);
    }
  }
}

canvas.vgSwapBuffers();

eu.saveScreenshot(ctx, 0, 0, width, height,
                  'examples/screenshots/color.png');
console.log('Screenshot taken.');

eu.handleTermination();
eu.waitForInput();
