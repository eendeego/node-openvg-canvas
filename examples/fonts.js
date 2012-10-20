#!/usr/bin/env node-canvas
/*jslint indent: 2, node: true */
"use strict";

var util = require('util');
var Canvas = require('../lib/canvas');
var canvas = new Canvas(800, 800);
var ctx = canvas.getContext('2d');

var eu = require('./util');

var growthInterval = 50;
var growthRate = 1.1;
var rotationStep = -Math.PI / 180 * 5;
var textSize = 40;
var fullText = [];
var lastTime = 0;

var i = 0;
function text(time) {
  if (Math.floor(time / growthInterval) <= lastTime) return;

  textSize *= growthRate;
  lastTime = Math.floor(time / growthInterval);

  ctx.resetTransform();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';

  ctx.rotate(i * rotationStep);
  ctx.font = 'normal ' + Math.round(textSize) + 'px serif';
  ctx.fillText('Abracadabra', 0, 0);

  ctx.beginPath();
  ctx.moveTo(-5, -5);
  ctx.lineTo(+5, +5);
  ctx.moveTo(-5, +5);
  ctx.lineTo(+5, -5);
  ctx.stroke();

  i++;
}

ctx.resetTransform();
ctx.clearRect(0, 0, canvas.width, canvas.height);
canvas.vgSwapBuffers();
ctx.strokeStyle = 'red';

eu.animate(function (time) {
  text(time);
});

eu.handleTermination();

eu.waitForInput();
