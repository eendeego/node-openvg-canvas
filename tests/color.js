var tap   = require('tap');
var color = require('../lib/color');

tap.test('parsing rgb # colors', function(t) {
  var dest = [0.0, 0.0, 0.0, 0.0];

  color.parseColor(dest, '#000');
  t.equivalent(dest, [0.0, 0.0, 0.0, 1.0], 'Parsing black #000');

  color.parseColor(dest, '#fff');
  t.equivalent(dest, [1.0, 1.0, 1.0, 1.0], 'Parsing white #fff');

  color.parseColor(dest, '#222');
  var x = 0x22 / 255.0;
  t.equivalent(dest, [x, x, x, 1.0], 'Parsing gray #222');

  t.end();
});

tap.test('parsing rgb[a] () colors', function(t) {
  var dest = [0.0, 0.0, 0.0, 0.0];

  color.parseColor(dest, 'rgb(0,0,0)');
  t.equivalent(dest, [0.0, 0.0, 0.0, 1.0], 'Parsing black');

  color.parseColor(dest, 'rgb(255,255,255)');
  t.equivalent(dest, [1.0, 1.0, 1.0, 1.0], 'Parsing white');

  color.parseColor(dest, 'rgb(255, 128, 0)');
  t.equivalent(dest, [1.0, 128/255, 0.0, 1.0], 'Parsing orange');

  color.parseColor(dest, 'rgba(0,0,0,0.2)');
  t.equivalent(dest, [0.0, 0.0, 0.0, 0.2], 'Parsing black');

  color.parseColor(dest, 'rgba(255,255,255,0.5)');
  t.equivalent(dest, [1.0, 1.0, 1.0, 0.5], 'Parsing white');

  color.parseColor(dest, 'rgba(255, 128, 0, 0.8)');
  t.equivalent(dest, [1.0, 128/255, 0.0, 0.8], 'Parsing orange');

  t.end();
});

tap.test('parsing rgb[a] (%) colors', function(t) {
  var dest = [0.0, 0.0, 0.0, 0.0];

  color.parseColor(dest, 'rgb(0,0,0)');
  t.equivalent(dest, [0.0, 0.0, 0.0, 1.0], 'Parsing black');

  color.parseColor(dest, 'rgb(100%,100%,100%)');
  t.equivalent(dest, [1.0, 1.0, 1.0, 1.0], 'Parsing white');

  color.parseColor(dest, 'rgb(25%, 50%, 75%)');
  t.equivalent(dest, [0.25, 0.5, 0.75, 1.0], 'Parsing blue');

  t.end();
});

tap.test('parsing hsl[a] () colors', function(t) {
  var dest = [0.0, 0.0, 0.0, 0.0];

  color.parseColor(dest, 'hsl(0,100%,50%)');
  t.equivalent(dest, [1.0, 0.0, 0.0, 1.0], 'Parsing red');

  color.parseColor(dest, 'hsla(120, 100%, 50%, 0.5)');
  t.equivalent(dest, [0.0, 1.0, 0.0, 0.5], 'Parsing green');

  color.parseColor(dest, 'hsl(0,100%,100%)');
  t.equivalent(dest, [1.0, 1.0, 1.0, 1.0], 'Parsing white');

  t.end();
});

