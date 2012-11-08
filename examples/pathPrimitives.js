#!/usr/bin/env node-canvas
/*jslint indent: 2, node: true */
"use strict";

var util = require('util');
var Canvas = require('../lib/canvas');
var Path = Canvas.Path;
var canvas = new Canvas();
var ctx = canvas.getContext('2d');
var eu = require('./util');

var dotRadius = 5;

var dotPath = new Path();
var linePath = new Path();
var pathPath = new Path();

function dot(x, y) {
  dotPath.moveTo(x + dotRadius, y);
  dotPath.arc(x, y, dotRadius, 0, 2 * Math.PI, false);
}

function segmentDraft(x0, y0, x1, y1, d0, d1) {
  if (d0 === undefined) d0 = 20;
  if (d1 === undefined) d1 = d0;
  var vX = x1 - x0;
  var vY = y1 - y0;
  var modV = Math.sqrt(vX * vX + vY * vY);
  vX /= modV;
  vY /= modV;

  linePath.moveTo(x0 - d0 * vX, y0 - d0 * vY);
  linePath.lineTo(x1 + d1 * vX, y1 + d1 * vY);
}

function lineToDraft(x0, y0, x1, y1) {
  segmentDraft(x0, y0, x1, y1);

  dot(x0, y0);
  dot(x1, y1);

  pathPath.moveTo(x0, y0);
  pathPath.lineTo(x1, y1);
}

function quadraticCurveToDraft(x0, y0, x1, y1, x2, y2) {
  segmentDraft(x0, y0, x1, y1, 20, 10);
  segmentDraft(x1, y1, x2, y2, 10, 20);

  dot(x0, y0);
  dot(x1, y1);
  dot(x2, y2);

  pathPath.moveTo(x0, y0);
  pathPath.quadraticCurveTo(x1, y1, x2, y2);
}

function bezierCurveToDraft(x0, y0, x1, y1, x2, y2, x3, y3) {
  segmentDraft(x0, y0, x1, y1, 20, 10);
  segmentDraft(x1, y1, x2, y2, 10, 10);
  segmentDraft(x2, y2, x3, y3, 10, 20);

  dot(x0, y0);
  dot(x1, y1);
  dot(x2, y2);
  dot(x3, y3);

  pathPath.moveTo(x0, y0);
  pathPath.bezierCurveTo(x1, y1, x2, y2, x3, y3);
}

function arcToDraft(x0, y0, x1, y1, x2, y2, rx, ry, rotation) {
  segmentDraft(x0, y0, x1, y1, 20, 0);
  segmentDraft(x1, y1, x2, y2, 0, 20);

  dot(x0, y0);
  dot(x1, y1);
  dot(x2, y2);

  pathPath.moveTo(x0, y0);
  pathPath.arcTo(x1, y1, x2, y2, rx, ry, rotation);
}

function arcDraft(x0, y0, x1, y1, r, startAngle, endAngle, anticlockwise) {
  ellipseDraft(x0, y0, x1, y1, r, r, 0, startAngle, endAngle, anticlockwise);
}

function ellipseDraft(x0, y0, x1, y1, rX, rY, rotation, startAngle, endAngle, anticlockwise) {
  dot(x0, y0);
  dot(x1, y1);

  pathPath.moveTo(x0, y0);
  pathPath.ellipse(x1, y1, rX, rY, rotation, startAngle, endAngle, anticlockwise);
}

function rectDraft(x, y, w, h) {
  segmentDraft(x, y, x + w, y, 20, 10);
  segmentDraft(x, y, x, y + h, 20, 10);
  segmentDraft(x + w, y, x + w, y + h, 10, 20);
  segmentDraft(x, y + h, x + w, y + h, 10, 20);

  dot(x, y);
  dot(x + w, y + h);

  pathPath.rect(x, y, w, h);
}

