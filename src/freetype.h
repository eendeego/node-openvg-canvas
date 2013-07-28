#ifndef NODE_OPENVG_TEXT_H_
#define NODE_OPENVG_TEXT_H_

#include "ft2build.h"
#include FT_FREETYPE_H
#include FT_OUTLINE_H

#include <v8.h>
#include <node.h>

#include "v8_helpers.h"

namespace freetype {
  V8_METHOD(InitFreeType);
  V8_METHOD(DoneFreeType);
  V8_METHOD(NewMemoryFace);
  V8_METHOD(DoneFace);
  V8_METHOD(SetCharSize);
  V8_METHOD(GetCharIndex);
  V8_METHOD(LoadGlyph);
}

#endif