var rendering = module.exports;

var vg = require('openvg');

var noop = function() { return 0; }

var textAlignOffsetFunctions = {
  left  : noop,
  right : function(width) { return -width; },
  center: function(width) { return -width / 2; },
  start : null,
  end   : null
};
// Not in HTML context, so, _font style source node_ doesn't apply.
// http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#font-style-source-node
textAlignOffsetFunctions.start = textAlignOffsetFunctions.left;
textAlignOffsetFunctions.end = textAlignOffsetFunctions.right;

var textBaselineOffsetFunctions = {
  top        : function(ascender, descender) { return ascender; },
  middle     : function(ascender, descender) { return ((ascender + descender)/2 - descender); },
  alphabetic : noop, // no-op
  bottom     : function(ascender, descender) { return -descender; },
  hanging    : null,
  ideographic: null
};
// There doesn't seem to be sufficient information on freetype for these
textBaselineOffsetFunctions.hanging =
  textBaselineOffsetFunctions.ideographic =
  textBaselineOffsetFunctions.top;

// No defaults: Context must initialize this (with its defaults).
var textAlignOffset, textBaselineOffset;

var setTextAlign = rendering.setTextAlign = function(textAlign) {
  var newFn = textAlignOffsetFunctions[textAlign];
  if (newFn) {
    textAlignOffset = newFn;
  }
  return !!newFn;
}

var setTextBaseline = rendering.setTextBaseline = function(textBaseline) {
  var newFn = textBaselineOffsetFunctions[textBaseline];
  if (newFn) {
    textBaselineOffset = newFn;
  }
  return !!newFn;
}

// textwidth returns the width of a text string at the specified font and size.
// derived from http://web.archive.org/web/20070808195131/http://developer.hybrid.fi/font2openvg/renderFont.cpp.txt
var textWidth = rendering.textWidth = function(text, font, size) {
  var tw = 0.0;
  for (var i = 0; i < text.length; i++) {
    var character = text.charCodeAt(i);
    var glyph = font.characterMap[character];
    if (glyph < 0 || glyph === undefined) {
      continue; //glyph is undefined
    }
    tw += size * font.glyphAdvances[glyph] / 65536.0;
  }
  return tw;
}

var measureText = rendering.measureText = function(text, font, pointSize) {
  // TODO Make these values read-only
  var metrics = {
    // x-direction
    width: 0, // advance width
    actualBoundingBoxLeft: 0,
    actualBoundingBoxRight: 0,

    // y-direction
    fontBoundingBoxAscent: 0,
    fontBoundingBoxDescent: 0,
    actualBoundingBoxAscent: 0,
    actualBoundingBoxDescent: 0,
    emHeightAscent: font.ascender * pointSize / 65536.0,
    emHeightDescent: font.descender * pointSize / 65536.0,
    hangingBaseline: 0,
    alphabeticBaseline: 0,
    ideographicBaseline: 0,

    freetypeExtra: null
  };

  metrics.freetypeExtra = {
    num_glyphs: font.face.num_glyphs,
    family_name: font.face.family_name,
    style_name: font.face.style_name,
    units_per_EM: font.face.units_per_EM,
    ascender: font.face.ascender,
    descender: font.face.descender,
    height: font.face.height
  };

  if (text.length === 0) {
    return metrics;
  }

  var xx = 0, yy = 0;
  for (var i = 0; i < text.length; i++) {
    var character = text.charCodeAt(i);
    var glyph = font.characterMap[character];
    if (glyph < 0 || glyph === undefined) {
      continue; //glyph is undefined
    }

    var bbox = font.glyphBBoxes[glyph];
    if(xx + bbox.minX < metrics.actualBoundingBoxLeft) {
      metrics.actualBoundingBoxLeft = xx + bbox.minX;
    }
    if(xx + bbox.maxX > metrics.actualBoundingBoxRight) {
      metrics.actualBoundingBoxRight = xx + bbox.maxX;
    }

    if(yy + bbox.minY < metrics.actualBoundingBoxDescent) {
      metrics.actualBoundingBoxDescent = yy + bbox.minY;
    }
    if(yy + bbox.maxY > metrics.actualBoundingBoxAscent) {
      metrics.actualBoundingBoxAscent = yy + bbox.maxY;
    }

    xx += font.glyphAdvances[glyph];
    yy += 0;
  }

  metrics.width = xx * pointSize / 65536.0;

  var offsetX = textAlignOffset(metrics.width);
  var offsetY = textBaselineOffset(font.ascender, font.descender);

  metrics.actualBoundingBoxLeft    *= -pointSize / 65536.0;
  metrics.actualBoundingBoxRight   *=  pointSize / 65536.0;

  metrics.actualBoundingBoxLeft  += offsetX;
  metrics.actualBoundingBoxRight += offsetX;

  metrics.actualBoundingBoxAscent  -= offsetY;
  metrics.actualBoundingBoxDescent -= offsetY;

  metrics.actualBoundingBoxAscent  *=  pointSize / 65536.0;
  metrics.actualBoundingBoxDescent *= -pointSize / 65536.0;

  metrics.fontBoundingBoxAscent  = metrics.actualBoundingBoxAscent;
  metrics.fontBoundingBoxDescent = metrics.actualBoundingBoxDescent;

  //
  // These don't seem implemented by freetype
  //
  // metrics.hangingBaseline *= pointSize / 65536.0;
  // metrics.alphabeticBaseline *= pointSize / 65536.0;
  // metrics.ideographicBaseline *= pointSize / 65536.0;

  return metrics;
}

// Text renders a string of text at a specified location, size, using the specified font glyphs
// derived from http://web.archive.org/web/20070808195131/http://developer.hybrid.fi/font2openvg/renderFont.cpp.txt
var renderText = rendering.renderText = function(x, y, text, font, size, paintMode) {
  var currentMatrix = new Float32Array(9), currentLineWidth;
  var textPath = vg.createPath(vg.VG_PATH_FORMAT_STANDARD,
                               vg.VGPathDatatype.VG_PATH_DATATYPE_F,
                               1.0, 0.0, 0, 0, /* scale, bias, segment hint, capacity hint */
                               vg.VGPathCapabilities.VG_PATH_CAPABILITY_ALL);

  vg.getMatrix(currentMatrix);
  currentLineWidth = vg.getF(vg.VGParamType.VG_STROKE_LINE_WIDTH);

  var mat = new Float32Array([
    size,   0.0, 0.0,
     0.0, -size, 0.0,
       x,     y, 1.0
  ]);

  if (textAlignOffset !== noop) { // no-op is cheap, textWidth isn't
    mat[6] += textAlignOffset(textWidth(text, font, size));
  }

  mat[7] += textBaselineOffset(font.ascender  * size / 65536.0,
                               font.descender * size / 65536.0);

  var offset = 0;
  vg.loadIdentity();
  for (var i = 0; i < text.length; i++) {
    var character = text.charCodeAt(i);
    var glyph = font.characterMap[character];
    if (glyph < 0 || glyph === undefined) {
      continue;  //glyph is undefined
    }

    vg.transformPath(textPath, font.glyphs[glyph]);
    vg.translate(font.glyphAdvances[glyph] / 65536.0, 0);
  }

  vg.setF(vg.VGParamType.VG_STROKE_LINE_WIDTH, currentLineWidth / size);
  vg.loadMatrix(currentMatrix);
  vg.multMatrix(mat);
  vg.drawPath(textPath, paintMode);

  vg.setF(vg.VGParamType.VG_STROKE_LINE_WIDTH, currentLineWidth);
  vg.loadMatrix(currentMatrix);
}
