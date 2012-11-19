/*jslint indent: 2, node: true */
/*global Float32Array: true */
"use strict";

var text = require('./text/text');

// interface CanvasDrawingStyles / DrawingStyle
var DrawingStyle = module.exports = function () {
  // line caps/joins
  this.lineWidth = 1;
  this.lineCap = 'butt';
  this.lineJoin = 'miter';
  this.miterLimit = 10;

  // dashed lines
  this.lineDashSegments = new Float32Array(100); // TODO: 100 ? why 100 ?
  this.lineDashOffset = 0.0;

  // text
  this.font_ = undefined;
  this.fontInfo_ = undefined;
  this.textAlign = 'start';
  this.textBaseline = 'alphabetic';
  this.direction = 'ltr'; // Should be 'inherit', but we are not on an HTML page.

  this.font = '10px sans-serif';
};

DrawingStyle.prototype.setLineDash = function (segments) {
  this.lineDashSegments.set(segments, 0);
};

DrawingStyle.prototype.getLineDash = function () {
  return this.lineDashSegments;
};

function getFont() {
  return this.font_;
}

function setFont(font) {
  var fontInfo = text.parseFont(font);
  if (fontInfo) {
    this.font_ = text.serialize(fontInfo);
    this.fontInfo_ = fontInfo;
  }
}

Object.defineProperty(DrawingStyle.prototype, 'font', { get: getFont, set: setFont });
