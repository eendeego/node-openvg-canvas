#!/usr/bin/env node-canvas
/*jslint indent: 2, node: true */
"use strict";

// Based on:
// https://github.com/LearnBoost/node-canvas/blob/master/examples/clock.js
// http://en.wikipedia.org/wiki/Swiss_railway_clock

var fs = require('fs');
var util = require('util');

var vg = require('openvg');
var eu = require('./examples-util');

var Canvas = require('../lib/canvas');
var canvas = new Canvas(320, 320);
var ctx = canvas.getContext('2d');

function getX(angle) {
  return -Math.sin(angle + Math.PI);
}
function getY(angle) {
  return Math.cos(angle + Math.PI);
}

function clock(ctx) {
  var now = new Date();
  var i, x, y;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.scale(3, 3);
  ctx.translate(canvas.width / 6, canvas.height / 6);

  ctx.beginPath();
  ctx.lineWidth = 14;
  ctx.strokeStyle = '#cccccc';
  ctx.fillStyle = '#eeeeee';
  ctx.arc(0, 0, 142, 0, Math.PI * 2, true);
  ctx.stroke();
  ctx.fill();

  ctx.strokeStyle = '#000000';
  ctx.beginPath();
  // Hour marks
  ctx.lineWidth = 10;
  for (i = 0; i < 12; i++) {
    x = getX(Math.PI / 6 * i);
    y = getY(Math.PI / 6 * i);
    ctx.moveTo(x * 100, y * 100);
    ctx.lineTo(x * 125, y * 125);
  }
  ctx.stroke();

  // Minute marks
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (i = 0; i < 60; i++) {
    if (i % 5 !== 0) {
      x = getX(Math.PI / 30 * i);
      y = getY(Math.PI / 30 * i);
      ctx.moveTo(x * 117, y * 117);
      ctx.lineTo(x * 125, y * 125);
    }
  }
  ctx.stroke();

  var hr  = now.getHours();
  var min = now.getMinutes();
  var sec = now.getSeconds();
  var ms  = now.getMilliseconds();
  hr = hr >= 12 ? hr - 12 : hr;

  ctx.fillStyle = "black";

  // write Hours
  x = getX(hr * (Math.PI / 6) + (Math.PI / 360) * min + (Math.PI / 21600) * sec);
  y = getY(hr * (Math.PI / 6) + (Math.PI / 360) * min + (Math.PI / 21600) * sec);
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(x * -20, y * -20);
  ctx.lineTo(x * 80, y * 80);
  ctx.stroke();

  // write Minutes
  x = getX((Math.PI / 30) * min + (Math.PI / 1800) * sec + (Math.PI / 1800000) * ms);
  y = getY((Math.PI / 30) * min + (Math.PI / 1800) * sec + (Math.PI / 1800000) * ms);

  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(x * -28, y * -28);
  ctx.lineTo(x * 120, y * 120);
  ctx.stroke();
  
  // Write seconds
  var rs = sec + ms / 1000;
  if (rs >= 58.5) {
    x = getX(0);
    y = getY(0);
  } else {
    x = getX((sec + ms / 1000) * 2 * Math.PI / 58.5);
    y = getY((sec + ms / 1000) * 2 * Math.PI / 58.5);
  }
  ctx.strokeStyle = "#D40000";
  ctx.fillStyle = "#D40000";
  ctx.lineWidth = 4;

  ctx.beginPath();
  ctx.moveTo(x * -40, y * -40);
  ctx.lineTo(x * 87, y * 87);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(x * 87, y * 87, 13, 0, Math.PI * 2, true);
  ctx.fill();
  ctx.restore();
}

eu.animate(function (time) {
  clock(ctx);
});

eu.handleTermination();

eu.waitForInput();
