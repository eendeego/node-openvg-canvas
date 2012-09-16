var image = module.exports;
var FreeImage=new require('node-image').Image

var util = require('util');

var vg = require('openvg');

var m = require('./matrix');

function loadImage(buffer) {
  var result = {
    width: null,
    height: null,
    vgHandle: null
  };

  var freeImage = FreeImage.loadFromMemory(buffer);
  freeImage = freeImage.convertTo32Bits();
  result.width = freeImage.width;
  result.height = freeImage.height;

  result.vgHandle =
    vg.createImage(vg.VGImageFormat.VG_sARGB_8888, result.width, result.height,
                   vg.VGImageQuality.VG_IMAGE_QUALITY_BETTER);

  vg.imageSubData(result.vgHandle, freeImage.buffer, result.width * 4,
                  vg.VGImageFormat.VG_sARGB_8888,
                  0, 0, result.width, result.height); // sx, sy, w, h

  return result;
};

var Image = image.Image = function() {
  var width, height, vgHandle;

  function setSource(data) {
    imgData = loadImage(data);
    width = imgData.width;
    height = imgData.height;
    vgHandle = imgData.vgHandle;
  }
  Object.defineProperty(this, 'src', { enumerable: false, set: setSource });

  function getWidth() {
    return width;
  }
  Object.defineProperty(this, 'width', { enumerable: true, get: getWidth });

  function getHeight() {
    return height;
  }
  Object.defineProperty(this, 'height', { enumerable: true, get: getHeight });

  function getHandle() {
    return vgHandle;
  }
  Object.defineProperty(this, 'vgHandle', { enumerable: false, get: getHandle });
};


var drawImage = image.drawImage = function(img, sx, sy, sw, sh, dx, dy, dw, dh) {
  var mm = m.new();

  vg.getMatrix(mm);

  vg.setI(vg.VGParamType.VG_MATRIX_MODE,
          vg.VGMatrixMode.VG_MATRIX_IMAGE_USER_TO_SURFACE);

  vg.loadMatrix(mm);
  vg.translate(dx, dy);
  vg.scale(dw / sw, dh / sh);

  vg.setI(vg.VGParamType.VG_IMAGE_MODE,
          vg.VGImageMode.VG_DRAW_IMAGE_NORMAL);

  if (sx === 0 && sy === 0 && sw === img.width && sh === img.height) {
    vg.drawImage(img.vgHandle);
  } else {
    var vgSubHandle =
      vg.createImage(vg.VGImageFormat.VG_sARGB_8888, sw, sh,
                     vg.VGImageQuality.VG_IMAGE_QUALITY_BETTER);

    vg.copyImage(vgSubHandle, 0, 0, img.vgHandle, sx, sy, sw, sh, true /* dither */);
    vg.drawImage(vgSubHandle);
    vg.destroyImage(vgSubHandle);
  }

  vg.loadMatrix(mm);
}
