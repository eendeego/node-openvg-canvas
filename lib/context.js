var util = require('util');

var vg = require('openvg');
var text = require('./text/text');
var textLoading = require('./text/loading');
var textRendering = require('./text/rendering');
var color = require('./color');
var image = require('./image');
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
  'openVG-additive' : vg.VGBlendMode.VG_BLEND_ADDITIVE,
};

var lineCap2vg = {
  'butt'   : vg.VGCapStyle.VG_CAP_BUTT,
  'round'  : vg.VGCapStyle.VG_CAP_ROUND,
  'square' : vg.VGCapStyle.VG_CAP_SQUARE
};

var lineJoin2vg = {
  'round' : vg.VGJoinStyle.VG_JOIN_MITER,
  'bevel' : vg.VGJoinStyle.VG_JOIN_BEVEL,
  'miter' : vg.VGJoinStyle.VG_JOIN_MITER
}

function newPath() {
  return vg.createPath(vg.VG_PATH_FORMAT_STANDARD,
                       vg.VGPathDatatype.VG_PATH_DATATYPE_F,
                       1.0, 0.0, 0, 0,
                       vg.VGPathCapabilities.VG_PATH_CAPABILITY_ALL);
}


module.exports.createCanvasRenderingContext2D = function(canvas) {
  // Context information
  var width  = canvas.width;
  var height = canvas.height;

  // OpenVG origin is at bottom left, not top right
  var baseTransform = m.m( 1.0,    0.0, 0.0,
                           0.0,   -1.0, 0.0,
                           0.0, height, 1.0);

  // Internal/Native data
  var clearPaint = vg.createPaint();
  var fillPaint = vg.createPaint();
  var strokePaint = vg.createPaint();

  var fillGradient = null;
  var fillColor = new Float32Array([0,0,0,1]);
  var applyFillStyle = fillStyleSolid;
  var strokeGradient = null;
  var strokeColor = new Float32Array([0,0,0,1]);
  var applyStrokeStyle = strokeStyleSolid;

  var currentPath = newPath();
  var immediatePath = newPath();

  var currentFont;

  var drawingStateStack = [];

  // Canvas/Exposed data

  // compositing
  var globalAlpha;
  var globalCompositeOperation;

  // image smoothing
  var imageSmoothingEnabled;

  // colors and styles (see also the CanvasDrawingStyles interface)
  var strokeStyle;
  var fillStyle;

  // shadows
  // attribute unrestricted double shadowOffsetX; // (default 0)
  // attribute unrestricted double shadowOffsetY; // (default 0)
  // attribute unrestricted double shadowBlur; // (default 0)
  // attribute DOMString shadowColor; // (default transparent black)

  // interface CanvasDrawingStyles
  // line caps/joins
  var lineWidth;
  var lineCap;
  var lineJoin;
  var miterLimit;

  // dashed lines
  var lineDashOffset;

  // text
  var font;
  var textAlign;
  var textBaseline;


  // Context object
  var result = {};

  // Methods
  // back-reference to the canvas
  function getCanvas() { return canvas; }
  Object.defineProperty(result, 'canvas', { get: getCanvas });

  // state
  result.save = function() {
    var current = {
      matrix: m.new(),
      clippingRegion: undefined,
      strokeStyle: strokeStyle,
      fillStyle: fillStyle,
      globalAlpha: globalAlpha,
      imageSmoothingEnabled: imageSmoothingEnabled,
      lineWidth: lineWidth,
      lineCap: lineCap,
      lineJoin: lineJoin,
      miterLimit: miterLimit,
      lineDashOffset: undefined,
      shadowOffsetX: undefined,
      shadowOffsetY: undefined,
      shadowBlur: undefined,
      shadowColor: undefined,
      globalCompositeOperation: undefined,
      font: undefined,
      textAlign: undefined,
      textBaseline: undefined,
      imageSmoothingEnabled: undefined
    }

    vg.getMatrix(current.matrix);

    drawingStateStack.push(current);
  };

  result.restore = function() {
    var current = drawingStateStack.pop();

    vg.loadMatrix(current.matrix);
    result.strokeStyle = current.strokeStyle;
    result.fillStyle = current.fillStyle;
    result.globalAlpha = current.globalAlpha;
    result.imageSmoothingEnabled = current.imageSmoothingEnabled;
    result.lineWidth = current.lineWidth;
    result.lineCap = current.lineCap;
    result.lineJoin = current.lineJoin;
    result.miterLimit = current.miterLimit;
  };

  // transformations (default transform is the identity matrix)
  result.scale = function(x, y) {
    vg.scale(x, y);
  };

  result.rotate = function(angle) {
    vg.rotate(angle * 180 / Math.PI);
  };

  result.translate = function(x, y) {
    vg.translate(x, y);
  };

  result.transform = function(a, b, c, d, e, f) {
    var matrix = m.m( a, b, 0.0,
                      c, d, 0.0,
                      e, f, 1.0);

    vg.multMatrix(matrix);
  };

  result.setTransform = function(a, b, c, d, e, f) {
    var matrix = m.m( a, b, 0.0,
                      c, d, 0.0,
                      e, f, 1.0);

    vg.loadIdentity();
    vg.multMatrix(baseTransform);
    vg.multMatrix(x, y);
  };

  result.resetTransform = function() {
    vg.loadIdentity();
    vg.multMatrix(baseTransform);
  };

  // compositing
  function getGlobalAlpha() { return globalAlpha; }
  function setGlobalAlpha(newGlobalAlpha) {
    if(0 <= newGlobalAlpha && newGlobalAlpha <= 1.0) {
      globalAlpha = newGlobalAlpha;
    }
  }
  Object.defineProperty(result, 'globalAlpha', { get: getGlobalAlpha, set: setGlobalAlpha });

  function getGlobalCompositeOperation() { return globalCompositeOperation; }
  function setGlobalCompositeOperation(newGlobalCompositeOperation) {
    var vgBlendMode = compositeOperation2vg[newGlobalCompositeOperation];
    if (vgBlendMode) {
      globalCompositeOperation = newGlobalCompositeOperation;
      vg.setI(vg.VGParamType.VG_BLEND_MODE, vgBlendMode);
    } // TODO else ? (@see spec)
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

  function strokeStyleSolid() {
    var effectiveStrokeColor = color.applyAlpha(strokeColor, globalAlpha);

    vg.setParameterI (strokePaint, vg.VGPaintParamType.VG_PAINT_TYPE, vg.VGPaintType.VG_PAINT_TYPE_COLOR);
    vg.setParameterFV(strokePaint, vg.VGPaintParamType.VG_PAINT_COLOR, effectiveStrokeColor);
    vg.setPaint      (strokePaint, vg.VGPaintMode.VG_STROKE_PATH);
  }

  function calculateStopArray(stops) {
    var result = new Float32Array(5 * stops.length * 4);
    var stopIdx = 0;
    for(var i = 0; i < stops.length; i++) {
      result[stopIdx++] = stops[i].stop;
      result[stopIdx++] = stops[i].color[0];
      result[stopIdx++] = stops[i].color[1];
      result[stopIdx++] = stops[i].color[2];
      result[stopIdx++] = stops[i].color[3] * globalAlpha;
    }
    return result;
  }

  function applyGradient(paint, gradient, paintMode) {
    var paintType, paintParam;
    var stopArray;

    if('linearGradient' === gradient.type) {
      paintType  = vg.VGPaintType.VG_PAINT_TYPE_LINEAR_GRADIENT;
      paintParam = vg.VGPaintParamType.VG_PAINT_LINEAR_GRADIENT;
    } else {
      paintType  = vg.VGPaintType.VG_PAINT_TYPE_RADIAL_GRADIENT;
      paintParam = vg.VGPaintParamType.VG_PAINT_RADIAL_GRADIENT;
    }

    if(gradient.stops.length === 0) {
      stopArray = new Float32Array([0, 0, 0, 0, 0,  1, 1, 1, 1]);
    } else {
      stopArray = calculateStopArray(gradient.stops);
    }

    vg.setParameterI(paint, vg.VGPaintParamType.VG_PAINT_TYPE, paintType);
    vg.setParameterFV(paint, paintParam, gradient.parameters);

    vg.setParameterI(paint,
                     vg.VGPaintParamType.VG_PAINT_COLOR_RAMP_SPREAD_MODE,
                     vg.VGColorRampSpreadMode.VG_COLOR_RAMP_SPREAD_PAD);
    vg.setParameterI(paint,
                     vg.VGPaintParamType.VG_PAINT_COLOR_RAMP_PREMULTIPLIED,
                     0 /* VG_FALSE */);
    vg.setParameterFV(paint,
                      vg.VGPaintParamType.VG_PAINT_COLOR_RAMP_STOPS,
                      stopArray);
    vg.setPaint(paint, paintMode);
  }

  function strokeStyleGradient() {
    applyGradient(strokePaint,
                  strokeGradient,
                  vg.VGPaintMode.VG_STROKE_PATH);
  }

  // colors and styles (see also the CanvasDrawingStyles interface)
  function getStrokeStyle() { return strokeStyle; }
  function setStrokeStyle(newStrokeStyle) {
    strokeStyle = newStrokeStyle; // TODO Set only if valid

    if ('linearGradient' === newStrokeStyle.type ||
        'radialGradient' === newStrokeStyle.type) {
      strokeGradient = newStrokeStyle;
      applyStrokeStyle = strokeStyleGradient;
    } else if ('string' === typeof newStrokeStyle) {
      strokeColor = color.parseColor(newStrokeStyle);
      applyStrokeStyle = strokeStyleSolid;
    }
  }
  Object.defineProperty(result, 'strokeStyle', { get: getStrokeStyle, set: setStrokeStyle });

  function fillStyleSolid() {
    var effectiveFillColor = color.applyAlpha(fillColor, globalAlpha);

    vg.setParameterI (fillPaint, vg.VGPaintParamType.VG_PAINT_TYPE, vg.VGPaintType.VG_PAINT_TYPE_COLOR);
    vg.setParameterFV(fillPaint, vg.VGPaintParamType.VG_PAINT_COLOR, effectiveFillColor);
    vg.setPaint      (fillPaint, vg.VGPaintMode.VG_FILL_PATH);
  }

  function fillStyleGradient() {
    applyGradient(fillPaint,
                  fillGradient,
                  vg.VGPaintMode.VG_FILL_PATH);
  }

  function getFillStyle() { return fillStyle; }
  function setFillStyle(newFillStyle) {
    fillStyle = newFillStyle; // TODO Set only if valid

    if ('linearGradient' === newFillStyle.type ||
        'radialGradient' === newFillStyle.type) {
      fillGradient = newFillStyle;
      applyFillStyle = fillStyleGradient;
    } else if ('string' === typeof newFillStyle) {
      fillColor = color.parseColor(newFillStyle);
      applyFillStyle = fillStyleSolid;
    }
  }
  Object.defineProperty(result, 'fillStyle',
                        { get: getFillStyle, set: setFillStyle });

  function createGradient(type, parameters) {
    var result = {
      type: type,
      parameters: parameters,
      stops: [],
      addColorStop : function(stop, baseColor) {
        result.stops.push({
          stop: stop,
          color: color.parseColor(baseColor)
        });
      }
    };
    return result;
  }


  result.createLinearGradient = function(x0, y0, x1, y1) {
    return createGradient('linearGradient',
                          new Float32Array([x0, y0, x1, y1]));
  };

  result.createRadialGradient = function(x0, y0, r0, x1, y1, r1) {
    return createGradient('radialGradient',
                          new Float32Array([x0, y0, x1, y1, r1]));
  };

  result.createPattern = function(image, repetition) {
    return null;
  };


  // rects
  result.clearRect = function(x, y, w, h) {
    var savePaint = vg.getPaint(vg.VGPaintMode.VG_FILL_PATH);
    vg.setPaint(clearPaint, vg.VGPaintMode.VG_FILL_PATH);

    vg.clearPath(immediatePath, vg.VGPathCapabilities.VG_PATH_CAPABILITY_ALL);
    vg.vgu.rect(immediatePath, x, y, w, h);
    vg.drawPath(immediatePath, vg.VGPaintMode.VG_FILL_PATH);

    vg.setPaint(clearPaint, savePaint);
  };

  result.fillRect = function(x, y, w, h) {
    applyFillStyle();

    vg.clearPath(immediatePath, vg.VGPathCapabilities.VG_PATH_CAPABILITY_ALL);
    vg.vgu.rect(immediatePath, x, y, w, h);
    vg.drawPath(immediatePath, vg.VGPaintMode.VG_FILL_PATH);
  };

  result.strokeRect = function(x, y, w, h) {
    applyStrokeStyle();

    vg.clearPath(immediatePath, vg.VGPathCapabilities.VG_PATH_CAPABILITY_ALL);
    vg.vgu.rect(immediatePath, x, y, w, h);
    vg.drawPath(immediatePath, vg.VGPaintMode.VG_STROKE_PATH);
  };


  // path API (see also CanvasPathMethods)
  result.beginPath = function() {
    vg.clearPath(currentPath, vg.VGPathCapabilities.VG_PATH_CAPABILITY_ALL);
  }


  result.fill = function(path) {
    applyFillStyle();
    vg.drawPath(path || currentPath, vg.VGPaintMode.VG_FILL_PATH);
  };

  result.stroke = function(path) {
    applyStrokeStyle();
    vg.drawPath(path || currentPath, vg.VGPaintMode.VG_STROKE_PATH);
  };

  result.drawSystemFocusRing = function(path, element) {
    if (element === undefined) {
      element = path;
      path = currentPath;
    }
    return null;
  };

  result.drawCustomFocusRing = function(path, element) {
    if (element === undefined) {
      element = path;
      path = currentPath;
    }
    return null;
  };

  result.scrollPathIntoView = function(path) {
    if (path === undefined) { path = currentPath }
    return null;
  };

  result.clip = function(path) {
    if (path === undefined) { path = currentPath }
    return null;
  };

  result.resetClip = function() {
    return null;
  };

  result.isPointInPath = function(path, x, y) {
    if (y === undefined) {
      y = x;
      x = path;
      path = currentPath;
    }

    return null;
  };

  // text (see also the CanvasDrawingStyles interface)
  result.fillText = function(text, x, y, maxWidth) {
    applyFillStyle();

    // TODO implement maxWidth
    textRendering.renderText(x, y, text,
                             currentFont.typeface,
                             currentFont.size,
                             vg.VGPaintMode.VG_FILL_PATH);
  };

  result.strokeText = function(text, x, y, maxWidth) {
    applyStrokeStyle();

    // TODO implement maxWidth
    textRendering.renderText(x, y, text,
                             currentFont.typeface,
                             currentFont.size,
                             vg.VGPaintMode.VG_STROKE_PATH);
  };

  result.measureText = function(text) {
    return textRendering.measureText(text,
                                     currentFont.typeface,
                                     currentFont.size);
  };


  // drawing images
  result.drawImage = function(img, sx, sy, sw, sh, dx, dy, dw, dh) {
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

    image.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
  };


  // hit regions
  result.addHitRegion = function(options) {
    return null;
  };

  result.removeHitRegion = function(options) {
    return null;
  };


  // pixel manipulation
  result.createImageData = function(sw, sh) {
    if (sh === undefined) {
      // imagedata <= sw
      return createImageDataImg(sw);
    }
    return image.createImageDataWH(sw, sh);
  };

  result.createImageDataHD = image.createImageDataWH;

  result.getImageData = image.getImageData;
  result.getImageDataHD = result.getImageData;

  result.putImageData = image.putImageData;
  result.putImageDataHD = result.putImageData;

  // interface CanvasDrawingStyles
  // line caps/joins
  var miterLimit = 10; // (default 10)

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
  Object.defineProperty(result, 'lineCap', { get: getLineCap, set: setLineCap });

  function getMiterLimit() { return miterLimit; }
  function setMiterLimit(newMiterLimit) {
    miterLimit = newMiterLimit;
    vg.setF(vg.VGParamType.VG_STROKE_MITER_LIMIT, newMiterLimit);
  }
  Object.defineProperty(result, 'miterLimit', { get: getMiterLimit, set: setMiterLimit });


  // dashed lines
  result.setLineDash = function(segments) { // default empty
    return null;
  };

  result.getLineDash = function() {
    return null;
  };

  // text
  function getFont() { return font; }
  function setFont(newFont) {
    var parsedFont = text.parseFont(newFont);
    if (parsedFont) {
      text.loadTypeface(parsedFont, function(err, typeface) {
        font = text.serialize(parsedFont);
        currentFont = parsedFont;
        currentFont.typeface = typeface;
      });
    }
  }
  Object.defineProperty(result, 'font', { get: getFont, set: setFont });

  function getTextAlign() { return ; textAlign}
  function setTextAlign(newTextAlign) {
    if (textRendering.setTextAlign(newTextAlign)) {
      textAlign = newTextAlign;
    }
  }
  Object.defineProperty(result, 'textAlign', { get: getTextAlign, set: setTextAlign });

  function getTextBaseline() { return ; textBaseline}
  function setTextBaseline(newTextBaseline) {
    if (textRendering.setTextBaseline(newTextBaseline)) {
      textBaseline = newTextBaseline;
    }
  }
  Object.defineProperty(result, 'textBaseline', { get: getTextBaseline, set: setTextBaseline });


  // interface CanvasPathMethods
  // shared path API methods
  result.closePath = function() {
    vg.appendPathData(currentPath, 1, new Uint8Array([vg.VGPathSegment.VG_CLOSE_PATH]),
                      new Float32Array(0));
  };

  result.moveTo = function(x, y) {
    vg.appendPathData(currentPath, 1, new Uint8Array([vg.VGPathSegment.VG_MOVE_TO]),
                      new Float32Array([x, y]));
  };

  result.lineTo = function(x, y) {
    vg.appendPathData(currentPath, 1, new Uint8Array([vg.VGPathSegment.VG_LINE_TO]),
                      new Float32Array([x, y]));
  };

  result.quadraticCurveTo = function(cpx, cpy, x, y) {
    vg.appendPathData(currentPath, 1, new Uint8Array([vg.VGPathSegment.VG_QUAD_TO]),
                      new Float32Array([cpx, cpy, x, y]));
  };

  result.bezierCurveTo = function(cp1x, cp1y, cp2x, cp2y, x, y) {
    vg.appendPathData(currentPath, 1, new Uint8Array([vg.VGPathSegment.VG_CUBIC_TO]),
                      new Float32Array([cp1x, cp1y, cp2x, cp2y, x, y]));
  };

  result.arcTo = function(x1, y1, x2, y2, radiusX, radiusY, rotation) {
    if (radiusY === undefined) {
      radiusY = radiusX;
      rotation = 0;
    }
    // lots of math missing here ...
    // vg.appendPathData(currentPath, 1, new Uint8Array([vg.VGPathSegment.VG_LCARC_TO]),
    //                   new Float32Array([radiusX, radiusY, rotation * 180 / Math.PI, x2, y2]));
  };
 
  result.rect = function(x, y, w, h) {
    vg.vgu.rect(currentPath, x, y, w, h);
  };

  result.arc = function(x, y, radius, startAngle, endAngle, anticlockwise) {
    if (anticlockwise === undefined) { anticlockwise = false; }
    result.ellipse(x, y, radius, radius, 0, startAngle, endAngle, anticlockwise);
  };
 
  result.ellipse = function(x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise) {
    var start  = startAngle * 180 / Math.PI;
    var extent = (endAngle - startAngle) * 180 / Math.PI;
    if (anticlockwise) { extent -= 360; }
    // rotation ignored
    vg.vgu.arc(currentPath, x, y, radiusX * 2, radiusY * 2,
               startAngle * 180 / Math.PI, (endAngle - startAngle) * 180 / Math.PI,
               vg.VGUArcType.VGU_ARC_OPEN);
  };


  // Initialization
  vg.loadIdentity();
  vg.multMatrix(baseTransform);

  // compositing
  result.globalAlpha = 1.0;
  result.globalCompositeOperation = 'src-over';

  // image smoothing
  result.imageSmoothingEnabled = true;  

  // colors and styles (see also the CanvasDrawingStyles interface)
  result.strokeStyle = 'black';
  result.fillStyle = 'black';

  // interface CanvasDrawingStyles
  // stroke style
  result.lineWidth = 1;
  result.lineCap = 'butt';
  result.lineJoin = 'miter'
  result.miterLimit = 10;

  // dashed lines
  // result.lineDashOffset = undefined;

  // text
  result.font = '10px sans-serif';
  result.textAlign = 'start';
  result.textBaseline = 'alphabetic';

  return result;
};
