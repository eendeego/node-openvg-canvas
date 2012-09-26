#!/usr/bin/env node-canvas
/*jslint indent: 2, node: true */

"use strict";

/**
 * Module dependencies.
 */

var util = require('util');
var Canvas = require('../lib/canvas');
var canvas = new Canvas(800, 800);
var ctx = canvas.getContext('2d');

var eu = require('./examples-util');

var growthInterval = 100;
var growthRate = 1.1;
var rotation = 0;
var textSize = 40;
var fullText = [];
var lastTime = 0;

function addText(time) {
  if (Math.floor(time / growthInterval) > lastTime) {
    fullText.push({ size: textSize, rotation: rotation, text: 'Abracadabra' });
    textSize *= growthRate;
    rotation = -Math.PI / 180 * 5;
    lastTime = Math.floor(time / growthInterval);
  }
}

function text(time) {
  addText(time);

  ctx.resetTransform();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.textBaseline = 'middle';

  ctx.rotate(-(fullText.length - 1) * rotation);
  fullText.map(function (el) {
    ctx.rotate(el.rotation);
    ctx.translate(-el.size * 0.1, el.size * 0.1);
    ctx.font = 'normal ' + Math.round(el.size) + 'px serif';
    ctx.fillText(el.text, 0, 0);
  });
}

eu.animate(function (time) {
  text(time);
});

eu.handleTermination();

eu.waitForInput();
