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

  console.log('Allocating array with size: ' + newLength);

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
  // lots of math missing here ...
  // vg.appendPathData(this.vgPath, 1, new Uint8Array([vg.VGPathCommand.VG_LCARC_TO]),
  //                   new Float32Array([radiusX, radiusY, rotation * 180 / Math.PI, x2, y2]));
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
  var start  = startAngle * 180 / Math.PI;
  var extent = (endAngle - startAngle) * 180 / Math.PI;
  if (anticlockwise) { extent -= 360; }
  // rotation ignored
  // this.ensurePathSegmentCapacity(this.segmentsPos + 1);
  // this.ensurePathDataCapacity(this.dataPos + 1);
  vg.vgu.arc(this.vgPath, x, y, radiusX * 2, radiusY * 2,
             startAngle * 180 / Math.PI, (endAngle - startAngle) * 180 / Math.PI,
             vg.VGUArcType.VGU_ARC_OPEN);
};
