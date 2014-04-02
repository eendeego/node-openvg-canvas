#!/usr/bin/env node

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

test("converting from rgba bits", function (t) {
  var pixmap = new Uint8Array([0xff, 0xff, 0xff, 0xff,
                               0xff, 0x00, 0x00, 0x00,
                               0xff, 0x00, 0x00, 0xff,
                               0xff, 0x00, 0xff, 0x00,
                               0xff, 0xff, 0x00, 0x00,
                               0xff, 0xff, 0xff, 0xff,
                               0xff, 0x00, 0x00, 0x00,
                               0xff, 0x00, 0x00, 0xff,
                               0xff, 0x00, 0xff, 0x00,
                               0xff, 0xff, 0x00, 0x00]);

  var imageBuffer = new Buffer(pixmap);

  t.equal(imageBuffer.readUInt32LE(0 * 4).toString(16), 0xffffffff.toString(16));
  t.equal(imageBuffer.readUInt32LE(1 * 4).toString(16), 0x000000ff.toString(16));
  t.equal(imageBuffer.readUInt32LE(2 * 4).toString(16), 0xff0000ff.toString(16));
  t.equal(imageBuffer.readUInt32LE(3 * 4).toString(16), 0x00ff00ff.toString(16));
  t.equal(imageBuffer.readUInt32LE(4 * 4).toString(16), 0x0000ffff.toString(16));

  // For some reason, freeimage on arm doesn't like odd widths
  var image = FreeImage.convertFromRGBABits(pixmap, 10, 1);

  t.equal(image.buffer.readUInt32LE(0 * 4).toString(16), 0xffffffff.toString(16));
  t.equal(image.buffer.readUInt32LE(1 * 4).toString(16), 0xff000000.toString(16));
  t.equal(image.buffer.readUInt32LE(2 * 4).toString(16), 0xffff0000.toString(16));
  t.equal(image.buffer.readUInt32LE(3 * 4).toString(16), 0xff00ff00.toString(16));
  t.equal(image.buffer.readUInt32LE(4 * 4).toString(16), 0xff0000ff.toString(16));

  t.end()
});
