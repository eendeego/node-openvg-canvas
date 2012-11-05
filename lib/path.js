/*jslint indent: 2, node: true */
"use strict";

var vg = require('openvg');

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
    this.ensurePathSegmentCapacity(path.segmentsPos);
    this.segments.set(path.segments.subarray(0, path.segmentsPos));
    this.segmentsPos = path.segmentsPos;

    this.ensurePathDataCapacity(path.dataPos);
    this.data.set(path.data.subarray(0, path.dataPos));
    this.dataPos = path.dataPos;

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
  if (this.rendered) return;

  vg.appendPathData(this.vgPath,
                    this.segmentsPos,
                    this.segments,
                    this.data);

  this.rendered = true;
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
  this.ensurePathSegmentCapacity(this.segmentsPos + 1 /* MOVE_TO */ + 2 /* maximum arcs */);
  this.ensurePathDataCapacity(this.dataPos + 2 /* MOVE_TO */ + 2 * 5 /* maximum arcs */);

  var px, py;
  function rotateP(angle) {
    var tx = px * Math.cos(angle) - py * Math.sin(angle);
    py = px * Math.sin(angle) + py * Math.cos(angle);
    px = tx;
  }

  px = radiusX * Math.cos(startAngle);
  py = radiusY * Math.sin(startAngle);

  rotateP(rotation);
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
  this.segments[this.segmentsPos++] = vg.VGPathCommand.VG_MOVE_TO_ABS;
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
      rotateP(rotation);
      addArc(vg.VGPathCommand.VG_SCWARC_TO_ABS);
      angle -= 2 * Math.PI;
    }
    px = radiusX * Math.cos(endAngle);
    py = radiusY * Math.sin(endAngle);
    rotateP(rotation);
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
      rotateP(rotation);
      addArc(vg.VGPathCommand.VG_SCCWARC_TO_ABS);
      angle += 2 * Math.PI;
    }
    px = radiusX * Math.cos(endAngle);
    py = radiusY * Math.sin(endAngle);
    rotateP(rotation);
    addArc(vg.VGPathCommand.VG_SCCWARC_TO_ABS);
  }
};