function paint() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  var bx, by, grid = 200, inset = 50, width = grid - 2 * inset;

  bx = grid * 0; by = grid * 0 + grid / 2;
  lineToDraft(bx + inset, by, bx + grid - inset, by);

  bx = grid * 0; by = grid * 1 + grid / 2;
  quadraticCurveToDraft(bx + inset       , by + width / 4,
                        bx + grid / 2    , by - width / 4,
                        bx + grid - inset, by + width / 4);

  bx = grid * 0; by = grid * 2 + grid / 2;
  bezierCurveToDraft(bx + inset                , by,
                     bx + inset +     width / 4, by - width / 4,
                     bx + inset + 3 * width / 4, by + width / 4,
                     bx + grid - inset         , by);

  bx = grid * 0; by = grid * 3 + 2 * width / 3;
  bezierCurveToDraft(bx + inset       , by,
                     bx + inset       , by - 2 * width / 3,
                     bx + grid - inset, by - 2 * width / 3,
                     bx + grid - inset, by);

  bx = grid * 1; by = grid * 0 + grid / 2;
  arcToDraft(bx + inset       , by - width / 2,
             bx + grid - inset, by - width / 2,
             bx + grid - inset, by + width / 2,
             width / 4);

  bx = grid * 1; by = grid * 1 + grid / 2;
  arcToDraft(bx + inset       , by - width / 2,
             bx + grid - inset, by - width / 2,
             bx + grid - inset, by + width / 2,
             width / 2, width / 4, 0);

  bx = grid * 1; by = grid * 2 + grid / 2;
  arcToDraft(bx + inset       , by - width / 2,
             bx + grid - inset, by - width / 2,
             bx + grid - inset, by + width / 2,
             width / 2, width / 4, Math.PI / 6);

  bx = grid * 2; by = grid * 0;
  arcDraft(bx + grid - inset, by + inset,
           bx + grid / 2, by + grid / 2,
           width / 3,
           0, Math.PI,
           false);

  bx = grid * 2; by = grid * 1;
  arcDraft(bx + grid - inset, by + inset,
           bx + grid / 2, by + grid / 2,
           width / 3,
           0, Math.PI,
           true);

  bx = grid * 2; by = grid * 2;
  arcDraft(bx + grid / 2 + width / 3, by + grid / 2,
           bx + grid / 2, by + grid / 2,
           width / 3,
           0, Math.PI / 2,
           false);

  bx = grid * 2; by = grid * 3;
  arcDraft(bx + grid / 2 + width / 3, by + grid / 2,
           bx + grid / 2, by + grid / 2,
           width / 3,
           0, Math.PI / 2,
           true);


  bx = grid * 3; by = grid * 0;
  ellipseDraft(bx + grid - inset, by + inset,
               bx + grid / 2, by + grid / 2,
               width / 3, width / 6, 0,
               0, Math.PI,
               false);

  bx = grid * 3; by = grid * 1;
  ellipseDraft(bx + grid - inset, by + inset,
               bx + grid / 2, by + grid / 2,
               width / 3, width / 6, 0,
               0, Math.PI,
               true);

  bx = grid * 3; by = grid * 2;
  ellipseDraft(bx + grid / 2 + width / 3, by + grid / 2,
               bx + grid / 2, by + grid / 2,
               width / 3, width / 6, 0,
               0, Math.PI / 2,
               false);

  bx = grid * 3; by = grid * 3;
  ellipseDraft(bx + grid / 2 + width / 3, by + grid / 2,
               bx + grid / 2, by + grid / 2,
               width / 3, width / 6, 0,
               0, Math.PI / 2,
               true);

  bx = grid * 4; by = grid * 0;
  ellipseDraft(bx + grid - inset, by + inset,
               bx + grid / 2, by + grid / 2,
               width / 3, width / 6, Math.PI / 6,
               0, Math.PI,
               false);

  bx = grid * 4; by = grid * 1;
  ellipseDraft(bx + grid - inset, by + inset,
               bx + grid / 2, by + grid / 2,
               width / 3, width / 6, Math.PI / 6,
               0, Math.PI,
               true);

  bx = grid * 4; by = grid * 2;
  ellipseDraft(bx + grid / 2 + width / 3 * Math.cos(Math.PI / 6),
               by + grid / 2 + width / 3 * Math.sin(Math.PI / 6),
               bx + grid / 2,
               by + grid / 2,
               width / 3, width / 6, Math.PI / 6,
               0, Math.PI / 2,
               false);

  bx = grid * 4; by = grid * 3;
  ellipseDraft(bx + grid / 2 + width / 3 * Math.cos(Math.PI / 6),
               by + grid / 2 + width / 3 * Math.sin(Math.PI / 6),
               bx + grid / 2,
               by + grid / 2,
               width / 3, width / 6, Math.PI / 6,
               0, Math.PI / 2,
               true);

  bx = grid * 5; by = grid * 0;
  rectDraft(bx + inset, by + inset,
            width, width);

  bx = grid * 5; by = grid * 1;
  rectDraft(bx + inset, by + inset,
            width, width / 2);

  bx = grid * 5; by = grid * 2;
  rectDraft(bx + inset, by + inset,
            width / 2, width);

  ctx.lineJoin = 'round';

  ctx.strokeStyle = 'red';
  ctx.lineWidth = '2';
  ctx.stroke(linePath);

  ctx.fillStyle = 'white';
  ctx.fill(dotPath);

  ctx.globalAlpha = 0.5;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#00de28';
  ctx.lineWidth = 2 * (dotRadius + 2);
  ctx.stroke(pathPath);

  ctx.globalAlpha = 1.0;
}

// ctx.scale(2,2);
paint();

canvas.vgSwapBuffers();

eu.handleTermination();
eu.waitForInput();
