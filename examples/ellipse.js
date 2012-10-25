#!/usr/bin/env node-canvas
/*jslint indent: 2, node: true */
"use strict";

var Canvas = require('../lib/canvas');
var canvas = new Canvas(320, 320);
var ctx = canvas.getContext('2d');
var eu = require('./util');

ctx.clearRect(0, 0, canvas.width, canvas.height);

ctx.beginPath();
ctx.lineWidth = 5;

var segments = 200;
var x = 100;
var y = 100;
var radiusX = 100;
var radiusY = 50;
var startAngle = 0;
var endAngle = Math.PI / 2;
var rotation = Math.PI / 6;

function rotate(p, angle) {
  var x = p.x * Math.cos(angle) - p.y * Math.sin(angle);
  p.y = p.x * Math.sin(angle) + p.y * Math.cos(angle);
  p.x = x;
}

function ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle) {
  var p = { x: radiusX * Math.cos(startAngle), y: radiusY * Math.sin(startAngle) };
  rotate(p, rotation);
  ctx.moveTo(x + p.x, y + p.y);

  for (var i = 1; i <= segments; i++) {
    p.x = radiusX * Math.cos(startAngle + i * (endAngle - startAngle) / segments);
    p.y = radiusY * Math.sin(startAngle + i * (endAngle - startAngle) / segments);
    rotate(p, rotation);
    ctx.lineTo(x + p.x, y + p.y);
    // console.log('x: ' + (x + px) + '\n' +
    //             'y: ' + (y + py));
  }
}

ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle);

ctx.strokeStyle = 'white';
ctx.beginPath();
ctx.ellipse(x, y, radiusX, radiusY, rotation, 0, 2 * Math.PI, false);
ctx.stroke();
ctx.beginPath();
ctx.ellipse(x + 200, y, radiusX, radiusY, rotation, 0, 2 * Math.PI, false);
ctx.stroke();
ctx.beginPath();
ctx.ellipse(x, y + 200, radiusX, radiusY, rotation, 0, 2 * Math.PI, false);
ctx.stroke();
ctx.beginPath();
ctx.ellipse(x + 200, y + 200, radiusX, radiusY, rotation, 0, 2 * Math.PI, false);
ctx.stroke();

ctx.strokeStyle = 'red';
ctx.beginPath();
ctx.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, false);
ctx.stroke();
ctx.beginPath();
ctx.ellipse(x + 200, y, radiusX, radiusY, rotation, startAngle, endAngle, true);
ctx.stroke();
ctx.beginPath();
ctx.ellipse(x, y + 200, radiusX, radiusY, rotation, endAngle, startAngle, false);
ctx.stroke();
ctx.beginPath();
ctx.ellipse(x + 200, y + 200, radiusX, radiusY, rotation, endAngle, startAngle, true);
ctx.stroke();

ctx.stroke();
canvas.vgSwapBuffers();

eu.handleTermination();
eu.waitForInput();
