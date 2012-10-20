#!/usr/bin/env node-canvas
/*jslint indent: 2, node: true */
"use strict";

var util = require('util');
var Canvas = require('../lib/canvas');
var canvas = new Canvas(800, 800);
var ctx = canvas.getContext('2d');

var eu = require('./examples-util');

ctx.clearRect(0, 0, canvas.width, canvas.height);
ctx.font = 'normal 20px serif';

var i = 0;
for (;;) {
  var r = Math.floor(Math.random() * 256);
  var g = Math.floor(Math.random() * 256);
  var b = Math.floor(Math.random() * 256);
  ctx.fillStyle = 'rgba(' + r + ', ' + g + ', ' + b + ', 0.5)';

  var x = canvas.width * Math.random();
  var y = canvas.height * Math.random();
  ctx.fillText('Grumpy wizards make toxic brew for the evil Queen and Jack.', x, y);

  canvas.vgSwapBuffers();

  i++;
  if (i % 1000 === 0) {
    console.log('Done ' + i + ' strings.');
  }
}
