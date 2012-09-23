var eu = module.exports;

var animationHandle;

var animate = eu.animate = function (paint) {
  (function animloop(time) {
    animationHandle = requestAnimationFrame(animloop);
    paint(time);
  })();
}

var handleTermination = eu.handleTermination = function (callback) {
  function terminate() {
    if (callback) { callback(); }
    console.log("Making a clean exit.");
  }
  process.on('exit', terminate);
}

var waitForInput = eu.waitForInput = function (prompt, callback) {
  if (prompt === undefined) {
    prompt = 'Press return to exit.';
  } else if (callback === undefined) {
    callback = prompt;
    prompt = 'Press return to exit.';
  }

  console.log(prompt);
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
