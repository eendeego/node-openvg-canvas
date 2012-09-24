#!/usr/bin/env node-canvas

/**
 * Module dependencies.
 */

var Canvas = require('../lib/canvas')
  , canvas = new Canvas(400, 100)
  , ctx = canvas.getContext('2d')
  , fs = require('fs');

var eu = require('./examples-util');

ctx.clearRect(0,0,canvas.width,canvas.height);

ctx.globalAlpha = 1;
ctx.font = 'normal 16px Impact';

ctx.textBaseline = 'top';

// Note this demo depends node-canvas being installed with pango support,
// and your system having installed fonts supporting the glyphs.

//////ctx.fillStyle = '#000';
ctx.fillStyle = '#fff';
ctx.fillText("English: Some text in Impact.", 10, 10);
ctx.fillText("Japanese: 図書館の中では、静かにする。", 10, 30);
ctx.fillText("Arabic: اللغة العربية هي أكثر اللغات تحدثا ضمن", 10, 50);
ctx.fillText("Korean: 모타는사라미 못하는 사람이", 10, 70);

canvas.vgSwapBuffers()
eu.handleTermination();
eu.waitForInput();
