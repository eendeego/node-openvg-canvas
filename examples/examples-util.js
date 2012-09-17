var eu = module.exports;

var animationHandle;

var animate = eu.animate = function (paint) {
  (function animloop() {
    animationHandle = requestAnimationFrame(animloop);
    paint();
  })();
}

var handleTermination = eu.handleTermination = function (callback) {
  function terminate() {
    if (callback) { callback(); }
    console.log("Making a clean exit.");
  }
  process.on('exit', terminate);
}

var waitForInput = eu.waitForInput = function (callback) {
  console.log("Press return to exit.");
  process.stdin.resume();
  process.stdin.setEncoding('utf8');

  process.stdin.once('data', function (chunk) {
    cancelAnimationFrame(animationHandle);
    if (callback) {
      callback();
    } else {
      process.stdin.pause();
    }
  });
}
