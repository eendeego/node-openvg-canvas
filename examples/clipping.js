#!/usr/bin/env node-canvas
/*jslint indent: 2, node: true */
"use strict";

var util = require('util');
var Canvas = require('../lib/canvas');
var canvas = new Canvas();
var ctx = canvas.getContext('2d');
var eu = require('./util');

var width = 500, height = 400;
ctx.clearRect(0, 0, canvas.width, canvas.height);

var forceSaveRestore = false;

function defineMask(callback) {
  var radius = height / 10;
  var angle = Math.PI / 3;

  ctx.translate(width / 2, height / 3);
  ctx.beginPath();
  ctx.moveTo(radius * Math.cos(angle), radius * Math.sin(angle));
  ctx.arc(0 /* x */, 0 /* y */, radius /* radius */, angle, Math.PI - angle, true);
  ctx.lineTo(-radius * 3 / 4, radius * 3);
  ctx.lineTo(radius * 3 / 4, radius * 3);
  ctx.closePath();

  if (callback) callback();

  ctx.translate(-width / 2, -height / 3);
}

var clip = false;
function setMask() {
  if (clip) { return; }

  if (!ctx.resetClip || forceSaveRestore) {
    // Without resetClip there's no way to reset the clipping region
    // except for save/restore.
    ctx.save();
  }
  // defineMask(function () {
  //   ctx.strokeStyle = 'white';
  //   ctx.stroke();
  // });
  defineMask(function () {
    ctx.clip();
  });
  defineMask();
  clip = true;
}

function resetMask() {
  if (!clip) { return; }
  if (ctx.resetClip && !forceSaveRestore) {
    ctx.resetClip();
  } else {
    // Without resetClip there's no way to reset the clipping region
    // except for save/restore.
    ctx.restore();
  }
  clip = false;
}

function setup() {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, width, height);

  process.argv.forEach(function (val, index, array) {
    if ('-f' === val) {
      forceSaveRestore = true;
    }
  });

  ctx.lineWidth = 2;
  setMask();
  ctx.strokeStyle = 'rgba(128,0,0,0.5)';
}

var startTime = undefined;
function paint(time) {
  var color = Math.floor(Math.random() * 255);
  var alpha = Math.random();
  if (startTime) {
    if (((time - startTime) / 1000) % 4 < 2) {
      setMask();
      ctx.strokeStyle = 'rgba(' + color + ',0,0,' + (0.5 + alpha * 0.5) + ')';
    } else {
      resetMask();
      ctx.strokeStyle = 'rgba(0,0,' + color + ',' + alpha * 0.5 + ')';
    }
  } else {
    startTime = time;
  }

  ctx.beginPath();
  ctx.moveTo(Math.random() * width, Math.random() * height);
  ctx.lineTo(Math.random() * width, Math.random() * height);
  ctx.stroke();
}

setup();

eu.animate(paint);

eu.handleTermination();

setTimeout(function () {
  eu.saveScreenshot(ctx, 0, 0, width, height,
                    'examples/screenshots/clipping.png');
  console.log('Screenshot taken.');
}, 2 * 60 * 1000);

eu.waitForInput();
