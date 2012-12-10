#include <node.h>
#include <node_buffer.h>
#include <v8.h>

#include "ft2build.h"
#include FT_FREETYPE_H
#include FT_OUTLINE_H

#include "util.h"
#include "freetype.h"

using namespace node;
using namespace v8;

void init(Handle<Object> target) {
  NODE_SET_METHOD(target, "initFreeType" , freetype::InitFreeType);
  NODE_SET_METHOD(target, "doneFreeType" , freetype::DoneFreeType);
  NODE_SET_METHOD(target, "newMemoryFace", freetype::NewMemoryFace);
  NODE_SET_METHOD(target, "doneFace"     , freetype::DoneFace);
  NODE_SET_METHOD(target, "setCharSize"  , freetype::SetCharSize);
  NODE_SET_METHOD(target, "getCharIndex" , freetype::GetCharIndex);
  NODE_SET_METHOD(target, "loadGlyph"    , freetype::LoadGlyph);
}
NODE_MODULE(freetype, init)

/* FreeType */


Handle<Value> freetype::InitFreeType(const Arguments& args) {
  HandleScope scope;

  FT_Library *library = (FT_Library*) malloc(sizeof(FT_Library));
  V8::AdjustAmountOfExternalAllocatedMemory(sizeof(FT_Library));

  if (FT_Init_FreeType(library)) {
    return ThrowException(Exception::TypeError(String::New("Error initializing freetype.")));
  }

  return scope.Close(External::Wrap(library));
}

Handle<Value> freetype::DoneFreeType(const Arguments& args) {
  HandleScope scope;

  FT_Library* library = static_cast<FT_Library*>(External::Unwrap(args[0]));
  FT_Error error = FT_Done_FreeType(*library);

  free(library);
  V8::AdjustAmountOfExternalAllocatedMemory(-sizeof(FT_Library));

  if (error) {
    return ThrowException(Exception::TypeError(String::New("Error unloading face.")));
  }

  return Undefined();
}


/* Face */


Handle<Value> freetype::NewMemoryFace(const Arguments& args) {
  HandleScope scope;

  FT_Library* library = static_cast<FT_Library*>(External::Unwrap(args[0]));

  if (!Buffer::HasInstance(args[1])) {
    return ThrowException(Exception::Error(
                String::New("Second argument needs to be a buffer")));
  }

  Local<Object> bufferObj = args[1]->ToObject();
  char *bufferData = Buffer::Data(bufferObj);
  size_t bufferLength = Buffer::Length(bufferObj);

  FT_Face *face = (FT_Face*) malloc(sizeof(FT_Face));
  V8::AdjustAmountOfExternalAllocatedMemory(sizeof(FT_Face));

  FT_Byte* file_base  = (FT_Byte*) bufferData;
  FT_Long  file_size  = (FT_Long) bufferLength;
  FT_Long  face_index = (FT_Long) (FT_Long) args[2]->Int32Value();

  // // TODO: One or more of:
  // //         * Enable/Disable this code with macros
  // //         * Implement similar functionality in test code.
  // printf("FT_New_Memory_Face(%p - %d, %p, %ld, %ld, %p)\n",
  //        *library, (int) *library,
  //        file_base,
  //        file_size,
  //        face_index,
  //        face);
  //
  // printf("  file_base(%2x, %2x, %2x, %2x, %2x)\n",
  //        file_base[0], file_base[1], file_base[2], file_base[3], file_base[4]);

  FT_Error error =
    FT_New_Memory_Face(*library,
                       file_base,
                       file_size,
                       face_index,
                       face);

  if (error) {
    free(face);
    V8::AdjustAmountOfExternalAllocatedMemory(-sizeof(FT_Face));
    return ThrowException(Exception::TypeError(String::New("Error loading face.")));
  }

  Handle<Object> faceObj = Object::New();
  faceObj->Set(String::NewSymbol("face"), External::Wrap(face));
  faceObj->Set(String::NewSymbol("glyph"), Null());

  faceObj->Set(String::NewSymbol("num_glyphs"), Int32::New((*face)->num_glyphs));

  faceObj->Set(String::NewSymbol("family_name"), String::New((*face)->family_name));
  faceObj->Set(String::NewSymbol("style_name"), String::New((*face)->style_name));

  faceObj->Set(String::NewSymbol("units_per_EM"), Uint32::New((*face)->units_per_EM));
  faceObj->Set(String::NewSymbol("ascender"), Int32::New((*face)->ascender));
  faceObj->Set(String::NewSymbol("descender"), Int32::New((*face)->descender));
  faceObj->Set(String::NewSymbol("height"), Int32::New((*face)->height));

  return scope.Close(faceObj);
}

