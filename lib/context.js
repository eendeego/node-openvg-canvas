/*jslint indent: 2, node: true */
"use strict";

var util = require('util');

var vg = require('openvg');
var text = require('./text/text');
var Gradient = require('./gradient');
var Pattern = require('./pattern');
var textLoading = require('./text/loading');
var textRendering = require('./text/rendering');
var color = require('./color');
var image = require('./image');
var Path = require('./path');
var m = require('./matrix');

var compositeOperation2vg = {
  'source-atop'     : vg.VGBlendMode.VG_BLEND_SRC,
  'source-in'       : vg.VGBlendMode.VG_BLEND_SRC_IN,
  'source-out'      : vg.VGBlendMode.VG_BLEND_SRC, // Not implemented ?
  'source-over'     : vg.VGBlendMode.VG_BLEND_SRC_OVER,
  'destination-atop': vg.VGBlendMode.VG_BLEND_DST_IN, // Not implemented ?
  'destination-in'  : vg.VGBlendMode.VG_BLEND_DST_IN,
  'destination-out' : vg.VGBlendMode.VG_BLEND_DST_IN, // Not implemented ?
  'destination-over': vg.VGBlendMode.VG_BLEND_DST_OVER,
  'lighter'         : vg.VGBlendMode.VG_BLEND_LIGHTEN,
  'copy'            : vg.VGBlendMode.VG_BLEND_SRC, // Not implemented ?
  'xor'             : vg.VGBlendMode.VG_BLEND_SRC, // Not implemented ?

  'openVG-multiply' : vg.VGBlendMode.VG_BLEND_MULTIPLY,
  'openVG-screen'   : vg.VGBlendMode.VG_BLEND_SCREEN,
  'openVG-darker'   : vg.VGBlendMode.VG_BLEND_DARKEN,
  'openVG-additive' : vg.VGBlendMode.VG_BLEND_ADDITIVE
};

var lineCap2vg = {
  'butt'   : vg.VGCapStyle.VG_CAP_BUTT,
  'round'  : vg.VGCapStyle.VG_CAP_ROUND,
  'square' : vg.VGCapStyle.VG_CAP_SQUARE
};

var lineJoin2vg = {
  'round' : vg.VGJoinStyle.VG_JOIN_ROUND,
  'bevel' : vg.VGJoinStyle.VG_JOIN_BEVEL,
  'miter' : vg.VGJoinStyle.VG_JOIN_MITER
};

function newPath() {
  return vg.createPath(vg.VG_PATH_FORMAT_STANDARD,
                       vg.VGPathDatatype.VG_PATH_DATATYPE_F,
                       1.0, 0.0, 0, 0,
                       vg.VGPathCapabilities.VG_PATH_CAPABILITY_ALL);
}

