/*jslint indent: 2, node: true */
"use strict";

var color = module.exports;

// This array was originaly found at
// https://github.com/LearnBoost/node-canvas/blob/master/src/color.cc
var namedColors = {
  transparent : 0x000000,
  aliceblue : 0xF0F8FF,
  antiquewhite : 0xFAEBD7,
  aqua : 0x00FFFF,
  aquamarine : 0x7FFFD4,
  azure : 0xF0FFFF,
  beige : 0xF5F5DC,
  bisque : 0xFFE4C4,
  black : 0x000000,
  blanchedalmond : 0xFFEBCD,
  blue : 0x0000FF,
  blueviolet : 0x8A2BE2,
  brown : 0xA52A2A,
  burlywood : 0xDEB887,
  cadetblue : 0x5F9EA0,
  chartreuse : 0x7FFF00,
  chocolate : 0xD2691E,
  coral : 0xFF7F50,
  cornflowerblue : 0x6495ED,
  cornsilk : 0xFFF8DC,
  crimson : 0xDC143C,
  cyan : 0x00FFFF,
  darkblue : 0x00008B,
  darkcyan : 0x008B8B,
  darkgoldenrod : 0xB8860B,
  darkgray : 0xA9A9A9,
  darkgreen : 0x006400,
  darkgrey : 0xA9A9A9,
  darkkhaki : 0xBDB76B,
  darkmagenta : 0x8B008B,
  darkolivegreen : 0x556B2F,
  darkorange : 0xFF8C00,
  darkorchid : 0x9932CC,
  darkred : 0x8B0000,
  darksalmon : 0xE9967A,
  darkseagreen : 0x8FBC8F,
  darkslateblue : 0x483D8B,
  darkslategray : 0x2F4F4F,
  darkslategrey : 0x2F4F4F,
  darkturquoise : 0x00CED1,
  darkviolet : 0x9400D3,
  deeppink : 0xFF1493,
  deepskyblue : 0x00BFFF,
  dimgray : 0x696969,
  dimgrey : 0x696969,
  dodgerblue : 0x1E90FF,
  firebrick : 0xB22222,
  floralwhite : 0xFFFAF0,
  forestgreen : 0x228B22,
  fuchsia : 0xFF00FF,
  gainsboro : 0xDCDCDC,
  ghostwhite : 0xF8F8FF,
  gold : 0xFFD700,
  goldenrod : 0xDAA520,
  gray : 0x808080,
  green : 0x008000,
  greenyellow : 0xADFF2F,
  grey : 0x808080,
  honeydew : 0xF0FFF0,
  hotpink : 0xFF69B4,
  indianred : 0xCD5C5C,
  indigo : 0x4B0082,
  ivory : 0xFFFFF0,
  khaki : 0xF0E68C,
  lavender : 0xE6E6FA,
  lavenderblush : 0xFFF0F5,
  lawngreen : 0x7CFC00,
  lemonchiffon : 0xFFFACD,
  lightblue : 0xADD8E6,
  lightcoral : 0xF08080,
  lightcyan : 0xE0FFFF,
  lightgoldenrodyellow : 0xFAFAD2,
  lightgray : 0xD3D3D3,
  lightgreen : 0x90EE90,
  lightgrey : 0xD3D3D3,
  lightpink : 0xFFB6C1,
  lightsalmon : 0xFFA07A,
  lightseagreen : 0x20B2AA,
  lightskyblue : 0x87CEFA,
  lightslategray : 0x778899,
  lightslategrey : 0x778899,
  lightsteelblue : 0xB0C4DE,
  lightyellow : 0xFFFFE0,
  lime : 0x00FF00,
  limegreen : 0x32CD32,
  linen : 0xFAF0E6,
  magenta : 0xFF00FF,
  maroon : 0x800000,
  mediumaquamarine : 0x66CDAA,
  mediumblue : 0x0000CD,
  mediumorchid : 0xBA55D3,
  mediumpurple : 0x9370DB,
  mediumseagreen : 0x3CB371,
  mediumslateblue : 0x7B68EE,
  mediumspringgreen : 0x00FA9A,
  mediumturquoise : 0x48D1CC,
  mediumvioletred : 0xC71585,
  midnightblue : 0x191970,
  mintcream : 0xF5FFFA,
  mistyrose : 0xFFE4E1,
  moccasin : 0xFFE4B5,
  navajowhite : 0xFFDEAD,
  navy : 0x000080,
  oldlace : 0xFDF5E6,
  olive : 0x808000,
  olivedrab : 0x6B8E23,
  orange : 0xFFA500,
  orangered : 0xFF4500,
  orchid : 0xDA70D6,
  palegoldenrod : 0xEEE8AA,
  palegreen : 0x98FB98,
  paleturquoise : 0xAFEEEE,
  palevioletred : 0xDB7093,
  papayawhip : 0xFFEFD5,
  peachpuff : 0xFFDAB9,
  peru : 0xCD853F,
  pink : 0xFFC0CB,
  plum : 0xDDA0DD,
  powderblue : 0xB0E0E6,
  purple : 0x800080,
  red : 0xFF0000,
  rosybrown : 0xBC8F8F,
  royalblue : 0x4169E1,
  saddlebrown : 0x8B4513,
  salmon : 0xFA8072,
  sandybrown : 0xF4A460,
  seagreen : 0x2E8B57,
  seashell : 0xFFF5EE,
  sienna : 0xA0522D,
  silver : 0xC0C0C0,
  skyblue : 0x87CEEB,
  slateblue : 0x6A5ACD,
  slategray : 0x708090,
  slategrey : 0x708090,
  snow : 0xFFFAFA,
  springgreen : 0x00FF7F,
  steelblue : 0x4682B4,
  tan : 0xD2B48C,
  teal : 0x008080,
  thistle : 0xD8BFD8,
  tomato : 0xFF6347,
  turquoise : 0x40E0D0,
  violet : 0xEE82EE,
  wheat : 0xF5DEB3,
  white : 0xFFFFFF,
  whitesmoke : 0xF5F5F5,
  yellow : 0xFFFF00,
  yellowgreen : 0x9ACD32
};

