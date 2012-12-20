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

  this.vgSwapBuffers = function () {
    vg.egl.swapBuffers(vg.screen.surface);
  };

  // Conform to node-canvas API
  this.toBuffer = function () {
    var imageData = context2d.getImageData(0, 0, width, height);
    var buffer = image.saveToBuffer(imageData);
    return buffer;
  };
};

// Conform to node-canvas API
Canvas.Image = image.Image;

Canvas.Path = Path;
Canvas.SVGMatrix = m.SVGMatrix;
Canvas.DrawingStyle = DrawingStyle;

// Based on http://paulirish.com/2011/requestanimationframe-for-smart-animating/
(function () {
  var lastTime = 0;

  if (!global.requestAnimationFrame)
    global.requestAnimationFrame = function (callback) {
      var currTime = new Date().getTime();
      var timeToCall = Math.max(0, 16 - (currTime - lastTime));
      var id = setTimeout(function () {
          callback(currTime + timeToCall);
          vg.egl.swapBuffers(vg.screen.display, vg.screen.surface);
        },
        timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };

  if (!global.cancelAnimationFrame)
    global.cancelAnimationFrame = function (id) {
      clearTimeout(id);
    };
}());
