#!/usr/bin/env node

var util = require('util');

var test = require("tap").test;

var FreeImage = null;

try {
  FreeImage = require(__dirname + "/../../build/Release/freeimage").FreeImage;
} catch(exception) {
  test = function (name) {
    console.log('Skipping %s on this platform.', name);
  };
  // Don't run any tests
  return;
}

test("loading an image from a buffer", function (t) {
  var xpm = [
    '/* XPM */',
    'static char * XFACE[] = {',
    '/* <Values> */',
    '/* <width/cols> <height/rows> <colors> <char on pixel>*/',
    '"5 1 5 1",',
    '/* <Colors> */',
    '"W c #ffffff",',
    '"B c #000000",',
    '"r c #ff0000",',
    '"g c #00ff00",',
    '"b c #0000ff",',
    '/* <Pixels> */',
    '"WBrgb",',
    '};'
  ].join('\n');

  var imageBuffer = new Buffer(xpm);

  var image = FreeImage.loadFromMemory(imageBuffer);
  image = image.convertTo32Bits();

  t.equal(image.buffer.readUInt32LE( 0), 0xffffffff);
  t.equal(image.buffer.readUInt32LE( 4), 0xff000000);
  t.equal(image.buffer.readUInt32LE( 8), 0xffff0000);
  t.equal(image.buffer.readUInt32LE(12), 0xff00ff00);
  t.equal(image.buffer.readUInt32LE(16), 0xff0000ff);

  t.end()
});
