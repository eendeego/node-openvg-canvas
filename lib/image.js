/*jslint indent: 2, node: true */
/*global Image: true */
"use strict";

var image = module.exports;
var FreeImage = new require('node-image').Image;

var util = require('util');

var vg = require('openvg');

var m = require('./matrix');

function loadImage(freeImage) {
  var result = {
    width: null,
    height: null,
    vgHandle: null
  };

  if (freeImage.bpp !== 32) {
    freeImage = freeImage.convertTo32Bits();
  }
  var width = result.width = freeImage.width;
  var height = result.height = freeImage.height;

  result.vgHandle =
    vg.createImage(vg.VGImageFormat.VG_sARGB_8888, width, height,
                   vg.VGImageQuality.VG_IMAGE_QUALITY_BETTER);

  // Flip the image
  var buffer = freeImage.buffer.slice((height - 1) * (width * 4),
                                      height * (width * 4));
  vg.imageSubData(result.vgHandle, buffer, - width * 4,
                  vg.VGImageFormat.VG_sARGB_8888,
                  0, 0, width, height); // sx, sy, w, h

  return result;
}

function loadImageFromBuffer(buffer) {
  return loadImage(FreeImage.loadFromMemory(buffer));
}

var Image = image.Image = function () {
  var self = this;
  this.width_ = 0;
  this.height_ = 0;
  this.vgHandle_ = undefined;
  this.complete_ = false;
  this.destroyed_ = false;

  function setSource(data) {
    var imgData = loadImageFromBuffer(data);
    self.width_ = imgData.width;
    self.height_ = imgData.height;
    self.vgHandle_ = imgData.vgHandle;
    self.complete_ = true;
  }
  Object.defineProperty(this, 'src', { enumerable: false, set: setSource });

  function getWidth() { return self.width_; }
  Object.defineProperty(this, 'width', { enumerable: true, get: getWidth });

  function getHeight() { return self.height_; }
  Object.defineProperty(this, 'height', { enumerable: true, get: getHeight });

  function getHandle() { return self.vgHandle_; }
  Object.defineProperty(this, 'vgHandle', { enumerable: false, get: getHandle });

  function getComplete() { return self.complete_; }
  Object.defineProperty(this, 'complete', { enumerable: false, get: getComplete });

  // For now, images must be destroyed manually
  function getVgDestroyed() { return self.destroyed_; }
  Object.defineProperty(this, 'vgDestroyed', { enumerable: true, get: getVgDestroyed });

  this.vgDestroy = function () {
    self.destroyed_ = true;
    if (self.complete_) {
      vg.destroyImage(self.vgHandle_);
    }
  };
};

var drawImage = image.drawImage =
  function (img, sx, sy, sw, sh, dx, dy, dw, dh, paintFn) {

  if (!img.complete) return; // Don't even bother

  var mm = m.create();

  vg.getMatrix(mm);

  var savMatrixMode = vg.getI(vg.VGParamType.VG_MATRIX_MODE);
  vg.setI(vg.VGParamType.VG_MATRIX_MODE,
          vg.VGMatrixMode.VG_MATRIX_IMAGE_USER_TO_SURFACE);

  vg.loadMatrix(mm);
  vg.translate(dx, dy);
  vg.scale(dw / sw, dh / sh);

  vg.setI(vg.VGParamType.VG_IMAGE_MODE,
          vg.VGImageMode.VG_DRAW_IMAGE_NORMAL);

  if (sx === 0 && sy === 0 && sw === img.width && sh === img.height) {
    // vg.drawImage(img.vgHandle);
    paintFn(img.vgHandle);
  } else {
    var vgSubHandle =
      vg.createImage(vg.VGImageFormat.VG_sARGB_8888, sw, sh,
                     vg.VGImageQuality.VG_IMAGE_QUALITY_BETTER);

    vg.copyImage(vgSubHandle, 0, 0, img.vgHandle, sx, sy, sw, sh, true /* dither */);
    // vg.drawImage(vgSubHandle);
    paintFn(vgSubHandle);
    vg.destroyImage(vgSubHandle);
  }

  vg.setI(vg.VGParamType.VG_MATRIX_MODE, savMatrixMode);
  vg.loadMatrix(mm);
};

