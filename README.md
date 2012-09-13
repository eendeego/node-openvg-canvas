# node-openvg-canvas
## Canvas implementation on node-openvg

This module implements a HTML5 Canvas on OpenVG. It is targeted to the raspberry-pi.

It aims for API compatibility with [node-canvas](https://github.com/learnboost/node-canvas).

## 0. Installation

To install node on the raspberry follow the instructions on the gist [Node.js for Raspberry Pi](https://gist.github.com/3245130). Node 0.8.9 is known to work.

Fetch the source:

    git clone https://github.com/luismreis/node-openvg-canvas.git

Build the package:

    cd node-openvg-canvas
    npm install
    node-waf configure build

To test:

    examples/clock.js

## 1. Documentation

TBD

## License

(MIT)
