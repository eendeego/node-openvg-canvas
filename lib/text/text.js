var text = module.exports;

var util = require('util');

var loading = require('./loading');

// The following code is based from
// https://github.com/LearnBoost/node-canvas/blob/master/lib/context2d.js

var knownFamilies = {
  'sans-serif' : '/usr/share/fonts/truetype/ttf-dejavu/DejaVuSans.ttf',
  'serif' : '/usr/share/fonts/truetype/ttf-dejavu/DejaVuSerif.ttf',
  'mono' : '/usr/share/fonts/truetype/ttf-dejavu/DejaVuSansMono.ttf',
  'sans-serif-bold' : '/usr/share/fonts/truetype/ttf-dejavu/DejaVuSans-Bold.ttf',
  'serif-bold' : '/usr/share/fonts/truetype/ttf-dejavu/DejaVuSerif-Bold.ttf',
  'mono-bold' : '/usr/share/fonts/truetype/ttf-dejavu/DejaVuSansMono-Bold.ttf'
};

/**
 * Cache string values.
 */

var cache = {};

/**
 * Font RegExp helpers.
 */

var weights = 'normal|bold|bolder|lighter|[1-9]00'
  , styles = 'normal|italic|oblique'
  , units = 'px|pt|pc|in|cm|mm|%'
  , string = '\'([^\']+)\'|"([^"]+)"|[\\w-]+';

/**
 * Font parser RegExp;
 */

var fontre = new RegExp('^ *'
  + '(?:(' + weights + ') *)?'
  + '(?:(' + styles + ') *)?'
  + '([\\d\\.]+)(' + units + ') *'
  + '((?:' + string + ')( *, *(?:' + string + '))*)'
  );

/**
 * Parse font `str`.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

var parseFont = text.parseFont = function(str) {
  var font
    , captures = fontre.exec(str);

  // Invalid
  if (!captures) return;

  // Cached
  if (cache[str]) return cache[str];

  // Populate font object
  font = {
    weight : captures[1] || 'normal',
    style : captures[2] || 'normal',
    specifiedSize : parseFloat(captures[3]),
    size : null,
    unit : captures[4],
    family : captures[5].replace(/["']/g, ''),
    typeface : null
  };

  // TODO: dpi
  // TODO: remaining unit conversion
  switch (font.unit) {
    case 'px':
      font.size = font.specifiedSize;
      break;
    case 'pt':
      font.size = font.specifiedSize / .75;
      break;
    case 'in':
      font.size = font.specifiedSize * 96;
      break;
    case 'mm':
      font.size = font.specifiedSize * 96.0 / 25.4;
      break;
    case 'cm':
      font.size = font.specifiedSize * 96.0 / 2.54;
      break;
  }

  return cache[str] = font;
};

var loadTypeface = text.loadTypeface = function(font, callback) {
  if (font.face) {
    callback(undefined, font.face);
    return
  }

  var filename = knownFamilies[font.family + '-' + font.weight];
  if (!filename) {
    filename = knownFamilies[font.family];
  }
  if (!filename) {
    filename = knownFamilies['sans-serif'];
  }

  loading.loadFontFileSync(filename, callback);
};

var serialize = text.serialize = function(parsedFont) {
  var result = '';

  // This function must conform to:
  // http://dev.w3.org/csswg/cssom/#serializing-css-values

  // Default font is: "normal-weight 10px sans-serif" as per
  // http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#text-styles

  if(parsedFont.style !== 'normal') {
    result += parsedFont.style + ' ';
  }

  // http://www.w3.org/TR/css3-fonts/#font-weight-prop
  if(parsedFont.weight !== 'normal' && parsedFont.weight !== 400) {
    result += parsedFont.weight + ' ';
  }

  result += parsedFont.specifiedSize + parsedFont.unit;
  result += ' ' + parsedFont.family;

  return result;
};
