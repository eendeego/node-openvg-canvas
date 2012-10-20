#!/usr/bin/env node-canvas
/*jslint indent: 2, node: true */
/*global Image: true */
"use strict";

var Canvas = require('../lib/canvas');
var Image = Canvas.Image;
var canvas = new Canvas(200, 200);
var ctx = canvas.getContext('2d');
var fs = require('fs');

var eu = require('./examples-util');
var shapes = require('./shapes');

ctx.clearRect(0, 0, canvas.width, canvas.height);

function drawSquadron(bx, by) {
  shapes.drawColoredSquare(ctx, 120, bx +   0, by +   0, '#00f');
  shapes.drawColoredSquare(ctx, 120, bx + 240, by +   0, '#0f0');
  shapes.drawColoredSquare(ctx, 120, bx +   0, by + 240, '#f00');
  shapes.drawColoredSquare(ctx, 120, bx + 240, by + 240, '#000');
}

drawSquadron(0, 0);
ctx.save();

var screenCapure = new Image();
console.log('Capturing screen as a PNG...');
var screenAsBuffer = canvas.toBuffer();
console.log('Rendering it back to an Image object...');
screenCapure.src = screenAsBuffer;
console.log('Done.');

var squid = fs.readFileSync(__dirname + '/images/squid.png');
var img = new Image();

// Incomplete image. Don't do anything, including crashing.
ctx.drawImage(img, 0, 0, 100, 100);

img.src = squid;
ctx.drawImage(img, 30, 50, img.width / 4, img.height / 4);


function secondScreen() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  canvas.vgSwapBuffers();
  eu.waitForInput('Press return for the grand finale.', thirdScreen);
}

function thirdScreen() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(screenCapure, 0, 0);

  ctx.restore();
  drawSquadron(120, 120);

  canvas.vgSwapBuffers();
  eu.waitForInput();
}

canvas.vgSwapBuffers();
eu.waitForInput('Press return to turn off the lights.', secondScreen);
