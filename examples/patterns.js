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

var width = 500, height = 400;
ctx.clearRect(0, 0, canvas.width, canvas.height);

var pattern_no_repeat, pattern_repeat, pattern_repeat_x, pattern_repeat_y;

var image = new Image();
var image_ready = true;

image.src = fs.readFileSync(__dirname + '/images/grido4.png');
pattern_no_repeat = ctx.createPattern(image, 'no-repeat');
pattern_repeat    = ctx.createPattern(image, 'repeat');
pattern_repeat_x  = ctx.createPattern(image, 'repeat-x');
pattern_repeat_y  = ctx.createPattern(image, 'repeat-y');

function paintRect(x, y, w, h, paintFn) {
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  paintFn();
}

function fill() {
  ctx.fill();
}

function stroke() {
  ctx.stroke();
}

function fillRects(x, y) {
  ctx.fillStyle = pattern_no_repeat;
  paintRect(x +  10, y +  10, 90, 90, fill);
  ctx.fillStyle = pattern_repeat_x;
  paintRect(x + 100, y +  10, 90, 90, fill);
  ctx.fillStyle = pattern_repeat_y;
  paintRect(x +  10, y + 100, 90, 90, fill);
  ctx.fillStyle = pattern_repeat;
  paintRect(x + 100, y + 100, 90, 90, fill);
}

function strokeRects(x, y) {
  ctx.strokeStyle = pattern_no_repeat;
  paintRect(x +  10, y +  10, 90, 90, stroke);
  ctx.strokeStyle = pattern_repeat_x;
  paintRect(x + 100, y +  10, 90, 90, stroke);
  ctx.strokeStyle = pattern_repeat_y;
  paintRect(x +  10, y + 100, 90, 90, stroke);
  ctx.strokeStyle = pattern_repeat;
  paintRect(x + 100, y + 100, 90, 90, stroke);
}

var startTime = undefined;
function paint(time) {
  var delta = undefined;
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (startTime) {
    delta = (time - startTime) / 20;
  } else {
    startTime = time;
    return;
  }

  if (!image_ready) {
    return;
  }

  ctx.translate(100, 0);
  ctx.rotate(Math.PI / 6);

  fillRects(0, 0, fill);

  ctx.translate(200, 0);
  ctx.lineWidth = 10;
  strokeRects(0, 0, fill);
  ctx.translate(-200, 0);

  ctx.rotate(-Math.PI / 6);
  ctx.translate(-100, 0);
}

function animate(t) {
  paint(t);
  requestAnimationFrame(animate);
}

animate();
