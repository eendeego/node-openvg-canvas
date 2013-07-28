#include <stdlib.h>
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

ISOLATE(freeimage_isolate)

void FreeImage::Initialize(Handle<Object> target) {
  ISOLATE_INIT(freeimage_isolate)
  SCOPE(freeimage_isolate);

  // Prepare constructor template
  Local<FunctionTemplate> constructor = FunctionTemplate::New(New);
  constructor->SetClassName(String::NewSymbol("FreeImage"));
  constructor->InstanceTemplate()->SetInternalFieldCount(1);

  // Prototype
  Local<Template> proto = constructor->PrototypeTemplate();
  proto->Set("getVersion"         , FunctionTemplate::New(GetVersion         ));
  proto->Set("loadFromMemory"     , FunctionTemplate::New(LoadFromMemory     ));
  proto->Set("convertFromRGBABits", FunctionTemplate::New(ConvertFromRGBABits));

  target->Set(String::NewSymbol("FreeImage"), constructor->GetFunction()->NewInstance());

  Image::Initialize(target);
}

FreeImage::FreeImage() {
  FreeImage_Initialise(FALSE); // FALSE means use external plugins
}

FreeImage::~FreeImage() {
  FreeImage_DeInitialise();
}

void FreeImageErrorHandler(FREE_IMAGE_FORMAT fif, const char *message) {
  cout << endl << "*** ";
  if(fif != FIF_UNKNOWN) {
    cout << FreeImage_GetFormatFromFIF(fif) << " Format" << endl;
  }
  cout << message;
  cout << " ***" << endl;
}

// TODO check for args.IsConstructCall()
V8_METHOD(FreeImage::New) {
  SCOPE(freeimage_isolate);

  FreeImage* obj = new FreeImage();
  obj->Wrap(args.This());
  FreeImage_SetOutputMessage(FreeImageErrorHandler);

  V8_RETURN(args.This());
}

V8_METHOD(FreeImage::GetVersion) {
  SCOPE(freeimage_isolate);

  V8_RETURN(scope.Close(String::New(FreeImage_GetVersion())));
}

V8_METHOD(FreeImage::LoadFromMemory) {
  SCOPE(freeimage_isolate);

  Local<Object> bufferObj    = args[0]->ToObject();
  BYTE*         bufferData   = (BYTE*) Buffer::Data(bufferObj);
  size_t        bufferLength = Buffer::Length(bufferObj);

  FIMEMORY *hmem = FreeImage_OpenMemory(bufferData, bufferLength);

  FREE_IMAGE_FORMAT fif = FreeImage_GetFileTypeFromMemory(hmem, 0);
  FIBITMAP *dib = FreeImage_LoadFromMemory(fif, hmem, 0);

  FreeImage_CloseMemory(hmem);

  // check that dib does not contains pixels
  if(!dib || !FreeImage_HasPixels(dib)) {
    V8_RETURN(Undefined());
  } else {
    V8_RETURN(V8_PERSISTENT(Image::New(dib)));
  }
}

V8_METHOD(FreeImage::ConvertFromRGBABits) {
  SCOPE(freeimage_isolate);

  TypedArrayWrapper<uint32_t> rgba(args[0]);

  const uint32_t width  = args[1]->Int32Value();
  const uint32_t height = args[2]->Int32Value();
  const uint32_t pitch = width * 4, bpp = 32;
  const uint32_t redMask   = 0x00ff0000,
                 greenMask = 0x0000ff00,
                 blueMask  = 0x000000ff;
  BOOL topdown = FALSE;

  BYTE* convertedBits = (BYTE *) malloc(height * width * 4);

  uint32_t* nextDest = (uint32_t*) convertedBits;
  uint32_t* nextSrc = (uint32_t*) rgba.pointer();
  for(int i=height * width; i >= 0; i--, nextSrc++, nextDest++) {
    *nextDest = (*nextSrc & 0xffffff00) >> 8 |
                (*nextSrc & 0x000000ff) << 24;
  }

  FIBITMAP *dib =
    FreeImage_ConvertFromRawBits(convertedBits, width, height, pitch, bpp,
                                 redMask, greenMask, blueMask, topdown);

  free(convertedBits);

  // check that dib does not contains pixels
  if(!dib || !FreeImage_HasPixels(dib)) {
    V8_RETURN(Undefined());
  } else {
    V8_RETURN(V8_PERSISTENT(Image::New(dib)));
  }
}

} // namespace freeimage
} // namespace openvg_canvas

NODE_MODULE(freeimage, openvg_canvas::freeimage::FreeImage::Initialize)
