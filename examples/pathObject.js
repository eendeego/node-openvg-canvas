#!/usr/bin/env node-canvas
/*jslint indent: 2, node: true */
"use strict";

var util = require('util');
var Canvas = require('../lib/canvas');
var Path = Canvas.Path;
var canvas = new Canvas();
var ctx = canvas.getContext('2d');
var eu = require('./util');

function paint() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  var p = new Path();
  p.moveTo(40, 0);
  p.arc(0, 0, 40, 0, Math.PI * 2, false);

  p.moveTo(25, 0);
  p.arc(0, 0, 25, 0, Math.PI, false);

  p.moveTo(-10 + 5, -10);
  p.arc(-10, -10, 5, 0, Math.PI * 2, false);
  p.moveTo(10 + 5, -10);
  p.arc(10, -10, 5, 0, Math.PI * 2, false);

  p.addPath(p, new Canvas.SVGMatrix().mTranslate(100, 0));
  p.addPath(p, new Canvas.SVGMatrix().mRotate(Math.PI/2).mTranslate(200, 0));

  ctx.lineWidth = 5;

  for (var i = 0; i < 200; i++) {
    ctx.resetTransform();
    ctx.translate(Math.random() * canvas.width, Math.random() * canvas.height);
    ctx.rotate(Math.random() * Math.PI - Math.PI/2);

    ctx.strokeStyle = 'rgba(' + Math.random() * 255 + ',' +
      Math.random() * 255 + ',' + Math.random() * 255 + ',' +
      Math.random() + ')';

    ctx.stroke(p);
  }
}

paint();

canvas.vgSwapBuffers();

eu.handleTermination();
eu.waitForInput();
