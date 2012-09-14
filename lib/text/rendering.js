var rendering = module.exports;

var vg = require('openvg');

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

// Text renders a string of text at a specified location, size, using the specified font glyphs
// derived from http://web.archive.org/web/20070808195131/http://developer.hybrid.fi/font2openvg/renderFont.cpp.txt
var renderText = rendering.renderText = function(x, y, text, font, pointSize, paintMode) {
  var size = pointSize, xx = x, mm = new Float32Array(9);

  vg.getMatrix(mm);

  for (var i = 0; i < text.length; i++) {
    var character = text.charCodeAt(i);
    var glyph = font.characterMap[character];
    if (glyph < 0 || glyph === undefined) {
      continue;  //glyph is undefined
    }

    var mat = new Float32Array([
      size,      0.0, 0.0,
       0.0,   - size, 0.0,
        xx, y + size, 1.0
    ]);
    vg.loadMatrix(mm);
    vg.multMatrix(mat);
    vg.drawPath(font.glyphs[glyph], paintMode);
    xx += size * font.glyphAdvances[glyph] / 65536.0;
  }

  vg.loadMatrix(mm);
}
