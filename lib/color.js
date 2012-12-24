/*jslint indent: 2, node: true */
"use strict";

var util = require('util');
var Canvas = require('./canvas');

var color = module.exports;

var namedColors = {
  transparent : 0xFFFFFF00,
  aliceblue : 0xF0F8FFFF,
  antiquewhite : 0xFAEBD7FF,
  aqua : 0x00FFFFFF,
  aquamarine : 0x7FFFD4FF,
  azure : 0xF0FFFFFF,
  beige : 0xF5F5DCFF,
  bisque : 0xFFE4C4FF,
  black : 0x000000FF,
  blanchedalmond : 0xFFEBCDFF,
  blue : 0x0000FFFF,
  blueviolet : 0x8A2BE2FF,
  brown : 0xA52A2AFF,
  burlywood : 0xDEB887FF,
  cadetblue : 0x5F9EA0FF,
  chartreuse : 0x7FFF00FF,
  chocolate : 0xD2691EFF,
  coral : 0xFF7F50FF,
  cornflowerblue : 0x6495EDFF,
  cornsilk : 0xFFF8DCFF,
  crimson : 0xDC143CFF,
  cyan : 0x00FFFFFF,
  darkblue : 0x00008BFF,
  darkcyan : 0x008B8BFF,
  darkgoldenrod : 0xB8860BFF,
  darkgray : 0xA9A9A9FF,
  darkgreen : 0x006400FF,
  darkgrey : 0xA9A9A9FF,
  darkkhaki : 0xBDB76BFF,
  darkmagenta : 0x8B008BFF,
  darkolivegreen : 0x556B2FFF,
  darkorange : 0xFF8C00FF,
  darkorchid : 0x9932CCFF,
  darkred : 0x8B0000FF,
  darksalmon : 0xE9967AFF,
  darkseagreen : 0x8FBC8FFF,
  darkslateblue : 0x483D8BFF,
  darkslategray : 0x2F4F4FFF,
  darkslategrey : 0x2F4F4FFF,
  darkturquoise : 0x00CED1FF,
  darkviolet : 0x9400D3FF,
  deeppink : 0xFF1493FF,
  deepskyblue : 0x00BFFFFF,
  dimgray : 0x696969FF,
  dimgrey : 0x696969FF,
  dodgerblue : 0x1E90FFFF,
  firebrick : 0xB22222FF,
  floralwhite : 0xFFFAF0FF,
  forestgreen : 0x228B22FF,
  fuchsia : 0xFF00FFFF,
  gainsboro : 0xDCDCDCFF,
  ghostwhite : 0xF8F8FFFF,
  gold : 0xFFD700FF,
  goldenrod : 0xDAA520FF,
  gray : 0x808080FF,
  green : 0x008000FF,
  greenyellow : 0xADFF2FFF,
  grey : 0x808080FF,
  honeydew : 0xF0FFF0FF,
  hotpink : 0xFF69B4FF,
  indianred : 0xCD5C5CFF,
  indigo : 0x4B0082FF,
  ivory : 0xFFFFF0FF,
  khaki : 0xF0E68CFF,
  lavender : 0xE6E6FAFF,
  lavenderblush : 0xFFF0F5FF,
  lawngreen : 0x7CFC00FF,
  lemonchiffon : 0xFFFACDFF,
  lightblue : 0xADD8E6FF,
  lightcoral : 0xF08080FF,
  lightcyan : 0xE0FFFFFF,
  lightgoldenrodyellow : 0xFAFAD2FF,
  lightgray : 0xD3D3D3FF,
  lightgreen : 0x90EE90FF,
  lightgrey : 0xD3D3D3FF,
  lightpink : 0xFFB6C1FF,
  lightsalmon : 0xFFA07AFF,
  lightseagreen : 0x20B2AAFF,
  lightskyblue : 0x87CEFAFF,
  lightslategray : 0x778899FF,
  lightslategrey : 0x778899FF,
  lightsteelblue : 0xB0C4DEFF,
  lightyellow : 0xFFFFE0FF,
  lime : 0x00FF00FF,
  limegreen : 0x32CD32FF,
  linen : 0xFAF0E6FF,
  magenta : 0xFF00FFFF,
  maroon : 0x800000FF,
  mediumaquamarine : 0x66CDAAFF,
  mediumblue : 0x0000CDFF,
  mediumorchid : 0xBA55D3FF,
  mediumpurple : 0x9370DBFF,
  mediumseagreen : 0x3CB371FF,
  mediumslateblue : 0x7B68EEFF,
  mediumspringgreen : 0x00FA9AFF,
  mediumturquoise : 0x48D1CCFF,
  mediumvioletred : 0xC71585FF,
  midnightblue : 0x191970FF,
  mintcream : 0xF5FFFAFF,
  mistyrose : 0xFFE4E1FF,
  moccasin : 0xFFE4B5FF,
  navajowhite : 0xFFDEADFF,
  navy : 0x000080FF,
  oldlace : 0xFDF5E6FF,
  olive : 0x808000FF,
  olivedrab : 0x6B8E23FF,
  orange : 0xFFA500FF,
  orangered : 0xFF4500FF,
  orchid : 0xDA70D6FF,
  palegoldenrod : 0xEEE8AAFF,
  palegreen : 0x98FB98FF,
  paleturquoise : 0xAFEEEEFF,
  palevioletred : 0xDB7093FF,
  papayawhip : 0xFFEFD5FF,
  peachpuff : 0xFFDAB9FF,
  peru : 0xCD853FFF,
  pink : 0xFFC0CBFF,
  plum : 0xDDA0DDFF,
  powderblue : 0xB0E0E6FF,
  purple : 0x800080FF,
  red : 0xFF0000FF,
  rosybrown : 0xBC8F8FFF,
  royalblue : 0x4169E1FF,
  saddlebrown : 0x8B4513FF,
  salmon : 0xFA8072FF,
  sandybrown : 0xF4A460FF,
  seagreen : 0x2E8B57FF,
  seashell : 0xFFF5EEFF,
  sienna : 0xA0522DFF,
  silver : 0xC0C0C0FF,
  skyblue : 0x87CEEBFF,
  slateblue : 0x6A5ACDFF,
  slategray : 0x708090FF,
  slategrey : 0x708090FF,
  snow : 0xFFFAFAFF,
  springgreen : 0x00FF7FFF,
  steelblue : 0x4682B4FF,
  tan : 0xD2B48CFF,
  teal : 0x008080FF,
  thistle : 0xD8BFD8FF,
  tomato : 0xFF6347FF,
  turquoise : 0x40E0D0FF,
  violet : 0xEE82EEFF,
  wheat : 0xF5DEB3FF,
  white : 0xFFFFFFFF,
  whitesmoke : 0xF5F5F5FF,
  yellow : 0xFFFF00FF,
  yellowgreen : 0x9ACD32FF
};

