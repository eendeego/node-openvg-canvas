/*jslint indent: 2, node: true */
"use strict";

var util = require('util');

var vg = require('openvg');
var m = require('./matrix');
var textFns = require('./text/text');
var textRendering = require('./text/rendering');

// TODO destroy path as a result of garbage collection

var Path = module.exports = function (path) {
  // native path
  this.vgPath = vg.createPath(vg.VG_PATH_FORMAT_STANDARD,
                              vg.VGPathDatatype.VG_PATH_DATATYPE_F,
                              1.0 /* scale */ , 0.0 /* bias */,
                              0 /* segCapacityHint */,
                              0 /* coordCapacityHint */,
                              vg.VGPathCapabilities.VG_PATH_CAPABILITY_ALL);

  this.rendered    = false; // already rendered ?

  this.segments    = new Uint8Array(1024); // Default 1024 segments
  this.segmentsPos = 0; // where to insert next segment
  this.data        = new Float32Array(3 * 2 * 1024); // Average (?) of 3 points per segment
  this.dataPos     = 0; // where to insert next data

  this.sx          = 0; // starting point
  this.sy          = 0;
  this.x           = 0; // current point
  this.y           = 0;

  if (path === undefined) return;

  if (typeof path === 'Path') {
    if (path.rendered) {
      this.rendered = true;
      vg.appendPath(this.vgPath, path.vgPath);
    }

    this.ensurePathSegmentCapacity(path.segmentsPos);
    this.segments.set(path.segments.subarray(0, path.segmentsPos));
    this.segmentsPos = path.segmentsPos;

    this.ensurePathDataCapacity(path.dataPos);
    this.data.set(path.data.subarray(0, path.dataPos));
    this.dataPos = path.dataPos;

    this.sx = path.sx; // starting point
    this.sy = path.sy;
    this.x  = path.x; // current point
    this.y  = path.y;

    return;
  }

  if (typeof path === 'String') {
    // SVG Path unsupported
  }
};

// Destroy path explicitly (at least until GC support is implemented)
Path.prototype.destroy = function () {
  vg.destroyPath(this.vgPath);
  delete this.segments; // Make the object invalid so that any further use fails fast.
  delete this.data;
};

var growthFactor = 1.5;

Path.prototype.ensurePathSegmentCapacity = function (newCapacity) {
  if (newCapacity <= this.segments.length) return;

  var newLength = this.segments.length;
  while (newCapacity > newLength) {
    newLength *= growthFactor;
  }

  var newSegments = new Uint8Array(newLength);
  newSegments.set(this.segments);
  this.segments = newSegments;
};

Path.prototype.ensurePathDataCapacity = function (newCapacity) {
  if (newCapacity <= this.data.length) return;

  var newLength = this.data.length;
  while (newCapacity > newLength) {
    newLength *= growthFactor;
  }

  var newData = new Float32Array(newLength);
  newData.set(this.data);
  this.data = newData;
};

// Internal function used by Context.beginPath
Path.prototype.beginPath = function () {
  if (this.rendered) {
    vg.clearPath(this.vgPath, vg.VGPathCapabilities.VG_PATH_CAPABILITY_ALL);
    this.rendered = false;
  }
  this.segmentsPos = 0;
  this.dataPos = 0;
  this.sx = 0;
  this.sy = 0;
  this.x = 0;
  this.y = 0;
};

Path.prototype.renderPath = function () {
  if (this.rendered && this.segmentsPos === 0) return;

  vg.appendPathData(this.vgPath,
                    this.segmentsPos,
                    this.segments,
                    this.data);

  this.rendered = true;
  this.segmentsPos = 0;
  this.dataPos = 0;
  this.sx = 0;
  this.sy = 0;
  this.x = 0;
  this.y = 0;
};

Path.prototype.addVGPath = function (vgPath, transform) {
  var currentMatrix = m.create();

  this.renderPath();

  vg.getMatrix(currentMatrix);
  vg.loadMatrix(transform.m);
  vg.transformPath(this.vgPath, vgPath);
  vg.loadMatrix(currentMatrix);
};

Path.prototype.addPath = function (path, transform) {
  path.renderPath();
  this.addVGPath(path.vgPath, transform);
};

Path.prototype.fill = function () {
  this.renderPath();
  vg.drawPath(this.vgPath, vg.VGPaintMode.VG_FILL_PATH);
};

