#ifndef V8_HELPERS_H_
#define V8_HELPERS_H_

// SCOPE_DECL_* defined in bindings.gyp
#ifdef SCOPE_DECL_PRE_0_11
#define ISOLATE_DECL(isolate)
#define ISOLATE(isolate)
#define ISOLATE_INIT(isolate)
#define SCOPE(isolate) HandleScope scope
#else
#define ISOLATE_DECL(isolate) extern v8::Isolate* isolate;
#define ISOLATE(isolate) v8::Isolate* isolate;
#define ISOLATE_INIT(isolate) isolate = Isolate::GetCurrent();
#define SCOPE(isolate) HandleScope scope(isolate)
#endif


// V8_CALLBACK_STYLE_* defined in bindings.gyp
#ifdef V8_CALLBACK_STYLE_PRE_3_20

#define V8_METHOD(method) v8::Handle<v8::Value> method(const v8::Arguments& args)
#define V8_PERSISTENT(value) value->handle_
#define V8_RETURN(result) return result
#define V8_RETURN_UNDEFINED return Undefined()

#define HANDLE handle_
#define SET_TEMPLATE(template, isolate, constructor) template = Persistent<FunctionTemplate>::New(constructor)

#define NEW_INSTANCE(isolate, template) template->GetFunction()->NewInstance()

#else

#define V8_METHOD(method) void method(const v8::FunctionCallbackInfo<v8::Value>& args)
#define V8_PERSISTENT(value) value->persistent()
#define V8_RETURN(result) do { args.GetReturnValue().Set(result);return; } while(0)
#define V8_RETURN_UNDEFINED return

#define HANDLE handle()
#define SET_TEMPLATE(template, isolate, constructor) template.Reset(isolate, constructor)

#define NEW_INSTANCE(isolate, template) Local<FunctionTemplate>::New(isolate, template)->GetFunction()->NewInstance();

#endif

#define V8_METHOD_DECL(method) static V8_METHOD(method)

#define V8_FUNCTION_DECL(function) V8_METHOD(function)
#define V8_FUNCTION(function) static V8_METHOD(function)

#define V8_THROW(exception) V8_RETURN(ThrowException(exception))


// TYPED_ARRAY_TYPE_* defined in bindings.gyp
#ifdef TYPED_ARRAY_TYPE_PRE_0_11
template<class C> class TypedArrayWrapper {
 private:
  v8::Local<v8::Object> array;
  v8::Handle<v8::Object> buffer;
  int byteOffset;
 public:
  inline __attribute__((always_inline)) TypedArrayWrapper(const v8::Local<v8::Value>& arg) :
    array(arg->ToObject()),
    buffer(array->Get(v8::String::New("buffer"))->ToObject()),
    byteOffset(array->Get(v8::String::New("byteOffset"))->Int32Value()) {
  }

  inline __attribute__((always_inline)) C* pointer(int offset = 0) {
    return (C*) &((char*) buffer->GetIndexedPropertiesExternalArrayData())[byteOffset + offset];
  }

  inline __attribute__((always_inline)) int length() {
    return array->Get(v8::String::New("length"))->Uint32Value();
  }
};
#else
template<class C> class TypedArrayWrapper {
 private:
  v8::Local<v8::TypedArray> array;
 public:
  inline __attribute__((always_inline)) TypedArrayWrapper(const v8::Local<v8::Value>& arg) :
    array(v8::Handle<v8::TypedArray>::Cast(arg->ToObject())) {
  }

  inline __attribute__((always_inline)) C* pointer(int offset = 0) {
    return (C*) &((char*) array->BaseAddress())[offset];
  }

  inline __attribute__((always_inline)) int length() {
    return array->Length();
  }
};
#endif

#endif
