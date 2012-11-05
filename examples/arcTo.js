#!/usr/bin/env node-canvas
/*jslint indent: 2, node: true */
"use strict";

var util = require('util');
var Canvas = require('../lib/canvas');
var canvas = new Canvas(500, 400);
var ctx = canvas.getContext('2d');
var eu = require('./util');

// ctx.translate(0.5, 0.5);
ctx.scale(3, 3);

var radiusX = 20;
var radiusY = 20;
var rotation = 0;

var softArc = false;


function arcDraft(p1, p2, p3, radiusX, radiusY, rotation) {
  if (radiusY === undefined) {
    radiusY = radiusX;
    rotation = 0;
  }

  var scaleX = radiusY / radiusX;
  var cosRotation = Math.cos(-rotation);
  var sinRotation = Math.sin(-rotation);
  function transform(px, py) {
    return {
      x: (px * cosRotation - py * sinRotation) * scaleX,
      y: px * sinRotation + py * cosRotation
    };
  }
  function reverseTransform(px, py) {
    return {
      x:  px * cosRotation / scaleX + py * sinRotation,
      y: -px * sinRotation / scaleX + py * cosRotation
    };
  }

  var p1_ = transform(p1.x, p1.y);
  var p2_ = transform(p2.x, p2.y);
  var p3_ = transform(p3.x, p3.y);

  var v1 = { x: p2_.x - p1_.x, y: p2_.y - p1_.y };
  var v2 = { x: p3_.x - p2_.x, y: p3_.y - p2_.y };
  var mod_v1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  var mod_v2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

  var dot_prod = v1.x * v2.x + v1.y * v2.y;
  var cross_prod = v1.x * v2.y - v1.y * v2.x;
  var sign = cross_prod > 0 ? 1 : -1;
  var cos_alpha = dot_prod / (mod_v1 * mod_v2);
  var sin_alpha = Math.sqrt(1 - cos_alpha * cos_alpha);

  // tan(x) = sin(2x) / (cos(2x) + 1)
  // tan(x/2) = sin(x) / (cos(x) + 1)
  // r = t * tan(alpha/2)
  // t = rY * sin_alpha / (1 + cos_alpha);
  var t = radiusY * sin_alpha / (1 + cos_alpha);
  var pstart_ = { x: p2_.x - t * v1.x / mod_v1, y: p2_.y - t * v1.y / mod_v1 };
  var pstart = reverseTransform(pstart_.x, pstart_.y);

  var pend_ = { x: p2_.x + t * v2.x / mod_v2, y: p2_.y + t * v2.y / mod_v2 };
  var pend = reverseTransform(pend_.x, pend_.y);

  // To use OpenVG [s/l][c/cc]arc_to erything needed is already here
  //   s / l = always short
  //   cc = sign < 0

  var center_ = { x: pstart_.x - sign * radiusY * v1.y / mod_v1,
                  y: pstart_.y + sign * radiusY * v1.x / mod_v1 };

  var center = reverseTransform(center_.x, center_.y);

  v1 = reverseTransform(v1.x, v1.y);
  v2 = reverseTransform(v2.x, v2.y);
  mod_v1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  mod_v2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

  // baselines
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'red';

  ctx.beginPath();
  ctx.moveTo(p1.x - 20 * v1.x / mod_v1, p1.y - 20 * v1.y / mod_v1);
  ctx.lineTo(p2.x + 20 * v1.x / mod_v1, p2.y + 20 * v1.y / mod_v1);
  ctx.moveTo(p2.x - 20 * v2.x / mod_v2, p2.y - 20 * v2.y / mod_v2);
  ctx.lineTo(p3.x + 20 * v2.x / mod_v2, p3.y + 20 * v2.y / mod_v2);
  ctx.stroke();

  var rc = 4;

  if (cross_prod !== 0) {
    // radius
    ctx.strokeStyle = '#00f';
    ctx.beginPath();
    if (radiusX === radiusY) {
      ctx.moveTo(center.x - radiusX * Math.sqrt(2) / 2,
                 center.y + radiusY * Math.sqrt(2) / 2);
      ctx.lineTo(center.x, center.y);
    } else {
      ctx.moveTo(center.x + radiusX * Math.cos(Math.PI + rotation),
                 center.y + radiusX * Math.sin(Math.PI + rotation));
      ctx.lineTo(center.x, center.y);
      ctx.lineTo(center.x + radiusY * Math.cos(Math.PI / 2 + rotation),
                 center.y + radiusY * Math.sin(Math.PI / 2 + rotation));
    }
    ctx.stroke();

    // start, end angles
    ctx.strokeStyle = '#0080ff';
    var start_angle = Math.atan2(pstart_.y - center_.y, pstart_.x - center_.x);
    var end_angle   = Math.atan2(pend_.y - center_.y, pend_.x - center_.x);
    ctx.beginPath();
    ctx.moveTo(pstart.x, pstart.y);
    ctx.lineTo(center.x, center.y);
    ctx.lineTo(pend.x, pend.y);
    ctx.stroke();

    // base circle
    ctx.strokeStyle = '#888';
    ctx.beginPath();
    ctx.moveTo(center.x + radiusX, center.y);
    ctx.ellipse(center.x, center.y, radiusX, radiusY, rotation, 0, 2 * Math.PI, false);
    ctx.stroke();

    ctx.globalAlpha = 0.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#00de28';
    ctx.lineWidth = 2 * (rc + 2);

    ctx.beginPath();

    ctx.moveTo(p1.x, p1.y);
    if (softArc) {
      // The following code corresponds to:
      // ctx.arcTo(p2.x, p2.y, p3.x, p3.y, r);

      // leading line (x0, y0 -> startx, starty)
      ctx.lineTo(pstart.x, pstart.y);

      // the arc
      ctx.ellipse(center.x, center.y,
                  radiusX, radiusY, rotation, start_angle, end_angle,
                  sign < 0);
    } else {
      ctx.arcTo(p2.x, p2.y, p3.x, p3.y, radiusX, radiusY, rotation);
    }

    ctx.stroke();

    ctx.globalAlpha = 1.0;
    ctx.lineCap = 'butt';
  }

  function dot(p) {
    ctx.moveTo(p.x + rc, p.y);
    ctx.arc(p.x, p.y, rc, 0, 2 * Math.PI, false);
  }

  ctx.fillStyle = 'white';
  ctx.lineWidth = 1;

  // control points
  ctx.beginPath();
  dot(p1);
  dot(p2);
  dot(p3);
  if (cross_prod !== 0) { dot(center); }
  ctx.fill();

  if (cross_prod !== 0) {
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    dot(pstart);
    dot(pend);
    ctx.fill();
  }
}

