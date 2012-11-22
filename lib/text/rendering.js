/*jslint indent: 2, node: true */
"use strict";

var rendering = module.exports;

var vg = require('openvg');
var m = require('../matrix');
var textFns = require('./text');

var MINIMUM_WIDTH_SCALE = 1.0 - 0.15; // Don't scale horizontally less than 15%

var noop = function () { return 0; };

var textAlignOffsetFunctions = {
  left  : noop,
  right : function (width) { return -width; },
  center: function (width) { return -width / 2; },
  start : null,
  end   : null
};
// Not in HTML context, so, _font style source node_ doesn't apply.
// http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#font-style-source-node
textAlignOffsetFunctions.start = textAlignOffsetFunctions.left;
textAlignOffsetFunctions.end = textAlignOffsetFunctions.right;

var textBaselineOffsetFunctions = {
  top        : function (ascender, descender) { return ascender; },
  middle     : function (ascender, descender) { return ((ascender + descender) / 2 - descender); },
  alphabetic : noop, // no-op
  bottom     : function (ascender, descender) { return -descender; },
  hanging    : null,
  ideographic: null
};
// There doesn't seem to be sufficient information on freetype for these
textBaselineOffsetFunctions.hanging =
  textBaselineOffsetFunctions.ideographic =
  textBaselineOffsetFunctions.top;

// No defaults: Context must initialize this (with its defaults).
var textAlignOffset, textBaselineOffset, direction;

var setTextAlign = rendering.setTextAlign = function (textAlign) {
  var newFn = textAlignOffsetFunctions[textAlign];
  if (newFn) {
    textAlignOffset = newFn;
  }
  return !!newFn;
};

var setTextBaseline = rendering.setTextBaseline = function (textBaseline) {
  var newFn = textBaselineOffsetFunctions[textBaseline];
  if (newFn) {
    textBaselineOffset = newFn;
  }
  return !!newFn;
};

var setDirection = rendering.setDirection = function (newDirection) {
  // 'inherit' value is not supported
  if (newDirection === 'inherit') newDirection = 'ltr';
  if (newDirection === 'ltr' || newDirection === 'rtl')
    direction = newDirection;
  return direction;
};

// textwidth returns the width of a text string at the specified font and size.
// derived from http://web.archive.org/web/20070808195131/http://developer.hybrid.fi/font2openvg/renderFont.cpp.txt
var textWidth = rendering.textWidth = function (text, font, size) {
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
};

