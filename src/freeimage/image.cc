#include <string.h>
#include <iostream>

#include <v8.h>
#include <node.h>
#include <node_buffer.h>
#include "../v8_helpers.h"

#include <FreeImage.h>
#include "freeimage.h"
#include "image.h"

using namespace std;
using namespace v8;
using namespace node;

namespace openvg_canvas {
namespace freeimage {

static Persistent<FunctionTemplate> image_constructor;

void Image::Initialize(Handle<Object> target) {
  SCOPE(freeimage_isolate);

  // Prepare constructor template
  Local<FunctionTemplate> constructor = FunctionTemplate::New(New);
  constructor->SetClassName(String::NewSymbol("Image"));
  constructor->InstanceTemplate()->SetInternalFieldCount(1);

  SET_TEMPLATE(image_constructor, freeimage_isolate, constructor);

  // Prototype
  Local<Template> proto = constructor->PrototypeTemplate();
  proto->Set("free"           , FunctionTemplate::New(Free           ));
  proto->Set("convertTo32Bits", FunctionTemplate::New(ConvertTo32Bits));
  proto->Set("saveToMemory"   , FunctionTemplate::New(SaveToMemory   ));
}

Image::Image() {}

Image::~Image() {
  SCOPE(freeimage_isolate);

  Local<Value> wrappedDIB = HANDLE->GetInternalField(0);
  if (wrappedDIB->IsNull()) return;

  FIBITMAP *dib = static_cast<FIBITMAP*>(Local<External>::Cast(wrappedDIB)->Value());

  // cout << "Freeing img " << hex << dib << dec << endl;

  FreeImage_Unload(dib);
}

V8_METHOD(Image::New) {
  SCOPE(freeimage_isolate);

  Image *image = new Image();
  image->Wrap(args.This());

  V8_RETURN(args.This());
}

Image *Image::New(FIBITMAP* dib) {
  SCOPE(freeimage_isolate);

  // cout << "Alloc'ing img " << hex << dib << dec << endl;

  Local<Object> jsImage = NEW_INSTANCE(freeimage_isolate, image_constructor);

  Image *image = ObjectWrap::Unwrap<Image>(jsImage);

  int w, h, pitch;
  FREE_IMAGE_TYPE type = FreeImage_GetImageType(dib);

  jsImage->SetInternalField(0, External::New(dib));
  jsImage->Set(String::NewSymbol("width"    ), Integer::New(w     = FreeImage_GetWidth(dib)));
  jsImage->Set(String::NewSymbol("height"   ), Integer::New(h     = FreeImage_GetHeight(dib)));
  jsImage->Set(String::NewSymbol("bpp"      ), Integer::New((int) FreeImage_GetBPP(dib)));
  jsImage->Set(String::NewSymbol("pitch"    ), Integer::New(pitch = FreeImage_GetPitch(dib)));
  jsImage->Set(String::NewSymbol("type"     ), Integer::New(type));
  jsImage->Set(String::NewSymbol("redMask"  ), Integer::New((int) FreeImage_GetRedMask(dib)));
  jsImage->Set(String::NewSymbol("greenMask"), Integer::New((int) FreeImage_GetGreenMask(dib)));
  jsImage->Set(String::NewSymbol("blueMask" ), Integer::New((int) FreeImage_GetBlueMask(dib)));

  BYTE *bits = FreeImage_GetBits(dib);

#ifdef NODE_BUFFER_TYPE_PRE_0_11
  node::Buffer *buf = node::Buffer::New((char*) bits, h * pitch);
  jsImage->Set(String::New("buffer"), V8_PERSISTENT(buf));
#else
  jsImage->Set(String::New("buffer"), Buffer::New((char*) bits, h * pitch));
#endif

  return image;
}

V8_METHOD(Image::Free) {
  SCOPE(freeimage_isolate);

  Local<Value> wrappedDIB = args.This()->GetInternalField(0);
  if (wrappedDIB->IsNull()) V8_RETURN_UNDEFINED;

  FIBITMAP *dib = static_cast<FIBITMAP*>(Local<External>::Cast(wrappedDIB)->Value());

  FreeImage_Unload(dib);

  args.This()->SetInternalField(0, Null());
  V8_RETURN_UNDEFINED;
}

V8_METHOD(Image::ConvertTo32Bits) {
  SCOPE(freeimage_isolate);

  Local<External> wrap = Local<External>::Cast(args.This()->GetInternalField(0));
  FIBITMAP *dib = static_cast<FIBITMAP*>(wrap->Value());

  FIBITMAP *conv = FreeImage_ConvertTo32Bits(dib);

  V8_RETURN(V8_PERSISTENT(Image::New(conv)));
}

V8_METHOD(Image::SaveToMemory) {
  SCOPE(freeimage_isolate);

  Local<External> wrap = Local<External>::Cast(args.This()->GetInternalField(0));
  FIBITMAP *dib = static_cast<FIBITMAP*>(wrap->Value());

  FREE_IMAGE_FORMAT fif = FIF_PNG;
  int flags = PNG_IGNOREGAMMA;

  BOOL convert = fif == FIF_JPEG && FreeImage_GetBPP(dib) != 24;
  if(convert) {
    dib = FreeImage_ConvertTo24Bits(dib);
  }

  BYTE *mem_buffer = NULL;
  DWORD file_size;
  FIMEMORY *hmem = FreeImage_OpenMemory();

  FreeImage_SaveToMemory(fif, dib, hmem, flags);

  if(convert) {
    FreeImage_Unload(dib);
  }

  FreeImage_AcquireMemory(hmem, &mem_buffer, &file_size);

#ifdef NODE_BUFFER_TYPE_PRE_0_11
  Buffer *slowBuffer = Buffer::New(file_size);
  memcpy(Buffer::Data(slowBuffer), (char*) mem_buffer, (size_t) file_size);

  Local<Object> globalObj = Context::GetCurrent()->Global();
  Local<Function> bufferConstructor = Local<Function>::Cast(globalObj->Get(String::New("Buffer")));
  Handle<Value> constructorArgs[3] = { slowBuffer->handle_, v8::Integer::New(file_size), v8::Integer::New(0) };
  Local<Object> actualBuffer = bufferConstructor->NewInstance(3, constructorArgs);
#else
  Local<Object> actualBuffer = Buffer::New(file_size);
  memcpy(Buffer::Data(actualBuffer), (char*) mem_buffer, (size_t) file_size);
#endif

  FreeImage_CloseMemory(hmem);

  V8_RETURN(scope.Close(actualBuffer));
}

}
}