module.exports.createCanvasRenderingContext2D = function (canvas) {
  // Context information
  var width  = canvas.width;
  var height = canvas.height;

  // OpenVG origin is at bottom left, not top right
  var baseTransform = m.m(1.0,    0.0, 0.0,
                          0.0,   -1.0, 0.0,
                          0.0, height, 1.0);
  var transformScratch = m.create();

  // Internal/Native data
  var fillPaint = vg.createPaint();
  var strokePaint = vg.createPaint();

  var fillGradient = null;
  var fillPattern = null;
  var fillColor = new Float32Array([0, 0, 0, 1]);
  var applyFillStyle = fillStyleSolid;
  var fillStyleApplied = false;
  var strokeGradient = null;
  var strokePattern = null;
  var strokeColor = new Float32Array([0, 0, 0, 1]);
  var applyStrokeStyle = strokeStyleSolid;
  var strokeStyleApplied = false;

  // fill/stroke color after applying globalAlpha
  var effectiveColor = new Float32Array(4);

  var immediatePath = newPath();

  var currentPath = new Path();

  var clippingEnabled;

  var currentFont;

  var drawingStateStack = [];

  // Canvas/Exposed data

  // compositing
  var globalAlpha;
  var globalCompositeOperation;
  var blendMode; // Not returned by OpenVG (bug?)

  // image smoothing
  var imageSmoothingEnabled;

  // colors and styles (see also the CanvasDrawingStyles interface)
  var strokeStyle;
  var fillStyle;

  // shadows
  var shadowOffsetX = 0, shadowOffsetY = 0;
  var shadowBlur = 0;
  var shadowColor = new Float32Array([0, 0, 0, 0]);
  var serializedShadowColor = 'rgba(0,0,0,0)';
  var shadowsEnabled = false;
  var shadowSurface = null;
  var shadowSrcImage = null;
  var shadowDstImage = null;
  var shadowPaint = null;
  var shadowTransform = m.create();
  var shadowContext = null;

  // interface CanvasDrawingStyles
  // TODO Implement this as a composite over DrawingStyle or similar
  // line caps/joins
  var lineWidth;
  var lineCap;
  var lineJoin;
  var miterLimit;

  var LINE_DASH_INITIAL_SIZE = 100;
  var LINE_DASH_EXCESS_FACTOR = 2;

  // dashed lines
  var lineDashPattern = new Float32Array(LINE_DASH_INITIAL_SIZE);
  var lineDashOffset = 0.0;
  var dashList;

  // text
  var font;
  var textAlign;
  var textBaseline;
  var direction;

  // Context object
  var result = {};

  // Methods
  // back-reference to the canvas
  function getCanvas() { return canvas; }
  Object.defineProperty(result, 'canvas', { get: getCanvas });

  // state
  result.save = function () {
    var current = {
      matrix: m.create(),
      clippingEnabled: undefined,
      mask: undefined,
      strokeStyle: strokeStyle,
      fillStyle: fillStyle,
      globalAlpha: globalAlpha,
      imageSmoothingEnabled: imageSmoothingEnabled,
      lineWidth: lineWidth,
      lineCap: lineCap,
      lineJoin: lineJoin,
      miterLimit: miterLimit,
      lineDashOffset: lineDashOffset,
      dashList: dashList,
      shadowOffsetX: shadowOffsetX,
      shadowOffsetY: shadowOffsetY,
      shadowBlur: shadowBlur,
      serializedShadowColor:
        serializedShadowColor || color.serialize(shadowColor),
      globalCompositeOperation: globalCompositeOperation,
      font: font,
      textAlign: textAlign,
      textBaseline: textBaseline
    };

    vg.getMatrix(current.matrix);
    saveClippingRegion(current);

    drawingStateStack.push(current);
  };

  result.restore = function () {
    var current = drawingStateStack.pop();

    restoreClippingRegion(current);

    vg.loadMatrix(current.matrix);
    result.strokeStyle = current.strokeStyle;
    result.fillStyle = current.fillStyle;
    result.globalAlpha = current.globalAlpha;
    result.imageSmoothingEnabled = current.imageSmoothingEnabled;
    result.lineWidth = current.lineWidth;
    result.lineCap = current.lineCap;
    result.lineJoin = current.lineJoin;
    result.miterLimit = current.miterLimit;

    internalSetLineDash(current);
    result.lineDashOffset = current.lineDashOffset;

    shadowOffsetX = current.shadowOffsetX;
    shadowOffsetY = current.shadowOffsetY;
    shadowBlur = current.shadowBlur;
    result.shadowColor = current.serializedShadowColor;
    serializedShadowColor = current.serializedShadowColor;
    result.globalCompositeOperation = current.globalCompositeOperation;
    if (result.font !== current.font) {
      result.font = current.font;
    }
    result.textAlign = current.textAlign;
    result.textBaseline = current.textBaseline;
  };

  // transformations (default transform is the identity matrix)
  result.scale = function (x, y) {
    vg.scale(x, y);
  };

  result.rotate = function (angle) {
    vg.rotate(angle * 180 / Math.PI);
  };

  result.translate = function (x, y) {
    vg.translate(x, y);
  };

  result.transform = function (a, b, c, d, e, f) {
    transformScratch[0] = a;
    transformScratch[1] = b;
    transformScratch[2] = 0.0;
    transformScratch[3] = c;
    transformScratch[4] = d;
    transformScratch[5] = 0.0;
    transformScratch[6] = e;
    transformScratch[7] = f;
    transformScratch[8] = 1.0;

    vg.multMatrix(transformScratch);
  };

  result.setTransform = function (a, b, c, d, e, f) {
    transformScratch[0] = a;
    transformScratch[1] = -b;
    transformScratch[2] = 0.0;
    transformScratch[3] = c;
    transformScratch[4] = -d;
    transformScratch[5] = 0.0;
    transformScratch[6] = e;
    transformScratch[7] = height - f;
    transformScratch[8] = 1.0;

    vg.loadMatrix(transformScratch);
  };

  result.resetTransform = function () {
    vg.loadIdentity();
    vg.multMatrix(baseTransform);
  };

  // compositing
  function getGlobalAlpha() { return globalAlpha; }
  function setGlobalAlpha(newGlobalAlpha) {
    if (0 <= newGlobalAlpha && newGlobalAlpha <= 1.0) {
      globalAlpha = newGlobalAlpha;
    }
  }
  Object.defineProperty(result, 'globalAlpha', { get: getGlobalAlpha, set: setGlobalAlpha });

  function getGlobalCompositeOperation() { return globalCompositeOperation; }
  function setGlobalCompositeOperation(newGlobalCompositeOperation) {
    var vgBlendMode = compositeOperation2vg[newGlobalCompositeOperation];
    if (vgBlendMode) {
      globalCompositeOperation = newGlobalCompositeOperation;
      blendMode = vgBlendMode;
      vg.setI(vg.VGParamType.VG_BLEND_MODE, vgBlendMode);
    } // TODO else ? (@see spec)
    var saveBlendMode = vg.getI(vg.VGParamType.VG_BLEND_MODE);
  }
  Object.defineProperty(result, 'globalCompositeOperation', { get: getGlobalCompositeOperation, set: setGlobalCompositeOperation });

  // image smoothing
  function getImageSmoothingEnabled() { return imageSmoothingEnabled; }
  function setImageSmoothingEnabled(newImageSmoothingEnabled) {
    imageSmoothingEnabled = newImageSmoothingEnabled;
    vg.setI(vg.VGParamType.VG_RENDERING_QUALITY,
            newImageSmoothingEnabled ?
            vg.VGRenderingQuality.VG_RENDERING_QUALITY_BETTER :
            vg.VGRenderingQuality.VG_RENDERING_QUALITY_FASTER);
  }
  Object.defineProperty(result, 'imageSmoothingEnabled', { get: getImageSmoothingEnabled, set: setImageSmoothingEnabled });

  function applyGradient(paint, gradient, paintMode) {
    gradient.configurePaint(paint, globalAlpha);

    vg.setPaint(paint, paintMode);
  }

  function applyPattern(paint, pattern, paintMode) {
    vg.setParameterI(paint,
                     vg.VGPaintParamType.VG_PAINT_TYPE,
                     vg.VGPaintType.VG_PAINT_TYPE_PATTERN);
    vg.setParameterI(paint,
                     vg.VGPaintParamType.VG_PAINT_PATTERN_TILING_MODE,
                     pattern.tilingMode);
    vg.paintPattern(paint, pattern.image.vgHandle);
    vg.setPaint(paint, paintMode);
  }

  function strokeStyleSolid() {
    color.applyAlpha(effectiveColor, strokeColor, globalAlpha);

    vg.setParameterI(strokePaint, vg.VGPaintParamType.VG_PAINT_TYPE,
                                  vg.VGPaintType.VG_PAINT_TYPE_COLOR);
    vg.setParameterFV(strokePaint, vg.VGPaintParamType.VG_PAINT_COLOR,
                                   effectiveColor);
    vg.setPaint(strokePaint, vg.VGPaintMode.VG_STROKE_PATH);
  }

  function strokeStyleGradient() {
    applyGradient(strokePaint,
                  strokeGradient,
                  vg.VGPaintMode.VG_STROKE_PATH);
  }

  function strokeStylePattern() {
    applyPattern(strokePaint,
                 strokePattern,
                 vg.VGPaintMode.VG_STROKE_PATH);
  }

  function applyStrokeStyleWithReset() {
    if (!strokeStyleApplied) {
      applyStrokeStyle();
      strokeStyleApplied = true;
    }
  }

  // colors and styles (see also the CanvasDrawingStyles interface)
  function getStrokeStyle() { return strokeStyle; }
  function setStrokeStyle(newStrokeStyle) {
    strokeStyle = newStrokeStyle; // TODO Set only if valid

    if ('string' === typeof newStrokeStyle) {
      color.parseColor(strokeColor, newStrokeStyle);
      applyStrokeStyle = strokeStyleSolid;
    } else if (newStrokeStyle instanceof Gradient) {
      strokeGradient = newStrokeStyle;
      applyStrokeStyle = strokeStyleGradient;
    } else if (newStrokeStyle instanceof Pattern) {
      strokePattern = newStrokeStyle;
      applyStrokeStyle = strokeStylePattern;
    }
    strokeStyleApplied = false;
  }
  Object.defineProperty(result, 'strokeStyle',
                        { get: getStrokeStyle, set: setStrokeStyle });

  function fillStyleSolid() {
    color.applyAlpha(effectiveColor, fillColor, globalAlpha);

    vg.setParameterI(fillPaint, vg.VGPaintParamType.VG_PAINT_TYPE,
                                vg.VGPaintType.VG_PAINT_TYPE_COLOR);
    vg.setParameterFV(fillPaint, vg.VGPaintParamType.VG_PAINT_COLOR,
                                 effectiveColor);
    vg.setPaint(fillPaint, vg.VGPaintMode.VG_FILL_PATH);
  }

  function fillStyleGradient() {
    applyGradient(fillPaint,
                  fillGradient,
                  vg.VGPaintMode.VG_FILL_PATH);
  }

  function fillStylePattern() {
    applyPattern(fillPaint,
                 fillPattern,
                 vg.VGPaintMode.VG_FILL_PATH);
  }

  function applyFillStyleWithReset() {
    if (!fillStyleApplied) {
      applyFillStyle();
      fillStyleApplied = true;
    }
  }

  function getFillStyle() { return fillStyle; }
  function setFillStyle(newFillStyle) {
    fillStyle = newFillStyle; // TODO Set only if valid

    if ('string' === typeof newFillStyle) {
      color.parseColor(fillColor, newFillStyle);
      applyFillStyle = fillStyleSolid;
    } else if (newFillStyle instanceof Gradient) {
      fillGradient = newFillStyle;
      applyFillStyle = fillStyleGradient;
    } else if (newFillStyle instanceof Pattern) {
      fillPattern = newFillStyle;
      applyFillStyle = fillStylePattern;
    }
    fillStyleApplied = false;
  }
  Object.defineProperty(result, 'fillStyle',
                        { get: getFillStyle, set: setFillStyle });


  result.createLinearGradient = function (x0, y0, x1, y1) {
    return new Gradient('linearGradient', [x0, y0, x1, y1]);
  };

  result.createRadialGradient = function (x0, y0, r0, x1, y1, r1) {
    return new Gradient('radialGradient', [x0, y0, x1, y1, r1]);
  };

  result.createPattern = function (image, repetition) {
    return new Pattern(image, repetition);
  };


  // Shadows

  function getShadowOffsetX() { return shadowOffsetX; }
  function setShadowOffsetX(offset) {
    if (!isNaN(parseFloat(offset)) && isFinite(offset)) shadowOffsetX = offset;
  }
  Object.defineProperty(result, 'shadowOffsetX',
                        { get: getShadowOffsetX, set: setShadowOffsetX });

  function getShadowOffsetY() { return shadowOffsetY; }
  function setShadowOffsetY(offset) {
    if (!isNaN(parseFloat(offset)) && isFinite(offset)) shadowOffsetY = offset;
  }
  Object.defineProperty(result, 'shadowOffsetY',
                        { get: getShadowOffsetY, set: setShadowOffsetY });

  function getShadowBlur() { return shadowBlur; }
  function setShadowBlur(blur) {
    if (!isNaN(parseFloat(blur)) && isFinite(blur)) shadowBlur = blur;
  }
  Object.defineProperty(result, 'shadowBlur',
                        { get: getShadowBlur, set: setShadowBlur });

  function getShadowColor() {
    if (serializedShadowColor === null) {
      serializedShadowColor = color.serialize(shadowColor);
    }
    return serializedShadowColor;
  }
  function setShadowColor(newShadowColor) {
    color.parseColor(shadowColor, newShadowColor);
    serializedShadowColor = null;
  }
  Object.defineProperty(result, 'shadowColor',
                        { get: getShadowColor, set: setShadowColor });

  function checkShadowEffects() {
    // Only test for shadow alpha
    // See http://lists.whatwg.org/htdig.cgi/whatwg-whatwg.org/2011-May/031457.html
    shadowsEnabled = shadowColor[3] !== 0.0;
    if (shadowsEnabled && shadowSurface === null) {
      shadowSrcImage =
        vg.createImage(vg.VGImageFormat.VG_sARGB_8888,
                       width, height,
                       vg.VGImageQuality.VG_IMAGE_QUALITY_BETTER);
      shadowDstImage =
        vg.createImage(vg.VGImageFormat.VG_sARGB_8888,
                       width, height,
                       vg.VGImageQuality.VG_IMAGE_QUALITY_BETTER);

      shadowContext = vg.egl.createContext(vg.screen.context);
      shadowSurface = vg.egl.createPbufferFromClientBuffer(shadowSrcImage);

      shadowPaint = vg.createPaint();
    }

    return shadowsEnabled;
  }

  // rects
  result.clearRect = function (x, y, w, h) {
    // TODO: Implement clipping region (Per Section 4.8.11.2.11)
    vg.clear(x, height - y - h, w, h);
  };

  result.fillRect = function (x, y, w, h) {
    function paintRect() {
      applyFillStyleWithReset();
      vg.drawPath(immediatePath, vg.VGPaintMode.VG_FILL_PATH);
    }

    vg.clearPath(immediatePath, vg.VGPathCapabilities.VG_PATH_CAPABILITY_ALL);
    vg.vgu.rect(immediatePath, x, y, w, h);

    if (checkShadowEffects()) {
      dropShadow(paintRect);
      fillStyleApplied = false;
    }
    paintRect();
  };

  result.strokeRect = function (x, y, w, h) {
    function paint() {
      applyStrokeStyleWithReset();
      vg.drawPath(immediatePath, vg.VGPaintMode.VG_STROKE_PATH);
    }

    vg.clearPath(immediatePath, vg.VGPathCapabilities.VG_PATH_CAPABILITY_ALL);
    vg.vgu.rect(immediatePath, x, y, w, h);
    if (checkShadowEffects()) {
      dropShadow(paint);
      strokeStyleApplied = false;
    }
    paint();
  };


  // path API (see also CanvasPathMethods)
  // result.beginPath = Path.prototype.beginPath.bind(currentPath);
  result.beginPath = function () {
    currentPath.beginPath();
  };

  function dropShadow(paintFn) {
    var success;

    var saveBlendMode = vg.getI(vg.VGParamType.VG_BLEND_MODE);

    vg.getMatrix(shadowTransform);

    success = vg.egl.makeCurrent(shadowSurface, shadowContext);

    vg.loadMatrix(shadowTransform);

    vg.clear(0, 0, width, height);

    vg.translate(shadowOffsetX, shadowOffsetY);
    paintFn();
    vg.translate(-shadowOffsetX, -shadowOffsetY);

    vg.setI(vg.VGParamType.VG_BLEND_MODE, vg.VGBlendMode.VG_BLEND_SRC_IN);
    vg.setParameterI(shadowPaint, vg.VGPaintParamType.VG_PAINT_TYPE,
                                  vg.VGPaintType.VG_PAINT_TYPE_COLOR);
    vg.setParameterFV(shadowPaint, vg.VGPaintParamType.VG_PAINT_COLOR,
                                   shadowColor);
    vg.setPaint(shadowPaint, vg.VGPaintMode.VG_FILL_PATH);

    vg.getMatrix(shadowTransform);
    vg.loadIdentity();


    var vgPath = vg.createPath(vg.VG_PATH_FORMAT_STANDARD,
                               vg.VGPathDatatype.VG_PATH_DATATYPE_F,
                               1.0 /* scale */ , 0.0 /* bias */,
                               5 /* segCapacityHint */,
                               5 /* coordCapacityHint */,
                               vg.VGPathCapabilities.VG_PATH_CAPABILITY_APPEND_TO);

    vg.vgu.rect(vgPath, 0, 0, width, height);
    vg.drawPath(vgPath, vg.VGPaintMode.VG_FILL_PATH);
    vg.destroyPath(vgPath);

    vg.loadMatrix(shadowTransform);

    vg.setI(vg.VGParamType.VG_BLEND_MODE, vg.VGBlendMode.VG_BLEND_SRC_OVER);

    if (shadowBlur !== 0) {
      var sigma = shadowBlur / 2;
      vg.gaussianBlur(shadowDstImage, shadowSrcImage,
                      sigma, sigma,
                      vg.VGTilingMode.VG_TILE_PAD);
    }

    success = vg.egl.makeCurrent(vg.screen.surface, vg.screen.context);

    vg.setI(vg.VGParamType.VG_BLEND_MODE, vg.VGBlendMode.VG_BLEND_SRC_OVER);

    vg.getMatrix(shadowTransform);
    vg.loadIdentity();
    vg.drawImage(shadowBlur !== 0 ? shadowDstImage : shadowSrcImage);
    vg.loadMatrix(shadowTransform);

    vg.setI(vg.VGParamType.VG_BLEND_MODE, saveBlendMode);
  }

  result.fill = function (path) {
    if (path === undefined) path = currentPath;

    function fillPath() {
      applyFillStyleWithReset();
      path.fill();
    }

    if (checkShadowEffects()) {
      dropShadow(fillPath);
      fillStyleApplied = false;
    }
    fillPath();
  };

  result.stroke = function (path) {
    if (path === undefined) path = currentPath;

    function strokePath() {
      applyStrokeStyleWithReset();
      path.stroke();
    }

    if (checkShadowEffects()) {
      dropShadow(strokePath);
      strokeStyleApplied = false;
    }
    strokePath();
  };

  result.drawSystemFocusRing = function (path, element) {
    if (element === undefined) {
      element = path;
      path = currentPath;
    }
    return null;
  };

  result.drawCustomFocusRing = function (path, element) {
    if (element === undefined) {
      element = path;
      path = currentPath;
    }
    return null;
  };

  result.scrollPathIntoView = function (path) {
    if (path === undefined) { path = currentPath; }
    return null;
  };

  result.clip = function (path) {
    if (path === undefined) { path = currentPath; }

    path.renderPath();

    if (!clippingEnabled) {
      vg.mask(0, // TODO Declare VG_INVALID_HANDLE on node-openvg
              vg.VGMaskOperation.VG_FILL_MASK,
              0, 0, width, height);
    }

    vg.renderToMask(path.vgPath,
                    vg.VGPaintMode.VG_FILL_PATH,
                    vg.VGMaskOperation.VG_INTERSECT_MASK);

    vg.setI(vg.VGParamType.VG_MASKING, 1 /* true */);

    clippingEnabled = true;
  };

  result.resetClip = function () {
    vg.setI(vg.VGParamType.VG_MASKING, 0 /* false */);

    clippingEnabled = false;
  };

  var initClippingRegion = function () {
    result.resetClip();
  };

  var saveClippingRegion = function (state) {
    if (clippingEnabled) {
      state.mask = vg.createMaskLayer(width, height);
      vg.copyMask(state.mask, 0, 0, 0, 0, width, height);
    }

    state.clippingEnabled = clippingEnabled;
  };

  var restoreClippingRegion = function (state) {
    if (state.clippingEnabled) {
      vg.mask(state.mask,
              vg.VGMaskOperation.VG_SET_MASK,
              0, 0, width, height);
      vg.destroyMaskLayer(state.mask);
    }

    if (state.clippingEnabled !== clippingEnabled) {
      vg.setI(vg.VGParamType.VG_MASKING,
              state.clippingEnabled ? 1 /* true */ : 0 /* false */);
    }

    clippingEnabled = state.clippingEnabled;
  };

  result.isPointInPath = function (path, x, y) {
    if (y === undefined) {
      y = x;
      x = path;
      path = currentPath;
    }

    return null;
  };

  // text (see also the CanvasDrawingStyles interface)
  result.fillText = function (text, x, y, maxWidth) {
    function paintWithShadow(textPath) {
      function paintText() {
        applyFillStyleWithReset();
        vg.drawPath(textPath, vg.VGPaintMode.VG_FILL_PATH);
      }

      if (checkShadowEffects()) {
        // Text is drawn with an inverted Y matrix
        shadowOffsetY = -shadowOffsetY;
        dropShadow(paintText);
        shadowOffsetY = -shadowOffsetY;
        fillStyleApplied = false;
      }
      paintText(textPath);
    }

    // TODO implement maxWidth
    textRendering.renderText(x, y, text,
                             currentFont.typeface,
                             currentFont.size,
                             paintWithShadow);
  };

  result.strokeText = function (text, x, y, maxWidth) {
    function paintWithShadow(textPath) {
      function paintText() {
        applyStrokeStyleWithReset();
        vg.drawPath(textPath, vg.VGPaintMode.VG_STROKE_PATH);
      }

      if (checkShadowEffects()) {
        // Text is drawn with an inverted Y matrix
        shadowOffsetY = -shadowOffsetY;
        dropShadow(paintText);
        shadowOffsetY = -shadowOffsetY;
        strokeStyleApplied = false;
      }
      paintText(textPath);
    }

    // TODO implement maxWidth
    textRendering.renderText(x, y, text,
                             currentFont.typeface,
                             currentFont.size,
                             paintWithShadow);
  };

  result.measureText = function (text) {
    return textRendering.measureText(text,
                                     currentFont.typeface,
                                     currentFont.size);
  };


  // drawing images
  result.drawImage = function (img, sx, sy, sw, sh, dx, dy, dw, dh) {
    if (sw === undefined) {
      // expect function(img, dx, dy)
      dh = img.height;
      dw = img.width;
      dy = sy;
      dx = sx;
      sy = 0;
      sx = 0;
      sh = img.height;
      sw = img.width;
    } else
    if (dx === undefined) {
      // expect function(img, dx, dy, dw, dh)
      dh = sh;
      dw = sw;
      dy = sy;
      dx = sx;
      sy = 0;
      sx = 0;
      sh = img.height;
      sw = img.width;
    }

    function paintImage(vgHandle) {
      function paint() {
        vg.drawImage(vgHandle);
      }

      function paintShadow() {
        var mm = m.create();
        vg.getMatrix(mm);
        vg.setI(vg.VGParamType.VG_MATRIX_MODE,
                vg.VGMatrixMode.VG_MATRIX_IMAGE_USER_TO_SURFACE);
        vg.loadMatrix(mm);
        paint();

        vg.setI(vg.VGParamType.VG_MATRIX_MODE,
                vg.VGMatrixMode.VG_MATRIX_PATH_USER_TO_SURFACE);
      }

      if (checkShadowEffects()) dropShadow(paintShadow);
      paint();
    }

    image.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh, paintImage);
  };


  // hit regions
  result.addHitRegion = function (options) {
    return null;
  };

  result.removeHitRegion = function (options) {
    return null;
  };


  // pixel manipulation
  result.createImageData = function (sw, sh) {
    if (sh === undefined) {
      // imagedata <= sw
      return image.createImageDataImg(sw);
    }
    return image.createImageDataWH(sw, sh);
  };

  result.createImageDataHD = image.createImageDataWH;

  result.getImageData = image.getImageData;
  result.getImageDataHD = result.getImageData;

  result.putImageData = image.putImageData;
  result.putImageDataHD = result.putImageData;

  // interface CanvasDrawingStyles
  function getLineWidth() { return lineWidth; }
  function setLineWidth(newLineWidth) {
    lineWidth = newLineWidth;
    vg.setF(vg.VGParamType.VG_STROKE_LINE_WIDTH, newLineWidth);
  }
  Object.defineProperty(result, 'lineWidth', { get: getLineWidth, set: setLineWidth });

  function getLineCap() { return lineCap; }
  function setLineCap(newLineCap) {
    var vgCapStyle = lineCap2vg[newLineCap];
    if (vgCapStyle) {
      lineCap = newLineCap;
      vg.setI(vg.VGParamType.VG_STROKE_CAP_STYLE, vgCapStyle);
    } // TODO else ? (@see spec)
  }
  Object.defineProperty(result, 'lineCap', { get: getLineCap, set: setLineCap });

  function getLineJoin() { return lineJoin; }
  function setLineJoin(newLineJoin) {
    var vgJoinStyle = lineJoin2vg[newLineJoin];
    if (vgJoinStyle) {
      lineJoin = newLineJoin;
      vg.setI(vg.VGParamType.VG_STROKE_JOIN_STYLE, vgJoinStyle);
    } // TODO else ? (@see spec)
  }
  Object.defineProperty(result, 'lineJoin', { get: getLineJoin, set: setLineJoin });

  function getMiterLimit() { return miterLimit; }
  function setMiterLimit(newMiterLimit) {
    miterLimit = newMiterLimit;
    vg.setF(vg.VGParamType.VG_STROKE_MITER_LIMIT, newMiterLimit);
  }
  Object.defineProperty(result, 'miterLimit', { get: getMiterLimit, set: setMiterLimit });


  function lineDashPatternSize(segments) {
    var size = segments.length;
    return size & 0x1 === 0 ? size : size + size;
  }

  function ensureLineDashPatternCapacity(size) {
    if (lineDashPattern.length < size) {
      lineDashPattern = new Float32Array(size * LINE_DASH_EXCESS_FACTOR);
    }
  }

  // dashed lines
  result.setLineDash = function (segments) {
    if (segments === dashList) return; // Nothing to do, just move along

    var size = lineDashPatternSize(segments);
    ensureLineDashPatternCapacity(size);

    for (var i = 0; i < segments.length; i++) {
      var s = segments[i];
      if (!isFinite(s) || s < 0) return; // abort
      lineDashPattern[i] = s;
    }

    if (segments.length & 0x1 === 0) {
      dashList = segments.slice(0);
    } else {
      dashList = new Array(size);
      for (i = 0; i < segments.length; i++)
        dashList[i] = dashList[i + segments.length] = segments[i];

      lineDashPattern.set(lineDashPattern.subarray(0, segments.length), segments.length);
    }

    vg.setFV(vg.VGParamType.VG_STROKE_DASH_PATTERN,
             lineDashPattern.subarray(0, size));
  };

  function internalSetLineDash(state) {
    if (state.dashList === dashList) return;

    dashList = state.dashList;
    for (var i = 0; i < dashList.length; i++)
      lineDashPattern[i] = dashList[i];

    vg.setFV(vg.VGParamType.VG_STROKE_DASH_PATTERN,
             lineDashPattern.subarray(0, dashList.length));
  }

  result.getLineDash = function () {
    return dashList;
  };

  function getLineDashOffset() { return lineDashOffset; }
  function setLineDashOffset(newLineDashOffset) {
    if (lineDashOffset !== newLineDashOffset) {
      lineDashOffset = newLineDashOffset;
      vg.setF(vg.VGParamType.VG_STROKE_DASH_PHASE, newLineDashOffset);
    }
  }
  Object.defineProperty(result, 'lineDashOffset', { get: getLineDashOffset,
                                                    set: setLineDashOffset });

  // text
  function getFont() { return font; }
  function setFont(newFont) {
    var parsedFont = text.parseFont(newFont);
    if (parsedFont) {
      text.loadTypeface(parsedFont, function (err, typeface) {
        font = text.serialize(parsedFont);
        currentFont = parsedFont;
        currentFont.typeface = typeface;
      });
    }
  }
  Object.defineProperty(result, 'font', { get: getFont, set: setFont });

  function getTextAlign() { return textAlign; }
  function setTextAlign(newTextAlign) {
    if (textRendering.setTextAlign(newTextAlign)) {
      textAlign = newTextAlign;
    }
  }
  Object.defineProperty(result, 'textAlign', { get: getTextAlign, set: setTextAlign });

  function getTextBaseline() { return textBaseline; }
  function setTextBaseline(newTextBaseline) {
    if (textRendering.setTextBaseline(newTextBaseline)) {
      textBaseline = newTextBaseline;
    }
  }
  Object.defineProperty(result, 'textBaseline', { get: getTextBaseline, set: setTextBaseline });

  function getDirection() { return direction; }
  function setDirection(newDirection) {
    direction = textRendering.setDirection(newDirection);
  }
  Object.defineProperty(result, 'direction', { get: getDirection, set: setDirection });


  // interface CanvasPathMethods
  // shared path API methods
  result.closePath = function () {
    currentPath.closePath();
  };

  result.moveTo = function (x, y) {
    currentPath.moveTo(x, y);
  };

  result.lineTo = function (x, y) {
    currentPath.lineTo(x, y);
  };

  result.quadraticCurveTo = function (cpx, cpy, x, y) {
    currentPath.quadraticCurveTo(cpx, cpy, x, y);
  };

  result.bezierCurveTo = function (cp1x, cp1y, cp2x, cp2y, x, y) {
    currentPath.quadraticCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
  };

  result.arcTo = function (x1, y1, x2, y2, radiusX, radiusY, rotation) {
    currentPath.arcTo(x1, y1, x2, y2, radiusX, radiusY, rotation);
  };

  result.rect = function (x, y, w, h) {
    currentPath.rect(x, y, w, h);
  };

  result.arc = function (x, y, radius, startAngle, endAngle, anticlockwise) {
    currentPath.arc(x, y, radius, startAngle, endAngle, anticlockwise);
  };

  result.ellipse = function (x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise) {
    currentPath.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise);
  };


  // Initialization
  vg.loadIdentity();
  vg.multMatrix(baseTransform);

  vg.setFV(vg.VGParamType.VG_CLEAR_COLOR, new Float32Array([ 0.0, 0.0, 0.0, 0.0 ]));

  // compositing
  result.globalAlpha = 1.0;
  result.globalCompositeOperation = 'source-over';

  // image smoothing
  result.imageSmoothingEnabled = true;

  // colors and styles (see also the CanvasDrawingStyles interface)
  result.strokeStyle = 'black';
  result.fillStyle = 'black';




  initClippingRegion();

  // interface CanvasDrawingStyles
  // stroke style
  result.lineWidth = 1;
  result.lineCap = 'butt';
  result.lineJoin = 'miter';
  result.miterLimit = 10;

  // dashed lines
  result.setLineDash([]);
  result.lineDashOffset = 0.0;

  // text
  result.font = '10px sans-serif';
  result.textAlign = 'start';
  result.textBaseline = 'alphabetic';
  result.direction = 'ltr';

  return result;
};