var measureText = rendering.measureText = function (text, font, pointSize) {
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
    if (xx + bbox.minX < metrics.actualBoundingBoxLeft) {
      metrics.actualBoundingBoxLeft = xx + bbox.minX;
    }
    if (xx + bbox.maxX > metrics.actualBoundingBoxRight) {
      metrics.actualBoundingBoxRight = xx + bbox.maxX;
    }

    if (yy + bbox.minY < metrics.actualBoundingBoxDescent) {
      metrics.actualBoundingBoxDescent = yy + bbox.minY;
    }
    if (yy + bbox.maxY > metrics.actualBoundingBoxAscent) {
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
};

// This is the "text preparation algorithm" as specified on
// http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#text-preparation-algorithm
var prepareText = rendering.prepareText = function (text, target, maxWidth) {
  var renderInfo = {
    text: text,
    glyphCount: 0,
    glyphPositions: [],
    metrics: {
      actualBoundingBoxLeft : 0.0,
      actualBoundingBoxRight : 0.0,
      actualBoundingBoxAscent : 0.0,
      actualBoundingBoxDescent : 0.0
    },
    scaleX: 1.0,
    anchor: { x: 0.0, y: 0.0 },
    physicalAlignment: 'left',
    fontInfo: null,
    typeface: null
  };
  // 1. If maxWidth was provided but is less than or equal to zero, return an
  //    empty array.
  if (maxWidth && maxWidth <= 0) return renderInfo;

  // 2. Replace all the space characters in text with U+0020 SPACE characters.
  text = renderInfo.text = text.replace(/\t|\n|\u00lf|\u000a|\u000c|\r/g, ' ');

  // 3. Let font be the current font of target, as given by that object's font
  //    attribute.
  var font = target.font;

  // 4. Apply the appropriate step from the following list to determine the
  //    value of direction:
  //        If the target object's direction attribute has the value "ltr"
  //            Let direction be 'ltr'.
  //        If the target object's direction attribute has the value "rtl"
  //            Let direction be 'rtl'.
  //        If the target object's font style source object is an element
  //            Let direction be the directionality of the target object's
  //            font style source object.
  //        If the target object's font style source object is a Document and
  //        that Document has a root element child
  //            Let direction be the directionality of the target object's
  //            font style source object's root element child.
  //        Otherwise
  //            Let direction be 'ltr'.
  // Implementor note: This is not included in an html document, so, the
  // element rules (3rd and 4th) may be ignored.
  var direction = target.direction === 'rtl' ? 'rtl' : 'ltr';

  // 5. Form a hypothetical infinitely-wide CSS line box containing a single
  //    inline box containing the text text, with all the properties at their
  //    initial values except the 'font' property of the inline box set to
  //    font, the 'direction' property of the inline box set to direction, and
  //    the 'white-space' property set to 'pre'. [CSS]

  // The target may be a CanvasRenderingContext2D, so, it cannot be assumed
  // that fontInfo_ is present (as in DrawingStyle)
  var fontInfo = renderInfo.fontInfo = textFns.parseFont(target.font);
  textFns.loadTypeface(fontInfo, function (err, loadedTypeface) {
    // TODO Handle errors
    renderInfo.typeface = loadedTypeface;
  });
  var typeface = renderInfo.typeface;
  // Going on out of the callback is safe because loadTypeface is synchronous

  var pointSize = fontInfo.size;
  var glyphCount = text.length;
  var glyphPositions = renderInfo.glyphPositions = new Array(text.length);
  var xx = 0, yy = 0, i;
  var metrics = renderInfo.metrics;
  for (i = 0; i < text.length; i++) {
    var character = text.charCodeAt(i);
    var glyph = typeface.characterMap[character];
    if (glyph < 0 || glyph === undefined) {
      glyphCount--;
      continue; //glyph is undefined
    }

    var bbox = typeface.glyphBBoxes[glyph];
    if (xx + bbox.minX < metrics.actualBoundingBoxLeft) {
      metrics.actualBoundingBoxLeft = xx + bbox.minX;
    }
    if (xx + bbox.maxX > metrics.actualBoundingBoxRight) {
      metrics.actualBoundingBoxRight = xx + bbox.maxX;
    }

    if (yy + bbox.minY < metrics.actualBoundingBoxDescent) {
      metrics.actualBoundingBoxDescent = yy + bbox.minY;
    }
    if (yy + bbox.maxY > metrics.actualBoundingBoxAscent) {
      metrics.actualBoundingBoxAscent = yy + bbox.maxY;
    }

    glyphPositions[i] = { x: xx, y: yy };

    xx += typeface.glyphAdvances[glyph];
    // yy += 0; // Don't advance on Y, because it's not read from the font
  }
  var textWidth = xx * pointSize / 65536.0;
  renderInfo.glyphCount = glyphCount;
  metrics.actualBoundingBoxLeft    *= -pointSize / 65536.0;
  metrics.actualBoundingBoxRight   *=  pointSize / 65536.0;

  metrics.actualBoundingBoxAscent  *=  pointSize / 65536.0;
  metrics.actualBoundingBoxDescent *= -pointSize / 65536.0;

  // 6. If maxWidth was provided and the hypothetical width of the inline box
  //    in the hypothetical line box is greater than maxWidth CSS pixels, then
  //    change font to have a more condensed font (if one is available or if a
  //    reasonably readable one can be synthesized by applying a horizontal
  //    scale factor to the font) or a smaller font, and return to the previous
  //    step.
  if (maxWidth && textWidth > maxWidth) {
    // Changing to a condensed font is not supported for now.
    // if (typeface.hasCondensedVariant()) {
    //   // TODO change typeface, recalc glyphPositions
    // } else
    if (textWidth * MINIMUM_WIDTH_SCALE <= maxWidth) {
      // Scale down synthetically
      renderInfo.scaleX = maxWidth / textWidth;
      textWidth = maxWidth;
    }
  }

  // 7. The anchor point is a point on the inline box, and the physical
  //    alignment is one of the values left, right, and center. These variables
  //    are determined by the textAlign and textBaseline values as follows:
  //        Horizontal position:
  //            If textAlign is left
  //            If textAlign is start and direction is 'ltr'
  //            If textAlign is end and direction is 'rtl'
  //                Let the anchor point's horizontal position be the left edge
  //                of the inline box, and let physical alignment be left.
  //            If textAlign is right
  //            If textAlign is end and direction is 'ltr'
  //            If textAlign is start and direction is 'rtl'
  //                Let the anchor point's horizontal position be the right
  //                edge of the inline box, and let physical alignment be
  //                right.
  //            If textAlign is center
  //                Let the anchor point's horizontal position be half way
  //                between the left and right edges of the inline box, and let
  //                physical alignment be center.
  if (target.textAlign === 'left' ||
      target.textAlign === 'start' && direction === 'ltr' ||
      target.textAlign === 'end' && direction === 'rtl') {
    renderInfo.anchor.x = 0;
    renderInfo.physicalAlignment = 'left';
  } else
  if (target.textAlign === 'right' ||
      target.textAlign === 'end' && direction === 'ltr' ||
      target.textAlign === 'start' && direction === 'rtl') {
    renderInfo.anchor.x = textWidth;
    renderInfo.physicalAlignment = 'right';
  } else
  if (target.textAlign === 'center') {
    renderInfo.anchor.x = textWidth / 2;
    renderInfo.physicalAlignment = 'center';
  }
  //        Vertical position:
  //            If textBaseline is top
  //                Let the anchor point's vertical position be the top of the
  //                em box of the first available font of the inline box.
  //            If textBaseline is hanging
  //                Let the anchor point's vertical position be the hanging
  //                baseline of the first available font of the inline box.
  //            If textBaseline is middle
  //                Let the anchor point's vertical position be half way
  //                between the bottom and the top of the em box of the first
  //                available font of the inline box.
  //            If textBaseline is alphabetic
  //                Let the anchor point's vertical position be the alphabetic
  //                baseline of the first available font of the inline box.
  //            If textBaseline is ideographic
  //                Let the anchor point's vertical position be the
  //                ideographic baseline of the first available font of the
  //                inline box.
  //            If textBaseline is bottom
  //                Let the anchor point's vertical position be the bottom of
  //                the em box of the first available font of the inline box.
  switch (target.textBaseline) {
  case 'top' :
  case 'hanging' : // freetype doesn't return the hanging baseline
    renderInfo.anchor.y = typeface.ascender * pointSize / 65536.0;
    break;
  case 'middle' :
    renderInfo.anchor.y = ((typeface.ascender + typeface.descender) / 2 - typeface.descender) * pointSize / 65536.0;
    break;
  case 'alphabetic' :
  case 'ideographic' : // freetype doesn't return the ideographic baseline
    renderInfo.anchor.y = 0;
    break;
  case 'bottom' :
    renderInfo.anchor.y = -typeface.descender * pointSize / 65536.0;
    break;
  }

  // 8. Let result be an array constructed by iterating over each glyph in the
  //    inline box from left to right (if any), adding to the array, for each
  //    glyph, the shape of the glyph as it is in the inline box, positioned on
  //    a coordinate space using CSS pixels with its origin is at the anchor
  //    point.

  for (i = 0; i < glyphCount; i++) {
    glyphPositions[i].x = glyphPositions[i].x * pointSize / 65536.0 - renderInfo.anchor.x;
    glyphPositions[i].y = glyphPositions[i].y * pointSize / 65536.0 - renderInfo.anchor.y;
  }

  // 9. Return result, physical alignment, and the inline box.
  return renderInfo;
};

// Text renders a string of text at a specified location, size, using the specified font glyphs
// derived from http://web.archive.org/web/20070808195131/http://developer.hybrid.fi/font2openvg/renderFont.cpp.txt
// TODO Use the "text preparation algorithm"
var renderToPath = rendering.renderToPath = function (text, font, size) {
  var textPath = vg.createPath(vg.VG_PATH_FORMAT_STANDARD,
                               vg.VGPathDatatype.VG_PATH_DATATYPE_F,
                               1.0, 0.0, 0, 0, /* scale, bias, segment hint, capacity hint */
                               vg.VGPathCapabilities.VG_PATH_CAPABILITY_ALL);

  var offset = 0;
  vg.loadIdentity();
  vg.scale(size, size);
  for (var i = 0; i < text.length; i++) {
    var character = text.charCodeAt(i);
    var glyph = font.characterMap[character];
    if (glyph < 0 || glyph === undefined) {
      continue;  //glyph is undefined
    }

    vg.transformPath(textPath, font.glyphs[glyph]);
    vg.translate(font.glyphAdvances[glyph] / 65536.0, 0);
  }

  return textPath;
};

var transformRenderToPath = rendering.transformRenderToPath = function (text, renderInfo, transformCallback) {
  var textPath = vg.createPath(vg.VG_PATH_FORMAT_STANDARD,
                               vg.VGPathDatatype.VG_PATH_DATATYPE_F,
                               1.0, 0.0, 0, 0, /* scale, bias, segment hint, capacity hint */
                               vg.VGPathCapabilities.VG_PATH_CAPABILITY_ALL);
  var typeface = renderInfo.typeface;
  for (var i = 0; i < text.length; i++) {
    var character = text.charCodeAt(i);
    var glyph = typeface.characterMap[character];
    if (glyph < 0 || glyph === undefined) {
      continue;  //glyph is undefined
    }

    vg.loadIdentity();

    transformCallback(textPath, i, character);
  }

  return textPath;
};

// TODO Use the "text preparation algorithm"
var renderText = rendering.renderText = function (x, y, text, font, size, paintMode) {
  var currentMatrix = m.create(), currentLineWidth;

  vg.getMatrix(currentMatrix);
  currentLineWidth = vg.getF(vg.VGParamType.VG_STROKE_LINE_WIDTH);

  var mat = m.m(
     1.0,   0.0, 0.0,
     0.0,  -1.0, 0.0,
       x,     y, 1.0
  );

  if (textAlignOffset !== noop) { // no-op is cheap, textWidth isn't
    mat[6] += textAlignOffset(textWidth(text, font, size));
  }

  mat[7] += textBaselineOffset(font.ascender  * size / 65536.0,
                               font.descender * size / 65536.0);

  var textPath = renderToPath(text, font, size);

  vg.loadMatrix(currentMatrix);
  vg.multMatrix(mat);
  vg.drawPath(textPath, paintMode);

  vg.setF(vg.VGParamType.VG_STROKE_LINE_WIDTH, currentLineWidth);
  vg.loadMatrix(currentMatrix);
  vg.destroyPath(textPath);
};
