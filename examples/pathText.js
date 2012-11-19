#!/usr/bin/env node-canvas
/*jslint indent: 2, node: true */
"use strict";

var util = require('util');
var Canvas = require('../lib/canvas');
var DrawingStyle = Canvas.DrawingStyle;
var SVGMatrix = Canvas.SVGMatrix;
var Path = Canvas.Path;
var canvas = new Canvas();
var ctx = canvas.getContext('2d');
var eu = require('./util');

function paint() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  var font = '30px sans-serif';

  ctx.font = font;
  var text = 'Awesome Text is Awesome!';
  var metrics = ctx.measureText(text);

  ctx.fillStyle = 'rgb(64,192,255)';
  ctx.moveTo(100 - metrics.actualBoundingBoxLeft - 30,
             100 - metrics.actualBoundingBoxAscent - 30);
  ctx.lineTo(100 - metrics.actualBoundingBoxLeft - 30,
             100 - 30 + metrics.actualBoundingBoxDescent + 60);
  ctx.lineTo(100 - 30 + metrics.actualBoundingBoxRight + 60,
             100 - 30 + metrics.actualBoundingBoxDescent + 60);
  ctx.lineTo(100 - 30 + metrics.actualBoundingBoxRight + 60,
             100 - 30 + metrics.actualBoundingBoxDescent + 50);
  ctx.lineTo(100 - metrics.actualBoundingBoxLeft - 20,
             100 - metrics.actualBoundingBoxAscent - 30);
  ctx.closePath();
  ctx.fill();

  var style = new DrawingStyle();
  style.font = font;

  var transform = new SVGMatrix();

  var p = new Path();

  p.rect(100 - metrics.actualBoundingBoxLeft - 20,
         100 - metrics.actualBoundingBoxAscent - 20,
         metrics.actualBoundingBoxRight + metrics.actualBoundingBoxLeft + 40,
         metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent + 40);

  p.addText(text, style, transform, 100, 100);

  ctx.fillStyle = 'rgb(0,128,255)';

  ctx.fill(p);
}

paint();

canvas.vgSwapBuffers();

eu.handleTermination();
eu.waitForInput();