function paint(now) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // ctx.save();

  var demo = Math.floor(now / 6000) % 3;
  if (demo === 0) {
    radiusX = 20;
    radiusY = 20;
    rotation = 0;
  } else if (demo === 1) {
    radiusX = 40;
    radiusY = 10;
    rotation = 0;
  } else {
    radiusX = 40;
    radiusY = 10;
    rotation = Math.PI / 6;
  }

  var p = [{ x:  400 - 40, y: 100}, { x: 400, y: 100}, { x: 400, y: 140}];
  var deltaT = now % 6000;
  if (deltaT < 1000) {
    p[0].x += deltaT / 40;
  } else if (deltaT < 2000) {
    p[0].x += 25 - (deltaT - 1000) / 40;
  } else if (deltaT < 3000) {
    p[1].x += (deltaT - 2000) / 50;
    p[1].y -= (deltaT - 2000) / 50;
  } else if (deltaT < 4000) {
    p[1].x += 20 - (deltaT - 3000) / 50;
    p[1].y -= 20 - (deltaT - 3000) / 50;
  } else if (deltaT < 5000) {
    p[2].x -= (deltaT - 4000) / 50;
    p[2].y -= (deltaT - 4000) / 50;
  } else  {
    p[2].x -= 20 - (deltaT - 5000) / 50;
    p[2].y -= 20 - (deltaT - 5000) / 50;
  }
  arcDraft(p[0], p[1], p[2], radiusX, radiusY, rotation);

  var rr = 40;
  var center;
  function controlPoint(angle) {
    return { x: center.x + rr * Math.cos(Math.PI * angle),
             y: center.y + rr * Math.sin(Math.PI * angle) };
  }

  center = { x: 100, y: 100 };
  p = [controlPoint(5 / 4), center, controlPoint(deltaT / 3000)];
  arcDraft(p[0], p[1], p[2], radiusX, radiusY, rotation);

  center = { x: 200, y: 100 };
  p = [controlPoint(1), center, controlPoint(deltaT / 3000)];
  arcDraft(p[0], p[1], p[2], radiusX, radiusY, rotation);

  center = { x: 300, y: 100 };
  p = [controlPoint(3 / 2), center, controlPoint(deltaT / 3000)];
  arcDraft(p[0], p[1], p[2], radiusX, radiusY, rotation);


  center = { x: 100, y: 200 };
  p = [controlPoint(deltaT / 3000), center, controlPoint(5 / 4)];
  arcDraft(p[0], p[1], p[2], radiusX, radiusY, rotation);

  center = { x: 200, y: 200 };
  p = [controlPoint(deltaT / 3000), center, controlPoint(1)];
  arcDraft(p[0], p[1], p[2], radiusX, radiusY, rotation);

  center = { x: 300, y: 200 };
  p = [controlPoint(deltaT / 3000), center, controlPoint(3 / 2)];
  arcDraft(p[0], p[1], p[2], radiusX, radiusY, rotation);

  center = { x: 100, y: 300 };
  p = [controlPoint(5 / 4), controlPoint(deltaT / 3000), controlPoint(0)];
  arcDraft(p[0], p[1], p[2], radiusX, radiusY, rotation);

  center = { x: 200, y: 300 };
  p = [controlPoint(1), controlPoint(deltaT / 3000), controlPoint(0)];
  arcDraft(p[0], p[1], p[2], radiusX, radiusY, rotation);

  center = { x: 300, y: 300 };
  p = [controlPoint(3 / 2), controlPoint(deltaT / 3000), controlPoint(0)];
  arcDraft(p[0], p[1], p[2], radiusX, radiusY, rotation);

  // ctx.restore();
}

eu.animate(paint);

eu.handleTermination();

eu.waitForInput();
