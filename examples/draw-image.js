#!/usr/bin/env node-canvas

/**
 * Module dependencies.
 */

var Canvas = require('../lib/canvas')
  , Image = Canvas.Image
  , canvas = new Canvas(200, 200)
  , ctx = canvas.getContext('2d')
  , fs = require('fs');

var eu = require('./examples-util');

var grid = fs.readFileSync(__dirname + '/images/grid.gif');
img = new Image;
img.src = grid;

var x0 = 64, y0 = 64;
var x = x0, y = y0;

ctx.clearRect(0,0,canvas.width,canvas.height);
ctx.imageSmoothingEnabled = false;

ctx.fillStyle = '#fff';
ctx.fillRect(x, y, 128, 128); // This rect shouldn't be visible
ctx.drawImage(img, 64, 64); // Default to image width, height

x += 128;
x += 64;
ctx.fillRect(x, y, 256, 256); // This rect shouldn't be visible
ctx.drawImage(img, x, y, 256, 256);

x += 256;
x += 64;
ctx.fillRect(x, y, 64, 64); // This rect shouldn't be visible
ctx.drawImage(img, x, y, 64, 64);

x = x0;
y += 256;
y += 64;

ctx.fillRect(x, y, 128, 128); // This rect shouldn't be visible
ctx.drawImage(img, 0, 0, 128, 128, x, y, 128, 128);

x += 128;
x += 64;
ctx.fillRect(x, y, 128, 128); // This rect shouldn't be visible
ctx.drawImage(img, 64, 64, 64, 64, x, y, 128, 128);

x += 128;
x += 64;
ctx.fillRect(x, y, 256, 256); // This rect shouldn't be visible
ctx.drawImage(img, 32, 32, 64, 64, x, y, 256, 256);

x += 256;
x += 64;
ctx.fillRect(x, y, 32, 32); // This rect shouldn't be visible
ctx.drawImage(img, 32, 32, 64, 64, x, y, 32, 32);

x = x0;
y += 256;
y += 64;

ctx.fillRect(x, y, 128, 64); // This rect shouldn't be visible
ctx.drawImage(img, 0, 0, 128, 128, x, y, 128, 64);

x += 128;
x += 64;
ctx.fillRect(x, y, 64, 64); // This rect shouldn't be visible
ctx.drawImage(img, 64, 64, 128, 64, x, y, 128, 64);

x += 128;
x += 64;
ctx.fillRect(x, y, 256, 128); // This rect shouldn't be visible
ctx.drawImage(img, 32, 32, 64, 64, x, y, 256, 128);

x += 256;
x += 64;
ctx.fillRect(x, y, 64, 128); // This rect shouldn't be visible
ctx.drawImage(img, 32, 32, 64, 64, x, y, 64, 128);

canvas.vgSwapBuffers();
eu.waitForInput();