Handle<Value> freetype::DoneFace(const Arguments& args) {
  HandleScope scope;

  Handle<String> faceSymbol = String::NewSymbol("face");
  Handle<Object> faceObj = args[0]->ToObject();
  FT_Face* face = static_cast<FT_Face*>(External::Unwrap(faceObj->Get(faceSymbol)));

  FT_Error error = FT_Done_Face(*face);
  free(face);
  V8::AdjustAmountOfExternalAllocatedMemory(-sizeof(FT_Face));
  faceObj->Set(faceSymbol, Null());

  if (error) {
    return ThrowException(Exception::TypeError(String::New("Error unloading face.")));
  }

  return Undefined();
}

Handle<Value> freetype::SetCharSize(const Arguments& args) {
  HandleScope scope;

  Handle<String> faceSymbol = String::NewSymbol("face");
  Handle<Object> faceObj = args[0]->ToObject();
  FT_Face face = *static_cast<FT_Face*>(External::Unwrap(faceObj->Get(faceSymbol)));

  FT_F26Dot6  char_width      = args[1]->Uint32Value();
  FT_F26Dot6  char_height     = args[2]->Uint32Value();
  FT_UInt     horz_resolution = args[3]->Uint32Value();
  FT_UInt     vert_resolution = args[4]->Uint32Value();

  FT_Error error =
    FT_Set_Char_Size(face,
                     char_width, char_height,
                     horz_resolution, vert_resolution);

  if (error) {
    return ThrowException(Exception::TypeError(String::New("Error setting char size.")));
  }

  return Undefined();
}

Handle<Value> freetype::GetCharIndex(const Arguments& args) {
  HandleScope scope;

  Handle<String> faceSymbol = String::NewSymbol("face");
  Handle<Object> faceObj = args[0]->ToObject();
  FT_Face* face = static_cast<FT_Face*>(External::Unwrap(faceObj->Get(faceSymbol)));

  FT_ULong charcode = (FT_ULong) args[1]->Uint32Value();

  FT_UInt result = FT_Get_Char_Index(*face, charcode);

  return scope.Close(Uint32::New(result));
}

Handle<Value> freetype::LoadGlyph(const Arguments& args) {
  HandleScope scope;

  Handle<String> faceSymbol = String::NewSymbol("face");
  Handle<Object> faceObj = args[0]->ToObject();
  FT_Face face = *static_cast<FT_Face*>(External::Unwrap(faceObj->Get(faceSymbol)));

  FT_UInt  glyph_index = (FT_UInt) args[1]->Uint32Value();
  FT_Int32 load_flags = (FT_Int32) args[2]->Int32Value();

  FT_Error error =
    FT_Load_Glyph(face, glyph_index, load_flags);

  if (error) {
    return ThrowException(Exception::TypeError(String::New("Error loading glyph.")));
  }

  Local<Object> glyphObj = Object::New();
  faceObj->Set(String::NewSymbol("glyph"), glyphObj);
  Local<Object> advanceObj = Object::New();
  glyphObj->Set(String::NewSymbol("advance"), advanceObj);
  advanceObj->Set(String::NewSymbol("x"), Int32::New(face->glyph->advance.x));
  advanceObj->Set(String::NewSymbol("y"), Int32::New(face->glyph->advance.y));
  Local<Object> outlineObj = Object::New();
  glyphObj->Set(String::NewSymbol("outline"), outlineObj);
  short nContours = face->glyph->outline.n_contours;
  short nPoints = face->glyph->outline.n_points;
  outlineObj->Set(String::NewSymbol("nContours"), Int32::New(nContours));
  outlineObj->Set(String::NewSymbol("nPoints"  ), Int32::New(nPoints));

  size_t size;
  size = nPoints * 2 * sizeof(signed long);
  Local<Value> points = newInt32Array(size);
  fillArray(points, face->glyph->outline.points, size);
  outlineObj->Set(String::NewSymbol("points"), points);

  size = nPoints * sizeof(char);
  Local<Value> tags = newInt8Array(size);
  fillArray(tags, face->glyph->outline.tags, size);
  outlineObj->Set(String::NewSymbol("tags"), tags);

  size = nContours * sizeof(short);
  Local<Value> contours = newInt16Array(size);
  fillArray(contours, face->glyph->outline.contours, size);
  outlineObj->Set(String::NewSymbol("contours"), contours);

  outlineObj->Set(String::NewSymbol("flags"  ), Int32::New(face->glyph->outline.flags));

  return scope.Close(glyphObj);
}
