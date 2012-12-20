#!/usr/bin/env node-canvas
/*jslint indent: 2, node: true */
/*global Image: true */
"use strict";

var fs = require('fs');
var util = require('util');
var Canvas = require('../lib/canvas');
var Image = Canvas.Image;
var canvas = new Canvas();
var ctx = canvas.getContext('2d');
var eu = require('./util');

var width = 64, height = 64;
ctx.clearRect(0, 0, canvas.width, canvas.height);

var img = new Image();
img.src = fs.readFileSync(__dirname + '/images/grido2.png');

var forceSaveRestore = false;

function defineMask(callback) {
  var radius = 24;

  ctx.translate(width / 2, height / 2);
  ctx.arc(0 /* x */, 0 /* y */, radius /* radius */, 0, 2 * Math.PI, false);

  if (callback) callback();

  ctx.translate(-width / 2, -height / 2);
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

function paint() {
  process.argv.forEach(function (val, index, array) {
    if ('-f' === val) {
      forceSaveRestore = true;
    }
  });

  setMask();
  ctx.drawImage(img, 0, 0);
  resetMask();
}

paint();
canvas.vgSwapBuffers();

eu.saveScreenshot(ctx, 0, 0, width, height,
                  'examples/screenshots/clipImage.png');
console.log('Screenshot taken.');

eu.handleTermination();
eu.waitForInput();