Path.prototype.stroke = function () {
  this.renderPath();
  vg.drawPath(this.vgPath, vg.VGPaintMode.VG_STROKE_PATH);
};

Path.prototype.closePath = function () {
  this.ensurePathSegmentCapacity(this.segmentsPos + 1);
  this.ensurePathDataCapacity(this.dataPos + 1);
  // CLOSE_PATH isn't a command...
  this.segments[this.segmentsPos++] = vg.VGPathSegment.VG_CLOSE_PATH;
  this.x = this.sx;
  this.y = this.sy;
};

Path.prototype.moveTo = function (x, y) {
  this.ensurePathSegmentCapacity(this.segmentsPos + 1);
  this.ensurePathDataCapacity(this.dataPos + 2);
  this.segments[this.segmentsPos++] = vg.VGPathCommand.VG_MOVE_TO_ABS;
  this.data[this.dataPos++] = x;
  this.data[this.dataPos++] = y;
  this.x = this.sx = x;
  this.y = this.sy = y;
};

Path.prototype.lineTo = function (x, y) {
  this.ensurePathSegmentCapacity(this.segmentsPos + 1);
  this.ensurePathDataCapacity(this.dataPos + 2);
  this.segments[this.segmentsPos++] = vg.VGPathCommand.VG_LINE_TO_ABS;
  this.data[this.dataPos++] = x;
  this.data[this.dataPos++] = y;
  this.x = x;
  this.y = y;
};

Path.prototype.quadraticCurveTo = function (cpx, cpy, x, y) {
  this.ensurePathSegmentCapacity(this.segmentsPos + 1);
  this.ensurePathDataCapacity(this.dataPos + 4);
  this.segments[this.segmentsPos++] = vg.VGPathCommand.VG_QUAD_TO_ABS;
  this.data[this.dataPos++] = cpx;
  this.data[this.dataPos++] = cpy;
  this.data[this.dataPos++] = x;
  this.data[this.dataPos++] = y;
  this.x = x;
  this.y = y;
};

Path.prototype.bezierCurveTo = function (cp1x, cp1y, cp2x, cp2y, x, y) {
  this.ensurePathSegmentCapacity(this.segmentsPos + 1);
  this.ensurePathDataCapacity(this.dataPos + 6);
  this.segments[this.segmentsPos++] = vg.VGPathCommand.VG_CUBIC_TO_ABS;
  this.data[this.dataPos++] = cp1x;
  this.data[this.dataPos++] = cp1y;
  this.data[this.dataPos++] = cp2x;
  this.data[this.dataPos++] = cp2y;
  this.data[this.dataPos++] = x;
  this.data[this.dataPos++] = y;
  this.x = x;
  this.y = y;
};

