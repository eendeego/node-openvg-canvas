#include <node.h>
#include <node_buffer.h>
#include <v8.h>

#include "util.h"

// #include <stdio.h>

using namespace node;
using namespace v8;

extern "C" void
init(Handle<Object> target) {
//  NODE_SET_METHOD(target, "initFreeType" , freetype::InitFreeType);
}

NODE_MODULE(bindings,init);
