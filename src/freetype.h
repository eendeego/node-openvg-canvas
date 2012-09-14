#ifndef NODE_OPENVG_TEXT_H_
#define NODE_OPENVG_TEXT_H_

#include "ft2build.h"
#include FT_FREETYPE_H
#include FT_OUTLINE_H

#include <node.h>
#include <v8.h>

using namespace v8;

namespace freetype {
  static Handle<Value> InitFreeType(const Arguments& args);
  static Handle<Value> DoneFreeType(const Arguments& args);
  static Handle<Value> NewMemoryFace(const Arguments& args);
  static Handle<Value> DoneFace(const Arguments& args);
  static Handle<Value> SetCharSize(const Arguments& args);
  static Handle<Value> GetCharIndex(const Arguments& args);
  static Handle<Value> LoadGlyph(const Arguments& args);
}

#endif