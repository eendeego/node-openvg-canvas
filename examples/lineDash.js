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
  ctx.beginPath();
  ctx.setLineDash(dashList);
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
}

var startTime = undefined;
var savedScreenshot = false;
function paint(time) {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (startTime) {
    ctx.lineDashOffset = (time - startTime) / 20;
  } else {
    startTime = time;
  }

  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  for (var i = 0; i < dashLists.length; i++) {
    dashedLine(50, 50 + hh * i, 450, 50 + hh * i, dashLists[i]);
  }

  if (!savedScreenshot && (time - startTime) > 100) {
    eu.saveScreenshot(ctx, 0, 0, 500, 400,
                      'examples/screenshots/lineDash.png');
    savedScreenshot = true;
  }
}

eu.animate(paint);

eu.handleTermination();

eu.waitForInput();
