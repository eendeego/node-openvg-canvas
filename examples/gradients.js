#!/usr/bin/env node-canvas
/*jslint indent: 2, node: true */
"use strict";

var Canvas = require('../lib/canvas');
var canvas = new Canvas(320, 320);
var ctx = canvas.getContext('2d');
var fs = require('fs');

var eu = require('./util');

ctx.clearRect(0, 0, canvas.width, canvas.height);
ctx.scale(3, 3);

// Create gradients
var lingrad = ctx.createLinearGradient(0, 0, 0, 150);
lingrad.addColorStop(0, '#00ABEB');
lingrad.addColorStop(0.5, '#fff');
lingrad.addColorStop(0.5, '#26C000');
lingrad.addColorStop(1, '#fff');

var lingrad2 = ctx.createLinearGradient(0, 50, 0, 95);
lingrad2.addColorStop(0.5, '#000');
lingrad2.addColorStop(1, 'rgba(0,0,0,0)');

// assign gradients to fill and stroke styles
ctx.fillStyle = lingrad;
ctx.strokeStyle = lingrad2;

// draw shapes
ctx.fillRect(10, 10, 130, 130);
ctx.strokeRect(50, 50, 50, 50);

// Default gradient stops
ctx.fillStyle = '#008000';
ctx.fillRect(150, 0, 150, 150);

lingrad = ctx.createLinearGradient(150, 0, 300, 150);
ctx.fillStyle = lingrad;
ctx.fillRect(160, 10, 130, 130);

// Radial gradients
ctx.fillStyle = '#a00000';
ctx.fillRect(0, 150, 150, 150);

lingrad = ctx.createRadialGradient(30, 180,  50, 30, 180, 100);
lingrad.addColorStop(0, '#00ABEB');
lingrad.addColorStop(0.5, '#fff');
lingrad.addColorStop(0.5, '#26C000');
lingrad.addColorStop(1, '#fff');
ctx.fillStyle = lingrad;
ctx.fillRect(10, 160, 130, 130);

canvas.vgSwapBuffers();
eu.handleTermination();
eu.waitForInput();
