/*jslint indent: 2, node: true */
"use strict";

var vg = require('openvg');
var context = require('./context.js');
var image = require('./image.js');
var Path = require('./path.js');
var DrawingStyle = require('./drawingStyle');
var m = require('./matrix.js');

var notImplemented = function () {
  return 'Not Implemented';
};

var Canvas = module.exports = function (width, height) {
  var self = this;

  vg.init();

  width  = vg.screen.width;
  height = vg.screen.height;

  var context2d;

  function getWidth() { return width; }
  Object.defineProperty(this, 'width', { enumerable: true, get: getWidth });

  function getHeight() { return height; }
  Object.defineProperty(this, 'height', { enumerable: true, get: getHeight });

  context2d = context.createCanvasRenderingContext2D(this);

  this.toDataURL = notImplemented;
  this.toDataURLHD = notImplemented;
  this.toBlob = notImplemented;
  this.toBlobHD = notImplemented;

  this.getContext = function (contextId, args) {
    if (contextId === '2d') {
      return context2d;
    } else {
      return null;
    }
  };

  // Conform to node-canvas API
  this.toBuffer = function () {
    return image.saveToBuffer(context2d.getImageData(0, 0, width, height));
  };
};

// Conform to node-canvas API
Canvas.Image = image.Image;

Canvas.Path = Path;
Canvas.SVGMatrix = m.SVGMatrix;
Canvas.DrawingStyle = DrawingStyle;

Canvas.vgSwapBuffers = function () {
  vg.egl.swapBuffers(vg.screen.surface);
};

// Based on http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// No need for iife, module scope is already isolated
if (!global.requestAnimationFrame) {
  var lastTime = 0;

  global.requestAnimationFrame = function (callback) {
    var currTime = Date.now();
    var timeToCall = Math.max(0, 16 - (currTime - lastTime));
    var id = setTimeout(function () {
        callback(currTime + timeToCall);
        Canvas.vgSwapBuffers();
      },
      timeToCall);
    lastTime = currTime + timeToCall;
    return id;
  };

  global.cancelAnimationFrame = function (id) {
    clearTimeout(id);
  };
}
