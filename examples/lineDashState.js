#!/usr/bin/env node-canvas
/*jslint indent: 2, node: true */
"use strict";

var util = require('util');
var Canvas = require('../lib/canvas');
var canvas = new Canvas();
var ctx = canvas.getContext('2d');
var eu = require('./util');

var hh = 25;

var dashLists = [
  [],
  [0, 2, 2, 0],
  [2, 2],
  [2],
  [20, 2, 6, 2],
  [0, 5, 5, 0],
  [5, 5],
  [5],
  [20, 2, 4, 2],
  [20, 2, 4],
  [20, 2, 4, 2, 4, 2],
  [20, 2, 4, 2, 4]
];

function dashedLine(x0, y0, x1, y1, dashList) {
}

var startTime = undefined;
var savedScreenshot = false;
function paint() {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.setLineDash([10, 10]);
  ctx.moveTo(20, 20);
  ctx.lineTo(130, 20);
  ctx.stroke();

  ctx.save();

  ctx.setLineDash([]);
  ctx.strokeStyle = 'red';

  ctx.beginPath();
  ctx.moveTo(20, 40);
  ctx.lineTo(130, 40);
  ctx.stroke();

  ctx.restore();

  ctx.beginPath();
  ctx.moveTo(20, 60);
  ctx.lineTo(130, 60);
  ctx.stroke();
}

paint();
eu.saveScreenshot(ctx, 0, 0, 150, 80,
                  'examples/screenshots/lineDashState.png');

canvas.vgSwapBuffers();
eu.handleTermination();
eu.waitForInput();
