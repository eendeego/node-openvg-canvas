/*jslint indent: 2, node: true */
"use strict";

var freetype = module.exports = require('../../build/Release/freetype.node');

freetype.LOAD_DEFAULT                      = 0x0;
freetype.LOAD_NO_SCALE                     = 1 <<  0;
freetype.LOAD_NO_HINTING                   = 1 <<  1;
freetype.LOAD_RENDER                       = 1 <<  2;
freetype.LOAD_NO_BITMAP                    = 1 <<  3;
freetype.LOAD_VERTICAL_LAYOUT              = 1 <<  4;
freetype.LOAD_FORCE_AUTOHINT               = 1 <<  5;
freetype.LOAD_CROP_BITMAP                  = 1 <<  6;
freetype.LOAD_PEDANTIC                     = 1 <<  7;
freetype.LOAD_IGNORE_GLOBAL_ADVANCE_WIDTH  = 1 <<  9;
freetype.LOAD_NO_RECURSE                   = 1 << 10;
freetype.LOAD_IGNORE_TRANSFORM             = 1 << 11;
freetype.LOAD_MONOCHROME                   = 1 << 12;
freetype.LOAD_LINEAR_DESIGN                = 1 << 13;
freetype.LOAD_NO_AUTOHINT                  = 1 << 15;

/* used internally only by certain font drivers! */
freetype.LOAD_ADVANCE_ONLY                 = 1 <<  8;
freetype.LOAD_SBITS_ONLY                   = 1 << 14;

var library = freetype.library = freetype.initFreeType();

function done() {
  freetype.doneFreeType(library);
}
process.on('exit', done);
