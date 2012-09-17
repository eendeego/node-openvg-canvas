var shapes = module.exports;

var drawSquare = shapes.drawSquare = function(ctx, squareSize) {
  var step = squareSize / 8;
  var offsetStep = squareSize / 16;
  var offset = 0;
  var size = squareSize;

  ctx.save();

  ctx.fillRect(offset, offset, size, size);
  offset += offsetStep; size -= 2*step;

  ctx.save();
  ctx.fillStyle = '#FFF'
  ctx.globalAlpha = 0.5;
  ctx.fillRect(offset, offset, size, size);
  offset += offsetStep; size -= 2*step;

  ctx.restore();
  ctx.fillRect(offset, offset, size, size);
  offset += offsetStep; size -= 2*step;

  ctx.restore();
  ctx.fillRect(offset, offset, size, size);
  offset += offsetStep; size -= 2*step;
};

var drawColoredSquare = shapes.drawColoredSquare = function(ctx, squareSize, x, y, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  drawSquare(ctx, squareSize);
  ctx.restore();
};
