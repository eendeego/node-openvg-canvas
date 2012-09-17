var image = module.exports;
var FreeImage=new require('node-image').Image

var util = require('util');

var vg = require('openvg');

var m = require('./matrix');

function loadImage(freeImage) {
  var result = {
    width: null,
    height: null,
    vgHandle: null
  };

  if(freeImage.bpp !== 32) {
    freeImage = freeImage.convertTo32Bits();
  }
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

function loadImageFromBuffer(buffer) {
  return loadImage(FreeImage.loadFromMemory(buffer));
}

var Image = image.Image = function() {
  var width, height, vgHandle;

  function setSource(data) {
    imgData = loadImageFromBuffer(data);
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

  var savMatrixMode = vg.getI(vg.VGParamType.VG_MATRIX_MODE);
  vg.setI(vg.VGParamType.VG_MATRIX_MODE,
          vg.VGMatrixMode.VG_MATRIX_IMAGE_USER_TO_SURFACE);

  vg.loadMatrix(mm);
  vg.translate(dx, dy + dh);
  vg.scale(dw / sw, -dh / sh);

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

  vg.setI(vg.VGParamType.VG_MATRIX_MODE, savMatrixMode);
  vg.loadMatrix(mm);
}

var ImageData = image.ImageData = function(w, h, d) {
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
      for(var i=0; i<h*w; i++) { data[i] = 0x00; }
      data = new Uint8Array(data);
    }

    return data;
  }
  Object.defineProperty(this, 'data', { enumerable: false, get: getData });
};

var createImageDataWH = image.createImageDataWH = function(w, h) {
  return new ImageData(w, h);
};

var createImageDataImg = image.createImageDataImg = function(img) {
  return createImageDataImg(img.width, img.height);
};

// Image format is RBGA, as specified in:
// http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#dom-imagedata-data
var getImageData = image.getImageData = function(sx, sy, sw, sh) {
  sy = vg.screen.height-sy-sh;
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
                 dx, dy, imagedata.width, imagedata.height)
}

function withScissoring(dirtyX, dirtyY, dirtyWidth, dirtyHeight, callback) {
  var saveScissoring = vg.getI(vg.VGParamType.VG_SCISSORING);
  vg.setI(vg.VGParamType.VG_SCISSORING, 1 /* true */);

  vg.setIV(vg.VGParamType.VG_SCISSOR_RECTS,
           new Uint32Array([dirtyX, dirtyY, dirtyWidth, dirtyHeight]));

  callback();

  vg.setI(vg.VGParamType.VG_SCISSORING, saveScissoring);
}

var putImageData = image.putImageData = function(imagedata, dx, dy,
                                                 dirtyX, dirtyY, dirtyWidth, dirtyHeight) {
  var data = imagedata.data;

  dy = vg.screen.height-dy-imagedata.height;

  if (dirtyX) {
    dirtyY = vg.screen.height-dirtyY-dirtyHeight;
    withScissoring(dirtyX, dirtyY, dirtyWidth, dirtyHeight, function() {
      writePixels(imagedata, dx, dy);
    });
  } else {
    writePixels(imagedata, dx, dy);
  }
};

var saveToBuffer = image.saveToBuffer = function(imagedata) {
  var imageSrcBuffer = new Buffer(imagedata.data.length);

  for(var i=0; i<imagedata.width*imagedata.height*4; i+=4) {
    imageSrcBuffer[i  ] = imagedata.data[i+1];
    imageSrcBuffer[i+1] = imagedata.data[i+2];
    imageSrcBuffer[i+2] = imagedata.data[i+3];
    imageSrcBuffer[i+3] = imagedata.data[i  ];
  }

  var freeImage =
    FreeImage.convertFromRawBits(imageSrcBuffer, imagedata.width, imagedata.height);

  var imageBuffer = freeImage.saveToMemory(FreeImage.FIF_PNG, FreeImage.PNG_IGNOREGAMMA);

  return imageBuffer;
};

function logBuffer(label, buffer) {
  if(buffer === undefined) {
    buffer = label;
    label = 'buffer';
  }

  if(buffer === undefined) {
    console.log(label + ': <undefined>');
    return;
  }

  if(buffer === null) {
    console.log(label + ': <null>');
    return;
  }

  console.log(label + ': ' + buffer[0].toString(16) + ', ' + buffer[1].toString(16) + ', ' +
              buffer[2].toString(16) + ', ' + buffer[3].toString(16));
}
