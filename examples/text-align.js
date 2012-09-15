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
ctx.font = '80px serif';

var m = ctx.measureText("Top");
var h = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
var hw = m.actualBoundingBoxLeft;
var y = 300 + (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) / 2 - m.actualBoundingBoxDescent;

ctx.translate(320, y);
ctx.scale(2, 2);

ctx.globalAlpha = .5;

ctx.lineWidth = 1/2;
ctx.beginPath();
ctx.moveTo(-hw * 1.2, -(m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) / 2 + m.actualBoundingBoxDescent);
ctx.lineTo(+hw * 1.2, -(m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) / 2 + m.actualBoundingBoxDescent);
ctx.moveTo(-hw * 1.2, 0);
ctx.lineTo(+hw * 1.2, 0);
ctx.moveTo(        0, -m.actualBoundingBoxAscent - 0.1 * h);
ctx.lineTo(        0, m.actualBoundingBoxDescent + 0.1 * h);
ctx.stroke();

ctx.lineWidth = 2;
ctx.globalAlpha = 1;
ctx.fillText('Top', 0, 0);
ctx.strokeStyle = '#004080';
ctx.strokeText('Top', 0, 0);

ctx.lineWidth = 1/2;
ctx.strokeStyle = '#f00';
ctx.strokeRect(m.actualBoundingBoxLeft,
               -m.actualBoundingBoxAscent,
               m.actualBoundingBoxRight - m.actualBoundingBoxLeft,
               m.actualBoundingBoxAscent + m.actualBoundingBoxDescent);

ctx.strokeStyle = '#00ff80';
ctx.beginPath();
ctx.moveTo(-hw * 1.2, m.emHeightDescent);
ctx.lineTo(+hw * 1.2, m.emHeightDescent);
ctx.stroke();

ctx.strokeStyle = '#0080ff';
ctx.beginPath();
ctx.moveTo(-hw * 1.2, -m.emHeightAscent);
ctx.lineTo(+hw * 1.2, -m.emHeightAscent);
ctx.stroke();

canvas.vgSwapBuffers()
eu.handleTermination();
eu.waitForInput();
