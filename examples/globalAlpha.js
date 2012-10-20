#!/usr/bin/env node-canvas
/*jslint indent: 2, node: true */
"use strict";

var eu = require('./examples-util');

/**
 * Module dependencies.
 */

var Canvas = require('../lib/canvas');
var canvas = new Canvas(150, 150);
var ctx = canvas.getContext('2d');
var eu = require('./examples-util');
var fs = require('fs');

ctx.clearRect(0, 0, canvas.width, canvas.height); //lll
ctx.scale(4, 4);

ctx.fillStyle = '#FD0';
ctx.fillRect(0, 0, 75, 75);
ctx.fillStyle = '#6C0';
ctx.fillRect(75, 0, 75, 75);
ctx.fillStyle = '#09F)';
ctx.fillRect(0, 75, 75, 75);
ctx.fillStyle = '#F30';
ctx.fillRect(75, 75, 150, 150);
ctx.fillStyle = '#FFF';

// set transparency value
ctx.globalAlpha = 0.2;

// Draw semi transparent circles
for (var i = 0; i < 7; i++) {
  ctx.beginPath();
  ctx.arc(75, 75, 10 + 10 * i, 0, Math.PI * 2, true);
  ctx.fill();
}

canvas.vgSwapBuffers();
eu.handleTermination();
eu.waitForInput();