function fromRGB(r, g, b, a) {
  return r << 24 | g << 16 | b << 8 | a;
}

var applyAlpha = color.applyAlpha = function (dest, vector, alpha) {
  dest[0] = vector[0];
  dest[1] = vector[1];
  dest[2] = vector[2];
  dest[3] = vector[3] * alpha;
};

function parseHexColor(dest, colorString) {
  var hexLen = 1, r, g, b;
  while (hexLen < colorString.length) {
    var c = colorString.charCodeAt(hexLen);
    if (!(c >= 48 && c <= 48 + 9) &&
        !(c >= 65 && c <= 65 + 5) &&
        !(c >= 97 && c <= 97 + 5))
      break;
    hexLen++;
  }

  if (hexLen === 7) {
    dest[0] = parseInt(colorString.substr(1, 2), 16) / 255.0;
    dest[1] = parseInt(colorString.substr(3, 2), 16) / 255.0;
    dest[2] = parseInt(colorString.substr(5, 2), 16) / 255.0;
    dest[3] = 1.0;
  } else if (hexLen === 4) {
    r = parseInt(colorString.substr(1, 1), 16);
    g = parseInt(colorString.substr(2, 1), 16);
    b = parseInt(colorString.substr(3, 1), 16);
    dest[0] = (r << 4 | r) / 255.0;
    dest[1] = (g << 4 | g) / 255.0;
    dest[2] = (b << 4 | b) / 255.0;
    dest[3] = 1.0;
  }
}

// TO DO: Handle percentage values (http://dev.w3.org/csswg/css3-color/#rgba-color)
function parseRGBAColor(dest, colorString) {
  colorString = colorString.substr(5).split(/ *, */);
  dest[0] = parseInt(colorString[0], 10) / 255.0;
  dest[1] = parseInt(colorString[1], 10) / 255.0;
  dest[2] = parseInt(colorString[2], 10) / 255.0;
  dest[3] = parseFloat(colorString[3]);
}

// TO DO: Handle percentage values (http://dev.w3.org/csswg/css3-color/#rgb-color)
function parseRGBColor(dest, colorString) {
  colorString = colorString.substr(4).split(/ *, */);
  dest[0] = parseInt(colorString[0], 10) / 255.0;
  dest[1] = parseInt(colorString[1], 10) / 255.0;
  dest[2] = parseInt(colorString[2], 10) / 255.0;
  dest[3] = 1.0;
}

function namedColor(dest, colorString) {
  var rgba = namedColors[colorString];
  dest[0] = (rgba >>> 24) / 255.0;
  dest[1] = (rgba >>> 16 & 0xff) / 255.0;
  dest[2] = (rgba >>> 8 & 0xff) / 255.0;
  dest[3] = (rgba & 0xff) / 255.0;
}

var parseColor = color.parseColor = function (dest, colorString) {
  if (colorString.charAt(0) === '#') {
    return parseHexColor(dest, colorString);
  } else if (colorString.indexOf('rgba(') === 0) {
    return parseRGBAColor(dest, colorString);
  } else if (colorString.indexOf('rgb(') === 0) {
    return parseRGBColor(dest, colorString);
  } else {
    return namedColor(dest, colorString);
  }
};

var floatToHex = color.floatToHex = function (v) {
  v = Math.floor(v * 255);
  if (v < 16) {
    return '0' + v.toString(16);
  } else {
    return v.toString(16);
  }
};

var toHexColor = color.toHexColor = function (colorArray) {
  return '#' + floatToHex(colorArray[0]) + floatToHex(colorArray[1]) +
    floatToHex(colorArray[2]);
};

var toRGBAColor = color.toRGBAColor = function (colorArray) {
  return 'rgba(' + colorArray[0] * 255 + colorArray[1] * 255 +
    colorArray[2] * 255 + ')';
};

var serialize = color.serialize = function (colorArray) {
  if (colorArray[3] === 1.0) {
    return toHexColor(colorArray);
  } else {
    return toRGBAColor(colorArray);
  }
};

var logVColor = color.logVColor = function (label, c) {
  if (!c) {
    c = label;
    label = 'Color';
  }
  console.log(label + ': [' + c[0] + ', ' + c[1] + ', ' + c[2] + ', ' + c[3] + ']');
};