var namedColorValues = new Float32Array(Object.keys(namedColors).length * 4);

(function () {
  var pos = 0;
  for (var color in namedColors) {
    var rgb = namedColors[color];
    namedColors[color] = pos;
    namedColorValues[pos++] = (rgb >>> 16) / 255;
    namedColorValues[pos++] = (rgb >>> 8 & 0xff) / 255;
    namedColorValues[pos++] = (rgb & 0xff) / 255;
    namedColorValues[pos++] = 1.0;
  }
  namedColorValues[namedColors['transparent'] + 3] = 0.0;
})();

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

  if (colorString[0].charAt(colorString[0].length - 1) === '%') {
    dest[0] = parseFloat(colorString[0]) / 100;
    dest[1] = parseFloat(colorString[1]) / 100;
    dest[2] = parseFloat(colorString[2]) / 100;
  } else {
    dest[0] = parseInt(colorString[0], 10) / 255.0;
    dest[1] = parseInt(colorString[1], 10) / 255.0;
    dest[2] = parseInt(colorString[2], 10) / 255.0;
  }

  dest[3] = parseFloat(colorString[3]);
}

// TO DO: Handle percentage values (http://dev.w3.org/csswg/css3-color/#rgb-color)
function parseRGBColor(dest, colorString) {
  colorString = colorString.substr(4).split(/ *, */);

  if (colorString[0].charAt(colorString[0].length - 1) === '%') {
    dest[0] = parseFloat(colorString[0]) / 100;
    dest[1] = parseFloat(colorString[1]) / 100;
    dest[2] = parseFloat(colorString[2]) / 100;
  } else {
    dest[0] = parseInt(colorString[0], 10) / 255.0;
    dest[1] = parseInt(colorString[1], 10) / 255.0;
    dest[2] = parseInt(colorString[2], 10) / 255.0;
  }

  dest[3] = 1.0;
}

// http://dev.w3.org/csswg/css3-color/#hsl-color
function hsl2RGB(dest, h, s, l) {
  if (h < 0) {
    h = (((h % 360) + 360) % 360);
  } else if (h >= 360) {
    h = h % 360;
  }

  var c = (1 - (l > 0.5 ? 2 * l - 1 : 1 - 2 * l)) * s;
  var hh = h / 60;
  var x = c * (1 - Math.abs(hh % 2 - 1));

  if (hh === undefined) {
    dest[0] = dest[1] = dest[2] = 0;
  } else if (hh < 1) {
    dest[0] = c;
    dest[1] = x;
    dest[2] = 0;
  } else if (hh < 2) {
    dest[0] = x;
    dest[1] = c;
    dest[2] = 0;
  } else if (hh < 3) {
    dest[0] = 0;
    dest[1] = c;
    dest[2] = x;
  } else if (hh < 4) {
    dest[0] = 0;
    dest[1] = x;
    dest[2] = c;
  } else if (hh < 5) {
    dest[0] = x;
    dest[1] = 0;
    dest[2] = c;
  } else {
    dest[0] = c;
    dest[1] = 0;
    dest[2] = x;
  }

  var m = l - c * 0.5;
  dest[0] += m;
  dest[1] += m;
  dest[2] += m;
}

function parseHSLAColor(dest, colorString) {
  colorString = colorString.substr(5).split(/ *, */);
  var h = parseFloat(colorString[0]);
  var s = parseFloat(colorString[1]) * 0.01;
  var l = parseFloat(colorString[2]) * 0.01;

  hsl2RGB(dest, h, s, l);

  dest[3] = parseFloat(colorString[3]);
}

function parseHSLColor(dest, colorString) {
  colorString = colorString.substr(4).split(/ *, */);
  var h = parseFloat(colorString[0]);
  var s = parseFloat(colorString[1]) * 0.01;
  var l = parseFloat(colorString[2]) * 0.01;

  hsl2RGB(dest, h, s, l);

  dest[3] = 1.0;
}

function namedColor(dest, colorString) {
  var pos = namedColors[colorString];
  if (pos !== undefined) {
    dest[0] = namedColorValues[pos++];
    dest[1] = namedColorValues[pos++];
    dest[2] = namedColorValues[pos++];
    dest[3] = namedColorValues[pos];
  } else {
    dest[0] = dest[1] = dest[2] = dest[3] = NaN;
  }
}

var parseColor = color.parseColor = function (dest, colorString) {
  if (colorString.charAt(0) === '#') {
    return parseHexColor(dest, colorString);
  } else if (colorString.indexOf('rgba(') === 0) {
    return parseRGBAColor(dest, colorString);
  } else if (colorString.indexOf('rgb(') === 0) {
    return parseRGBColor(dest, colorString);
  } else if (colorString.indexOf('hsla(') === 0) {
    return parseHSLAColor(dest, colorString);
  } else if (colorString.indexOf('hsl(') === 0) {
    return parseHSLColor(dest, colorString);
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
