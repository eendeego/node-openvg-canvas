var vg = require('openvg');
var context = require('./context.js');
var image = require('./image.js');

var notImplemented = function() {
  return 'Not Implemented';
}

var Canvas = module.exports = function(width, height) {
  vg.init();

  width  = vg.screen.width;
  height = vg.screen.height;
}

Canvas.prototype.__defineGetter__('width', function() {
  return vg.screen.width;
});

Canvas.prototype.__defineGetter__('height', function() {
  return vg.screen.height;
});

Canvas.prototype.toDataURL = notImplemented;
Canvas.prototype.toDataURLHD = notImplemented;
Canvas.prototype.toBlob = notImplemented;
Canvas.prototype.toBlobHD = notImplemented;

Canvas.prototype.getContext = function(contextId, args) {
  if (contextId === '2d') {
    return context.createCanvasRenderingContext2D(this);
  } else {
    return null;
  }
};

// Based on http://paulirish.com/2011/requestanimationframe-for-smart-animating/
(function() {
  var lastTime = 0;

  if (!global.requestAnimationFrame)
    global.requestAnimationFrame = function(callback) {
      var currTime = new Date().getTime();
      var timeToCall = Math.max(0, 16 - (currTime - lastTime));
      var id = setTimeout(function() {
          callback(currTime + timeToCall);
          vg.egl.swapBuffers(vg.screen.display, vg.screen.surface);
        },
        timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };

  if (!global.cancelAnimationFrame)
    global.cancelAnimationFrame = function(id) {
        clearTimeout(id);
    };
}());

Canvas.prototype.vgSwapBuffers = function() {
  vg.egl.swapBuffers(vg.screen.display, vg.screen.surface);
}

// Conform to node-canvas API
var Image = Canvas.Image = image.Image;
