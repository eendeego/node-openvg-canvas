/*jslint indent: 2, node: true */
"use strict";

var matrix = module.exports;

var create = matrix.create = function () {
  return new Float32Array(9);
};

var m = matrix.m = function (a, b, c, d, e, f, g, h, i) {
  return new Float32Array([a, b, c, d, e, f, g, h, i]);
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
