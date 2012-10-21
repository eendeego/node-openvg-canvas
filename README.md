# node-openvg-canvas
## Canvas implementation on node-openvg

This module implements a HTML5 Canvas on OpenVG (node-openvg). It is targeted to the raspberry-pi.
By using the OpenVG APIs on the Raspberry PI, all graphics code will run on the GPU with hardware acceleration.

This library aims for API compatibility with [node-canvas](https://github.com/learnboost/node-canvas) where it applies / makes sense. While node-canvas is targeted to create images off screen, node-openvg-canvas is targeted to on screen usage, but not yet for user interaction.

Currently there are only plans to implement the 2d context. Implementing the 3d context (web gl) should be possible by mapping OpenGL/ES.

## 0. Installation

This module is targeted for node 0.8.x. Node >= 0.8.10 will compile out of the box on the raspberry.

Fetch the source:

    git clone https://github.com/luismreis/node-openvg-canvas.git

Build the package:

    cd node-openvg-canvas
    npm install

To test:

    export PATH=$PWD/bin:$PATH
    examples/swissClock.js

## 1. Documentation

### Canvas implementation status (by WHATWG Canvas IDL class/interface definition)

* CanvasRenderingContext2D
  1. state - save/restore (done)
  2. matrix transformations: scale, transform, etc (done)
  3. compositing - alpha, composite operation (done)
  4. image smoothing (done)
  5. stroke/fill style
    1. gradients (done)
    2. patterns (to do)
  6. shadows (to do - after v. 1.0)
  7. clear/fill/stroke rect (done)
  8. beginPath, fill, stroke /default path/ (done)
    1. fill, stroke /custom path/ (to do)
  9. focus ring (no plan to implement)
  10. scrollPathIntoView (no plan to implement)
  11. clip/reset clip (to do)
  12. isPointInPath (to do - after v. 1.0 - help appreciated)
  13. fill/stroke/measure text (done)
  14. drawImage (done)
  15. hit regions (no plan to implement)
  16. create/get/put image data (done)
* CanvasDrawingStyles
  1. drawing styles - line width, cap, join, miter limit (done)
  2. dashed lines (to do)
  3. text - font, textAlign, textBaseline (done)
* CanvasPathMethods (only implemented for the context's currentDefaultPath)
  1. closePath() (done)
  2. moveTo, lineTo (done)
  3. quadraticCurveTo, bezierCurveTo (done - untested)
  4. arcTo (to do)
  5. rect (done)
  6. act (done)
  7. ellipse (done - rotation parameter ignored)
* CanvasGradient (done - currently broken)
* CanvasPattern (to do)
* TextMetrics (done)
* HitRegionOptions (no plan to implement)
* ImageData (done)
* Path (to do)

### Differences from the HTML5 Canvas object / node-canvas

The HTML5 Canvas is used inside the browser runtime, so, its rendering is controlled automatically (and implicitly) by the browser.

node-canvas code explicitly calls toBuffer or similar functions to render images.

Code running on node-openvg-canvas must explicitly swap display buffers, to do so, either call ```vg.egl.swapBuffers``` from node-openvg or use the included requestAnimationFrame shim (for more information look at the clock examples) that does this after calling your paint (callback) function.

## License

(The MIT License)

Copyright (c) 2012 Luis Reis

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