Path.prototype.arcTo = function (x1, y1, x2, y2, radiusX, radiusY, rotation) {
  if (radiusY === undefined) {
    radiusY = radiusX;
    rotation = 0;
  }

  // Ellipses are hard, lets go circles,
  // ie,
  // Transform coordinates turning the given ellipse into a circle, calculate
  // the contact point and then do the reverse transformation.
  var scaleX = radiusY / radiusX;
  var cosRotation = Math.cos(-rotation);
  var sinRotation = Math.sin(-rotation);
  function transform(px, py) {
    return {
      x: (px * cosRotation - py * sinRotation) * scaleX,
      y: px * sinRotation + py * cosRotation
    };
  }
  function reverseTransform(px, py) {
    return {
      x:  px * cosRotation / scaleX + py * sinRotation,
      y: -px * sinRotation / scaleX + py * cosRotation
    };
  }

  var p0 = transform(this.x, this.y);
  var p1 = transform(x1, y1);
  var p2 = transform(x2, y2);

  var v1 = { x: p1.x - p0.x, y: p1.y - p0.y };
  var v2 = { x: p2.x - p1.x, y: p2.y - p1.y };
  var modV1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  var modV2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

  // Make v1 and v2 unit vectors.
  v1.x = v1.x / modV1;
  v1.y = v1.y / modV1;
  v2.x = v2.x / modV2;
  v2.y = v2.y / modV2;

  var dotProduct = v1.x * v2.x + v1.y * v2.y;
  var crossProduct = v1.x * v2.y - v1.y * v2.x;

  if (crossProduct === 0) {
    // Points are colinear
    return;
  }

  var sign = crossProduct > 0 ? 1 : -1;
  var cosAlpha = dotProduct;
  var sinAlpha = Math.sqrt(1 - cosAlpha * cosAlpha);

  // t = distance from the point of contact to p1
  // α = angle between v1 and v2
  // r = t * tan(α/2)
  // tan(α) = sin(2α) / (cos(2α) + 1)
  // tan(α/2) = sin(α) / (cos(α) + 1)
  // t = rY * sin(α) / (1 + cos(α));
  var t = radiusY * sinAlpha / (1 + cosAlpha);
  var pstart = reverseTransform(p1.x - t * v1.x, p1.y - t * v1.y);
  var pend   = reverseTransform(p1.x + t * v2.x, p1.y + t * v2.y);

  // Line segment + Arc segment
  this.ensurePathSegmentCapacity(this.segmentsPos + 1 + 1);
  this.ensurePathDataCapacity(this.dataPos + 2 + 5);

  this.segments[this.segmentsPos++] = vg.VGPathCommand.VG_LINE_TO_ABS;
  this.data[this.dataPos++] = pstart.x;
  this.data[this.dataPos++] = pstart.y;

  this.segments[this.segmentsPos++] =
    sign < 0 ? vg.VGPathCommand.VG_SCWARC_TO_ABS :
               vg.VGPathCommand.VG_SCCWARC_TO_ABS;
  this.data[this.dataPos++] = radiusX;
  this.data[this.dataPos++] = radiusY;
  this.data[this.dataPos++] = rotation * 180 / Math.PI;
  this.data[this.dataPos++] = pend.x;
  this.data[this.dataPos++] = pend.y;

  this.x = pend.x;
  this.y = pend.y;
};

Path.prototype.rect = function (x, y, w, h) {
  this.ensurePathSegmentCapacity(this.segmentsPos + 5);
  this.ensurePathDataCapacity(this.dataPos + 5);
  this.segments[this.segmentsPos++] = vg.VGPathCommand.VG_MOVE_TO_ABS;
  this.data[this.dataPos++] = x;
  this.data[this.dataPos++] = y;
  this.segments[this.segmentsPos++] = vg.VGPathCommand.VG_HLINE_TO_REL;
  this.data[this.dataPos++] = w;
  this.segments[this.segmentsPos++] = vg.VGPathCommand.VG_VLINE_TO_REL;
  this.data[this.dataPos++] = h;
  this.segments[this.segmentsPos++] = vg.VGPathCommand.VG_HLINE_TO_REL;
  this.data[this.dataPos++] = -w;
  this.segments[this.segmentsPos++] = vg.VGPathSegment.VG_CLOSE_PATH;
  this.x = this.sx = x;
  this.y = this.sy = y;
};

Path.prototype.arc = function (x, y, radius, startAngle, endAngle, anticlockwise) {
  if (anticlockwise === undefined) { anticlockwise = false; }
  this.ellipse(x, y, radius, radius, 0, startAngle, endAngle, anticlockwise);
};

