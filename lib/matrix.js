/*jslint indent: 2, node: true */
"use strict";

var matrix = module.exports;

var create = matrix.create = function () {
  return new Float32Array(9);
};

var m = matrix.m = function (a, b, c, d, e, f, g, h, k) {
  var r = new Float32Array(9);
  r[0] = a; r[1] = b; r[2] = c;
  r[3] = d; r[4] = e; r[5] = f;
  r[6] = g; r[7] = h; r[8] = k;
  return r;
};

var logMatrix = matrix.log = function (label, m) {
  if (!m) {
    m = label;
    label = 'M';
  }

  var maxLen = 0;
  var nums = new Array(9);
  for (var i = 0; i < 9; i++) {
    nums[i] = m[i].toString();
    if (nums[i].length > maxLen) {
      maxLen = nums[i].length;
    }
  }

  var padSpaces = '                    ';
  while (padSpaces.length < label.length) { padSpaces += padSpaces; }

  function pad(text) {
    return padSpaces.substr(0, maxLen - text.length) + text;
  }

  function padL(text) {
    return padSpaces.substr(0, text.length);
  }

  console.log(     label  + ': ⎡' + pad(nums[0]) + ' , ' + pad(nums[1]) + ' , ' + pad(nums[2]) + '⎤');
  console.log(padL(label) + '  ⎢' + pad(nums[3]) + ' , ' + pad(nums[4]) + ' , ' + pad(nums[5]) + '⎥');
  console.log(padL(label) + '  ⎣' + pad(nums[6]) + ' , ' + pad(nums[7]) + ' , ' + pad(nums[8]) + '⎦');

  return m;
};

var SVGMatrix = matrix.SVGMatrix = function (m) {
  this.m = m || matrix.m(1, 0, 0, 0, 1, 0, 0, 0, 1);
};

SVGMatrix.prototype.getComponent = function (index) {
  var tMap = [0, 1, 3, 4, 6, 7];
  // TO DO: Raise exception if index < 0 || index > 5
  return this.m[tMap[index]];
};

SVGMatrix.prototype.mMultiplyF = function (o0, o1, o2, o3, o4, o5, o6, o7, o8) {
  var m = this.m, m0, m1, m2, m3, m4, m5, m6, m7, m8;

  m0 = m[0] * o0 + m[1] * o3 + m[2] * o6;
  m1 = m[0] * o1 + m[1] * o4 + m[2] * o7;
  m2 = m[0] * o2 + m[1] * o5 + m[2] * o8;

  m3 = m[3] * o0 + m[4] * o3 + m[5] * o6;
  m4 = m[3] * o1 + m[4] * o4 + m[5] * o7;
  m5 = m[3] * o2 + m[4] * o5 + m[5] * o8;

  m6 = m[6] * o0 + m[7] * o3 + m[8] * o6;
  m7 = m[6] * o1 + m[7] * o4 + m[8] * o7;
  m8 = m[6] * o2 + m[7] * o5 + m[8] * o8;

  m[0] = m0; m[1] = m1; m[2] = m2;
  m[3] = m3; m[4] = m4; m[5] = m5;
  m[6] = m6; m[7] = m7; m[8] = m8;

  return this;
};

SVGMatrix.prototype.mMultiply = function (secondMatrix) {
  var m = secondMatrix.m, a = m[0], b = m[1], c = m[2], d = m[3], e = m[4], f = m[5], g = m[6], h = m[7], k = m[8];
  return this.mMultiply(a, b, c, d, e, f, g, h, k);
};

SVGMatrix.prototype.inverse = function () {
  var m = this.m, a = m[0], b = m[1], c = m[2], d = m[3], e = m[4], f = m[5], g = m[6], h = m[7], k = m[8];
  var det = a * (e * k - f * h) - b * (d * k - f * g) + c * (d * h - e * g);
  // TO DO: Raise exception if det === 0
  return new SVGMatrix(matrix.m(
    a / det, d / det, g / det,
    b / det, e / det, h / det,
    c / det, f / det, k / det
  ));
};

SVGMatrix.prototype.mTranslate = function (x, y) {
  return this.mMultiplyF(1, 0, 0, 0, 1, 0, x, y, 1);
};

SVGMatrix.prototype.mScale = function (scaleFactor) {
  return this.mMultiplyF(scaleFactor, 0, 0, 0, scaleFactor, 0, 0, 0, 1);
};

SVGMatrix.prototype.mRotate = function (angle) {
  var sin = Math.sin(angle);
  var cos = Math.cos(angle);

  return this.mMultiplyF(cos, -sin, 0, sin, cos, 0, 0, 0, 1);
};
