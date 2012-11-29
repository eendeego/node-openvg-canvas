#!/usr/bin/env node-canvas
/*jslint indent: 2, node: true */
"use strict";

var util = require('util');
var Canvas = require('../lib/canvas');
var canvas = new Canvas();
var ctx = canvas.getContext('2d');
var eu = require('./util');

var width = 500, height = 400;
ctx.clearRect(0, 0, canvas.width, canvas.height);

function paint(time) {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, width, height);

  ctx.save();

  ctx.beginPath();
  ctx.rect(50, 50, 100, 100);
  ctx.clip();

  ctx.fillStyle = 'rgba(255,0,0,0.5)';
  ctx.fillRect(0, 0, width, height);

  ctx.save();

  ctx.beginPath();
  ctx.rect(100, 100, 100, 100);
  ctx.clip();

  ctx.fillStyle = 'rgba(0,255,0,0.5)';
  ctx.fillRect(0, 0, width, height);

  ctx.restore();

  ctx.beginPath();
  ctx.rect(75, 125, 100, 100);
  ctx.clip();

  ctx.fillStyle = 'rgba(0,0,255,0.5)';
  ctx.fillRect(0, 0, width, height);

  ctx.restore();

  ctx.beginPath();
  ctx.rect(125, 75, 100, 100);
  ctx.clip();

  ctx.fillStyle = 'rgba(255,255,0,0.5)';
  ctx.fillRect(0, 0, width, height);
}

paint();

canvas.vgSwapBuffers();

eu.saveScreenshot(ctx, 0, 0, width, height,
                  'examples/screenshots/clippingState.png');
console.log('Screenshot taken.');

eu.handleTermination();
eu.waitForInput();