Path.prototype.ellipse = function (x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise) {
  var self = this;
  this.ensurePathSegmentCapacity(this.segmentsPos + 1 /* LINE_TO */ + 2 /* maximum arcs */);
  this.ensurePathDataCapacity(this.dataPos + 2 /* LINE_TO */ + 2 * 5 /* maximum arcs */);

  var px, py;
  function rotateP() {
    var tx = px * Math.cos(rotation) - py * Math.sin(rotation);
    py = px * Math.sin(rotation) + py * Math.cos(rotation);
    px = tx;
  }

  px = radiusX * Math.cos(startAngle);
  py = radiusY * Math.sin(startAngle);

  rotateP();
  var vgRotation = rotation * 180 / Math.PI;

  function addArc(command) {
    self.segments[self.segmentsPos++] = command;
    self.data[self.dataPos++] = radiusX;
    self.data[self.dataPos++] = radiusY;
    self.data[self.dataPos++] = vgRotation;
    self.data[self.dataPos++] = x + px;
    self.data[self.dataPos++] = y + py;
  }

  // Move to beginning of elliptical arc
  this.segments[this.segmentsPos++] = vg.VGPathCommand.VG_LINE_TO_ABS;
  this.data[this.dataPos++] = x + px;
  this.data[this.dataPos++] = y + py;

  var angle;

  if (anticlockwise) {
    if (startAngle - endAngle >= 2 * Math.PI) {
      startAngle = 2 * Math.PI;
      endAngle = 0;
    }

    while (endAngle > startAngle) endAngle -= 2 * Math.PI;

    angle = startAngle - Math.PI;

    while (angle > endAngle) {
      px = radiusX * Math.cos(angle);
      py = radiusY * Math.sin(angle);
      rotateP();
      addArc(vg.VGPathCommand.VG_SCWARC_TO_ABS);
      angle -= 2 * Math.PI;
    }
    px = radiusX * Math.cos(endAngle);
    py = radiusY * Math.sin(endAngle);
    rotateP();
    addArc(vg.VGPathCommand.VG_SCWARC_TO_ABS);
  } else {
    if (endAngle - startAngle >= 2 * Math.PI) {
      endAngle = 2 * Math.PI;
      startAngle = 0;
    }

    while (endAngle < startAngle) endAngle += 2 * Math.PI;

    angle = startAngle + Math.PI;
    while (angle < endAngle) {
      px = radiusX * Math.cos(angle);
      py = radiusY * Math.sin(angle);
      rotateP();
      addArc(vg.VGPathCommand.VG_SCCWARC_TO_ABS);
      angle += 2 * Math.PI;
    }
    px = radiusX * Math.cos(endAngle);
    py = radiusY * Math.sin(endAngle);
    rotateP();
    addArc(vg.VGPathCommand.VG_SCCWARC_TO_ABS);
  }
};

Path.prototype.addTextOnPosition = function (text, styles, transform, x, y, maxWidth) {
  var self = this;

  textFns.loadTypeface(styles.fontInfo_, function (err, typeface) {
    var currentMatrix = m.create();

    vg.getMatrix(currentMatrix);

    self.renderPath();
    var path = textRendering.renderToPath(text, typeface, styles.fontInfo_.size);

    self.addVGPath(path, transform.vgScale(1.0, -1.0).mTranslate(x, y));

    vg.destroyPath(path);

    vg.loadMatrix(currentMatrix);
  });
};

