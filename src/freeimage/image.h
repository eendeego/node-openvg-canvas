#ifndef IMAGE_H_
#define IMAGE_H_

#include <v8.h>
#include <node.h>

namespace openvg_canvas {
namespace freeimage {

class Image : public node::ObjectWrap {

public:
  static void Initialize(v8::Handle<v8::Object> target);

  static Image *New(FIBITMAP* image);

private:
  Image();
  ~Image();

  V8_METHOD_DECL(New            );
  V8_METHOD_DECL(Free           );
  V8_METHOD_DECL(ConvertTo32Bits);
  V8_METHOD_DECL(SaveToMemory   );
};

}
}

#endif
