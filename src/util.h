#ifndef NODE_OPENVG_FREETYPE_UTIL_H_
#define NODE_OPENVG_FREETYPE_UTIL_H_

#include <node.h>
#include <v8.h>

using namespace v8;

extern Local<Value> newInt8Array(size_t length);
extern Local<Value> newInt16Array(size_t length);
extern Local<Value> newInt32Array(size_t length);

extern Handle<Value> fillArray(Handle<Value> dest, void* source, size_t length);

#endif