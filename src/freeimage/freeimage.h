#ifndef FREEIMAGE_H_
#define FREEIMAGE_H_

#include <v8.h>
#include "../v8_helpers.h"

namespace openvg_canvas {
namespace freeimage {

ISOLATE_DECL(freeimage_isolate)

class FreeImage : public node::ObjectWrap {

public:
  static void Initialize(v8::Handle<v8::Object> target);

private:
  FreeImage();
  ~FreeImage();

  V8_METHOD_DECL(New                );
  V8_METHOD_DECL(GetVersion         );
  V8_METHOD_DECL(LoadFromMemory     );
  V8_METHOD_DECL(ConvertFromRGBABits);
};

}
}

#endif
