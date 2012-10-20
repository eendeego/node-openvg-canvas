#!/usr/bin/env node-canvas
/*jslint indent: 2, node: true */
"use strict";

var Canvas = require('../lib/canvas');
var canvas = new Canvas(200, 200);
var ctx = canvas.getContext('2d');

var eu = require('./examples-util');

ctx.font = canvas.height / 4 + 'px sans';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillStyle = 'red';

var i = 0;
(function drawText() {
  if (i === 0) ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillText(i.toString(),
               canvas.width * (i % 5) / 5 + canvas.width / 10,
               canvas.height * Math.floor(i / 5) / 2 + canvas.height / 4);
  canvas.vgSwapBuffers();

  i++;
  if (i === 10) i = 0;

  setTimeout(drawText, 1000);
})();
eu.handleTermination();

eu.waitForInput(function () {
  process.exit(0);
});
