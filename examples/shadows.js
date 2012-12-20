#!/usr/bin/env node-canvas
/*jslint indent: 2, node: true */
/*global requestAnimationFrame: true, Image: true */
"use strict";

var util = require('util');
var Canvas = require('../lib/canvas');
var Image = Canvas.Image;
var canvas = new Canvas();
var ctx = canvas.getContext('2d');
var eu = require('./util');
var fs = require('fs');

var width = 380, height = 270;
ctx.clearRect(0, 0, canvas.width, canvas.height);

var background = new Image();
var grid = new Image();
background.src = fs.readFileSync(__dirname + '/images/noisy_grid.png');
grid.src = fs.readFileSync(__dirname + '/screenshots/clipImage.png');
var pattern = ctx.createPattern(background, 'repeat');

function paint() {
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, width, height);

  ctx.save();

  ctx.shadowColor = 'rgba(0,0,0,1.0)';
  ctx.shadowBlur = 5;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  var x, y;

  y = 20;

  ctx.fillStyle = 'rgba(255,0,0,0.5)';
  ctx.fillRect(20, y, 40, 40);
  ctx.beginPath();
  ctx.rect(20 + 60, y, 40, 40);
  ctx.fill();

  ctx.fillStyle = 'rgba(0,255,0,0.5)';
  ctx.fillRect(140, y, 40, 40);
  ctx.beginPath();
  ctx.rect(140 + 60, y, 40, 40);
  ctx.fill();

  ctx.fillStyle = 'rgba(0,0,255,0.5)';
  ctx.fillRect(260, y, 40, 40);
  ctx.beginPath();
  ctx.rect(260 + 60, y, 40, 40);
  ctx.fill();

  y += 60;

  ctx.strokeStyle = 'rgba(255,0,0,0.5)';
  ctx.strokeRect(20, y, 100, 40);

  ctx.strokeStyle = 'rgba(0,255,0,0.5)';
  ctx.strokeRect(140, y, 100, 40);

  ctx.strokeStyle = 'rgba(0,0,255,0.5)';
  ctx.strokeRect(260, y, 100, 40);

  ctx.font = '20px sans-serif';
  y += 80;

  ctx.fillStyle = 'rgba(255,0,0,0.5)';
  ctx.fillText('Shadows', 20, y);

  ctx.fillStyle = 'rgba(0,255,0,0.5)';
  ctx.fillText('Shadows', 140, y);

  ctx.fillStyle = 'rgba(0,0,255,0.5)';
  ctx.fillText('Shadows', 260, y);

  y += 20;
  ctx.drawImage(grid,  20 + 18, y);
  ctx.drawImage(grid, 140 + 18, y);

  ctx.restore();

  ctx.drawImage(grid, 260 + 18, y);
}

paint();

canvas.vgSwapBuffers();

eu.saveScreenshot(ctx, 0, 0, width, height,
                  'examples/screenshots/shadows.png');
console.log('Screenshot taken.');

eu.handleTermination();
eu.waitForInput();