var ImageData = image.ImageData = function (w, h, d) {
  var width = w, height = h, data = d;

  function getWidth() {
    return width;
  }
  Object.defineProperty(this, 'width', { enumerable: true, get: getWidth });

  function getHeight() {
    return height;
  }
  Object.defineProperty(this, 'height', { enumerable: true, get: getHeight });

  function getData() {
    if (data === undefined) {
      data = new Uint32Array(w * h);
      for (var i = 0; i < h * w; i++) { data[i] = 0x00; }
      data = new Uint8Array(data);
    }

    return data;
  }
  Object.defineProperty(this, 'data', { enumerable: false, get: getData });
};

var createImageDataWH = image.createImageDataWH = function (w, h) {
  return new ImageData(w, h);
};

var createImageDataImg = image.createImageDataImg = function (img) {
  return createImageDataImg(img.width, img.height);
};

// Image format is RBGA, as specified in:
// http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#dom-imagedata-data
var getImageData = image.getImageData = function (sx, sy, sw, sh) {
  sy = vg.screen.height - sy - sh;
  var data = new Uint8Array(sw * sh * 4);

  vg.readPixels(data, sw * 4,
                vg.VGImageFormat.VG_sRGBA_8888,
                sx, sy, sw, sh);

  var result = new ImageData(sw, sh, data);

  return result;
};

function writePixels(imagedata, dx, dy) {
  vg.writePixels(imagedata.data, imagedata.width * 4,
                 vg.VGImageFormat.VG_sRGBA_8888,
                 dx, dy, imagedata.width, imagedata.height);
}

function withScissoring(dirtyX, dirtyY, dirtyWidth, dirtyHeight, callback) {
  var saveScissoring = vg.getI(vg.VGParamType.VG_SCISSORING);
  vg.setI(vg.VGParamType.VG_SCISSORING, 1 /* true */);

  vg.setIV(vg.VGParamType.VG_SCISSOR_RECTS,
           new Uint32Array([dirtyX, dirtyY, dirtyWidth, dirtyHeight]));

  callback();

  vg.setI(vg.VGParamType.VG_SCISSORING, saveScissoring);
}

var putImageData = image.putImageData = function (imagedata, dx, dy,
                                                  dirtyX, dirtyY, dirtyWidth, dirtyHeight) {
  var data = imagedata.data;

  dy = vg.screen.height - dy - imagedata.height;

  if (dirtyX) {
    dirtyY = vg.screen.height - dirtyY - dirtyHeight;
    withScissoring(dirtyX, dirtyY, dirtyWidth, dirtyHeight, function () {
      writePixels(imagedata, dx, dy);
    });
  } else {
    writePixels(imagedata, dx, dy);
  }
};

var saveToBuffer = image.saveToBuffer = function (imagedata) {
  var imageSrcBuffer = new Buffer(imagedata.data.length);

  // TODO make this code native
  var v32bit = new Uint32Array(imagedata.data);
  var imgSrc = new Uint32Array(imageSrcBuffer);

  for (var i = 0; i < v32bit.length; i++) {
    imgSrc[i] = (v32bit[i] & 0xffffff00) >>> 8 |
                (v32bit[i] & 0x000000ff) << 24;
  }

  var freeImage =
    FreeImage.convertFromRawBits(imageSrcBuffer, imagedata.width, imagedata.height);

  var imageBuffer = freeImage.saveToMemory(FreeImage.FIF_PNG, FreeImage.PNG_IGNOREGAMMA);

  return imageBuffer;
};

function logBuffer(label, buffer) {
  if (buffer === undefined) {
    buffer = label;
    label = 'buffer';
  }

  if (buffer === undefined) {
    console.log(label + ': <undefined>');
    return;
  }

  if (buffer === null) {
    console.log(label + ': <null>');
    return;
  }

  console.log(label + ': ' + buffer[0].toString(16) + ', ' + buffer[1].toString(16) + ', ' +
              buffer[2].toString(16) + ', ' + buffer[3].toString(16));
}