Path.prototype.addTextOnPath = function (text, styles, transform, path, maxWidth) {
  var self = this;

  var currentMatrix = m.create();
  vg.getMatrix(currentMatrix);

  // This is the algorithm specified by
  // http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#dom-path-addtext
  // [...]
  // When one of the addText() and addPathByStrokingText() variants that
  // take as argument a Path object is invoked, the method must run the
  // following algorithm:

  // 1. Let target be the Path object on which the method was invoked.
  self.renderPath();
  // 2. Let path be the Path object that was provided in the method's
  //    arguments.
  path.renderPath();

  // 3. Run the text preparation algorithm, passing it text, the
  //    CanvasDrawingStyles object argument, and, if the maxWidth argument was
  //    provided, that argument. Let glyphs be the resulting array, and
  //    physical alignment be the resulting alignment value.
  var renderInfo = textRendering.prepareText(text, styles, maxWidth);
  var typeface = renderInfo.typeface;
  var size = renderInfo.fontInfo.size;

  // 4. Let width be the aggregate length of all the subpaths in path,
  //    including the distances from the last point of each closed subpath
  //    to the first point of that subpath.
  var pathNumSegments =
    vg.getParameterI(path.vgPath, vg.VGPathParamType.VG_PATH_NUM_SEGMENTS);
  var width = vg.pathLength(path.vgPath, 0, pathNumSegments);

  // 5. Define L to be a linear coordinate line for of all the subpaths in
  //    path, with additional lines drawn between the last point and the first
  //    point of each closed subpath, such that the first point of the first
  //    subpath is defined as point 0, and the last point of the last subpath,
  //    if the last subpath is not closed, or the second occurrence first
  //    point of that subpath, if it is closed, is defined as point width.
  // This looks like the way vgPointAlongPath's distance parameter works.

  // 6. Let offset be determined according to the appropriate step below:
  //    If physical alignment is left   => Let offset be zero.
  //    If physical alignment is right  => Let offset be width.
  //    If physical alignment is center => Let offset be half of width.
  var offset;
  if (renderInfo.physicalAlignment === 'left') {
    offset = 0;
  } else
  if (renderInfo.physicalAlignment === 'right') {
    offset = width;
  } else
  if (renderInfo.physicalAlignment === 'center') {
    offset = width / 2;
  }

  // 7. Move all the shapes in glyphs to the right by offset CSS pixels.
  for (var i = 0; i < renderInfo.glyphCount; i++) {
    renderInfo.glyphPositions[i].x += offset;
  }

  // 8. For each glyph glyph in the glyphs array, run these substeps:
  var pointInfo = { x: 0.0, y: 0.0, tx: 0.0, ty: 0.0 };
  var textPath =
    textRendering.transformRenderToPath(text, renderInfo,
                                        function (textPath, idx, character) {

    var glyph = typeface.characterMap[character];

    //     1. Let dx be the x-coordinate of the horizontal center of the
    //        bounding box of the shape described by glyph, in CSS pixels.
    var bbox = typeface.glyphBBoxes[glyph];
    var hCenter = (bbox.minX + (bbox.maxX - bbox.minX) / 2) * size / 65536.0;
    var dx = renderInfo.glyphPositions[idx].x + hCenter;

    //     2. If dx is negative or greater than width, skip the remainder or
    //        these substeps for this glyph.
    if (dx < 0 || dx > width) return false;

    //     3. Recast dx to coordinate spaces units in path. (This just changes
    //        the dimensionality of dx, not its numeric value.)
    // WAT !?

    //     4. Find the point p on path (or implied closing lines in path) that
    //        corresponds to the position dx on the coordinate line L.
    vg.pointAlongPath(path.vgPath, 0, pathNumSegments, dx, pointInfo);

    //     5. Let θ be the clockwise angle from the positive x-axis to the side
    //        of the line that is tangential to path at the point p that is
    //        going in the same direction as the line at point p.
    var theta = Math.atan2(pointInfo.ty, pointInfo.tx);

    //     6. Rotate the shape described by glyph clockwise by θ about the
    //        point that is at the dx coordinate horizontally and the zero
    //        coordinate vertically.
    //     7. Let (x, y) be the coordinate of the point p.
    //     8. Move the shape described by glyph to the right by x and down by
    //        y.
    // This operations must be run in reverse order.

    vg.translate(pointInfo.x, pointInfo.y);
    vg.rotate(theta * 180 / Math.PI);
    vg.translate(-hCenter, renderInfo.anchor.y);
    vg.scale(size * renderInfo.scaleX, -size);

    //     9. Let glyph subpaths be a list of subpaths describing the shape
    //        given in glyph, with each CSS pixel in the coordinate space of
    //        glyph mapped to one coordinate space unit in glyph subpaths.
    //        Subpaths in glyph subpaths must wind clockwise, regardless of
    //        how the user agent's font subsystem renders fonts and
    //        regardless of how the fonts themselves are defined.
    // Nothing to do here (maybe?)

    //    10. If the method is addPathByStrokingText(), replace glyph
    //        subpaths by the result of tracing glyph subpaths, using the
    //        CanvasDrawingStyles object argument for the line styles.
    // Nothing to do here (no support for addPathByStrokingText for now)

    //    11. Transform all the coordinates and lines in glyph subpaths by
    //        the transformation matrix transform, if it is not null.
    // See 9. below

    //    12. Let (xfinal, yfinal) be the last point in the last subpath of
    //        glyph subpaths. (This coordinate is only used if this is the
    //        last glyph processed.)
    // TODO Complement loading so that this point is stored

    //    13. Add all the subpaths in glyph subpaths to target.
    vg.transformPath(textPath, typeface.glyphs[glyph]);
  });

  // 9. Create a new subpath in the Path object with (xfinal, yfinal) as the
  //    only point in the subpath.
  // TODO Complement loading so that this point is stored (same as 8.12)

  // self.addVGPath(textPath, transform.vgScale(1.0, -1.0));
  // This is the actual 8.11 step.
  self.addVGPath(textPath, transform);
  vg.destroyPath(path);

  vg.loadMatrix(currentMatrix);
};

Path.prototype.addText = function (text, styles, transform, x, y, maxWidth) {
  if (typeof x === 'object')
    this.addTextOnPath(text, styles, transform, x, y);
  else
    this.addTextOnPosition(text, styles, transform, x, y, maxWidth);
};
