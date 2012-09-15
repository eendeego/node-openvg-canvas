#!/usr/bin/env ./node_modules/openvg/bin/node-pi

/**
 * Module dependencies.
 */

var Canvas = require('../lib/canvas')
  , canvas = new Canvas(800, 800)
  , ctx = canvas.getContext('2d')
  , fs = require('fs');

var eu = require('./examples-util');

ctx.clearRect(0,0,canvas.width,canvas.height);
ctx.strokeStyle = '#fff';

ctx.globalAlpha = .5;

ctx.beginPath();
ctx.moveTo( 80, 600);
ctx.lineTo(720, 600);

ctx.moveTo(640, 100);
ctx.lineTo(640, 500);
ctx.stroke();

ctx.globalAlpha = 1;
ctx.fillStyle = '#ddd';
ctx.font = '20px serif';

ctx.textBaseline = 'middle';
ctx.textAlign = 'left';
ctx.fillText('left', 640, 200);

ctx.textAlign = 'center';
ctx.fillText('center', 640, 300);

ctx.textAlign = 'right';
ctx.fillText('right', 640, 400);

ctx.textAlign = 'center';
ctx.textBaseline = 'bottom';
ctx.fillText('bottom', 160, 600);

ctx.textBaseline = 'alphabetic';
ctx.fillText('alpha', 320, 600);

ctx.textBaseline = 'middle';
ctx.fillText('middle', 480, 600);

ctx.textBaseline = 'top';
ctx.fillText('top', 640, 600);

ctx.textAlign = 'center';
ctx.textBaseline = 'alphabetic';
ctx.font = '160px serif';

var m = ctx.measureText("Top");
var y = 300 + (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) / 2 - m.actualBoundingBoxDescent;

ctx.globalAlpha = .5;

ctx.beginPath();
ctx.moveTo(100, 300);
ctx.lineTo(540, 300);
ctx.moveTo(100, y);
ctx.lineTo(540, y);
ctx.moveTo(320, y - 200);
ctx.lineTo(320, y + 20);
ctx.stroke();

ctx.globalAlpha = 1;
ctx.fillText('Top', 320, y);

ctx.strokeStyle = '#f00';
ctx.strokeRect(320 + m.actualBoundingBoxLeft,
               y - m.actualBoundingBoxAscent,
               m.actualBoundingBoxRight - m.actualBoundingBoxLeft,
               m.actualBoundingBoxAscent + m.actualBoundingBoxDescent);

ctx.strokeStyle = '#00ff80';
ctx.beginPath();
ctx.moveTo(100, y + m.emHeightDescent);
ctx.lineTo(540, y + m.emHeightDescent);
ctx.stroke();

ctx.strokeStyle = '#0080ff';
ctx.beginPath();
ctx.moveTo(100, y - m.emHeightAscent);
ctx.lineTo(540, y - m.emHeightAscent);
ctx.stroke();

canvas.vgSwapBuffers()
eu.handleTermination();
eu.waitForInput();
