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

var textRendering = require('../lib/text/rendering');

var dotRadius = 3;
var dotPath = new Path();

function dot(x, y) {
  dotPath.moveTo(x + dotRadius, y);
  dotPath.arc(x, y, dotRadius, 0, 2 * Math.PI, false);
}

var style = new DrawingStyle();
function pathText(text, x, y, textAlign, textBaseline) {
  ctx.strokeStyle = 'red';
  ctx.lineWidth = 2;

  var baseline = new Path();
  baseline.moveTo(x, y);
  baseline.ellipse(x + 100, y, 100, 50, 0, Math.PI, 2 * Math.PI, false);
  ctx.stroke(baseline);

  if (textAlign === 'left') {
    dot(x, y);
  } else if (textAlign === 'right') {
    dot(x + 200, y);
  } else if (textAlign === 'center') {
    dot(x + 100, y - 50);
  }

  var p = new Path();
  style.textAlign = textAlign;
  style.textBaseline = textBaseline;
  p.addText(text, style, new SVGMatrix(), baseline);
  ctx.fill(p);

  p.destroy();
  baseline.destroy();
}

function paint() {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  var font = '30px sans-serif';

  ctx.textAlign = 'left';
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

  text = 'ellipse'; // Just something with ascenders and descenders
  var xx = 100, yy = 300;
  ['bottom', 'alphabetical', 'middle', 'top'].map(function (textBaseline, baseIdx) {
    ['left', 'center', 'right'].map(function (textAlign, alignIdx) {
      pathText(text, xx + alignIdx * 300, yy + baseIdx * 200, textAlign, textBaseline);
    });
  });

  ctx.fillStyle = 'white';
  ctx.fill(dotPath);
}

paint();

canvas.vgSwapBuffers();

eu.saveScreenshot(ctx, 0, 0, canvas.height, canvas.height,
                  'examples/screenshots/pathText.png');

eu.handleTermination();
eu.waitForInput();
