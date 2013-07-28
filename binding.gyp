{
  "variables": {
    "platform": "<(OS)",
    "buffer_impl" : "<!(node -pe 'v=process.versions.node.split(\".\");v[0] > 0 || v[0] == 0 && v[1] >= 11 ? \"POS_0_11\" : \"PRE_0_11\"')",
    "callback_style" : "<!(node -pe 'v=process.versions.v8.split(\".\");v[0] > 3 || v[0] == 3 && v[1] >= 20 ? \"POS_3_20\" : \"PRE_3_20\"')"
  },
  "conditions": [
    # Replace gyp platform with node platform, blech
    ["platform == \"mac\"", {"variables": {"platform": "darwin"}}],
    ["platform == \"win\"", {"variables": {"platform": "win32"}}],
  ],
  "targets": [
    {
      "target_name": "freetype",
      "sources": [
        "src/freetype.cc",
        "src/util.cc"
      ],
      "defines": [
        "NODE_BUFFER_TYPE_<(buffer_impl)",
        "TYPED_ARRAY_TYPE_<(buffer_impl)",
        "SCOPE_DECL_<(buffer_impl)",
        "V8_CALLBACK_STYLE_<(callback_style)"
      ],
      "ldflags": [
        "<!@(freetype-config --libs)"
      ],
      "cflags": [
        "-DENABLE_GDB_JIT_INTERFACE",
        "-DBUILDING_NODE_EXTENSION",
        "-Wall",
        "<!@(freetype-config --cflags)"
      ]
    },
    {
      "target_name": "freeimage",
      "sources": [
        "src/freeimage/freeimage.cc",
        "src/freeimage/image.cc"
      ],
      "defines": [
        "NODE_BUFFER_TYPE_<(buffer_impl)",
        "TYPED_ARRAY_TYPE_<(buffer_impl)",
        "SCOPE_DECL_<(buffer_impl)",
        "V8_CALLBACK_STYLE_<(callback_style)"
      ],
      "conditions": [
        ["OS==\"linux\"", {"libraries": ["-lfreeimage"]}],
        ["OS==\"mac\"", {
          "libraries": ["-lfreeimage", "-L/opt/local/lib", "-L/usr/local/lib"],
          "include_dirs": ["/opt/local/include", "/usr/local/include"]
          }],
        ["OS==\"win\"", {
          "libraries": [
            "FreeImage64.lib"
            ],
          "defines" : [
            "WIN32_LEAN_AND_MEAN",
            "VC_EXTRALEAN"
          ]
          },
        ],
      ],
    }
  ]
}
