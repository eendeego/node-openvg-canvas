var domain = require('domain');

var fs   = require('fs');
var util = require('util');

var vg = require('openvg');
var ft = require('./freetype');

var loading = module.exports;

var MAX_FONT_PATH = 255;
var MAX_PRELOADED_CHARACTER = 255;

var fontDomain = domain.create();
fontDomain.on('error', function(err) {
  console.error('Error on freetype font loading:\n' +
                err.message + '\n' +
                err.stack);
});

var loadFontFile = loading.loadFontFile = function(name, callback) {
  fs.readFile(name, 'binary', fontDomain.bind(function(err, data) {
    if(err) {
      callback(err);
    } else {
      loadFont(new Buffer(data, 'binary'), callback);
    }
  }));
};

var loadFontFileSync = loading.loadFontFileSync = function(name, callback) {
  data = fs.readFileSync(name, 'binary');
  loadFont(new Buffer(data, 'binary'), callback);
};

function add(a, b) {
  return { x: a.x + b.x, y: a.y + b.y };
}
function mult(a, b) {
  return { x: a.x * b, y: a.y * b };
}
function scaleIn(x) {
  return x / 4096.0;
}

function scaleInVector(v) {
  return { x: scaleIn(v.x), y: scaleIn(v.y) };
}

function toVector(array, index) {
  return { x: array[index*2], y: array[index*2 + 1] };
}

function scaleOut(v) {
  return Math.floor(65536.0 * v);
}

function pushPoint(array, point) {
  array.push(scaleOut(point.x));
  array.push(scaleOut(point.y));
}

function isOn(b) {
  return b & 1;
}

function dumpArray(a, limit) {
  if(a === undefined) return "undefined";
  if(a === null) return "null";
  if(a.length === 0) return "[]";

  if(limit === undefined) limit = a.length;

  var result = "[ " + a[0];
  for(var i = 1; i < limit; i++) {
    result += ", " + a[i];
  }
  return result + "]";
}

// derived from http://web.archive.org/web/20070808195154/http://developer.hybrid.fi/font2openvg/font2openvg.cpp.txt
var loadFont = loading.loadFont = function(fontBuffer, callback) {
  var f = {
    glyphs: new Uint32Array(MAX_FONT_PATH),
    characterMap: null,
    glyphAdvances: [],
    count: -1
  };

  var faceIndex = 0;

  var face = ft.newMemoryFace(ft.library, fontBuffer, faceIndex);

  ft.setCharSize(face, 0, 64*64, 96, 96);

  var gpvecindices = [];
  var givecindices = [];
  var gpvecsizes = [];
  var givecsizes = [];
  var gpvec = [];
  var givec = [];
  var gbbox = [];

  f.characterMap = new Array(MAX_PRELOADED_CHARACTER + 1);
  var glyphs = 0;
  for(var cc = 0; cc <= MAX_PRELOADED_CHARACTER; cc++) {
    f.characterMap[cc] = -1; // initially nonexistent

    if (cc < 32) continue; // discard the first 32 characters

    var glyphIndex = ft.getCharIndex(face, cc);

    ft.loadGlyph(face,
                 glyphIndex,
                 ft.LOAD_NO_BITMAP | ft.LOAD_NO_HINTING | ft.LOAD_IGNORE_TRANSFORM);

    var path = vg.createPath(vg.VG_PATH_FORMAT_STANDARD,
                             vg.VGPathDatatype.VG_PATH_DATATYPE_S_32,
                             1.0 / 65536.0, 0.0, 0, 0,
                             vg.VGPathCapabilities.VG_PATH_CAPABILITY_ALL);
    f.glyphs[glyphs] = path;
    f.characterMap[cc] = glyphs++;

    f.glyphAdvances.push(scaleOut(scaleIn(face.glyph.advance.x)));

    var outline = face.glyph.outline;
    if (cc == 32) {
      gpvecindices.push(gpvec.length);
      givecindices.push(givec.length);

      gpvecsizes.push(0);
      givecsizes.push(0);

      gbbox.push(0);
      gbbox.push(0);
      gbbox.push(0);
      gbbox.push(0);

      continue;
    }

    var outline = face.glyph.outline;
    var pvec = [];
    var ivec = [];
    var minx = 10000000.0, miny = 100000000.0, maxx = -10000000.0, maxy = -10000000.0;
    var s = 0, e;
    var on;
    var last, v, nv;
    for(var con=0; con < outline.nContours; ++con) {
      var pnts = 1;
      e = outline.contours[con]+1;
      last = scaleInVector(toVector(outline.points,s));

      // read the contour start point
      ivec.push(vg.VGPathCommand.VG_MOVE_TO_ABS);
      pushPoint(pvec, last);

      var i = s + 1;
      while (i <= e) {
        var c = (i == e) ? s : i;
        var n = (i == e - 1) ? s : (i + 1);
        v = scaleInVector(toVector(outline.points,c));
        on = isOn(outline.tags[c]);
        if (on) { // line
          ++i;
          ivec.push(vg.VGPathCommand.VG_LINE_TO_ABS);
          pushPoint(pvec, v);
          pnts += 1;
        } else { // spline
          if (isOn(outline.tags[n])) { // next on
            nv = scaleInVector(toVector(outline.points, n));
            i += 2;
          } else { // next off, use middle point
            nv = mult(add(v, scaleInVector(toVector(outline.points, n))), 0.5);
            ++i;
          }
          ivec.push(vg.VGPathCommand.VG_QUAD_TO_ABS);
          pushPoint(pvec, v);
          pushPoint(pvec, nv);
          pnts += 2;
        }
        last = nv;
      }
      ivec.push(vg.VGPathSegment.VG_CLOSE_PATH);
      s = e;
    }

    for(var i=0; i < pvec.length/2; ++i) {
       if (pvec[i*2    ] < minx) minx = pvec[i * 2    ];
       if (pvec[i*2    ] > maxx) maxx = pvec[i * 2    ];
       if (pvec[i*2 + 1] < miny) miny = pvec[i * 2 + 1];
       if (pvec[i*2 + 1] > maxy) maxy = pvec[i * 2 + 1];
    }
    if(!pvec.length) {
       minx = 0.0;
       miny = 0.0;
       maxx = 0.0;
       maxy = 0.0;
    }

    gpvecindices.push(gpvec.length);
    givecindices.push(givec.length);

    gpvecsizes.push(pvec.length);
    givecsizes.push(ivec.length);

    gbbox.push(minx);
    gbbox.push(miny);
    gbbox.push(maxx);
    gbbox.push(maxy);

    gpvec = gpvec.concat(pvec);
    givec = givec.concat(ivec);
  };

  f.count = glyphs;

  var glyphPoints = new Int32Array(gpvec);
  var glyphInstructions = new Uint8Array(givec);

  for (var i = 0; i < glyphs; i++) {
    var instructions      = glyphInstructions.subarray(givecindices[i]);
    var instructionCounts = givecsizes[i];

    if (instructionCounts) {
      var path = f.glyphs[i];
      var offset = gpvecindices[i];
      var points = glyphPoints.subarray(offset);

      vg.appendPathData(path, instructionCounts, instructions, points);
    }
  }

  if (callback) {
    callback(undefined, f);
  }
};

// unloadfont frees font path data
var unloadFont = loading.unloadFont = function(f) {
  for (var i = 0; i < f.glyphs.length; i++) {
    openVG.destroyPath(f.glyphs[i]);
  }
}
