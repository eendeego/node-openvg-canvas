{
  'targets': [
    {
      'target_name': 'freetype',
      'sources': [
        'src/freetype.cc',
        'src/util.cc'
      ],
      'ldflags': [
        "<!@(freetype-config --libs)"
      ],
      'cflags': [
        "-DENABLE_GDB_JIT_INTERFACE",
        "-DBUILDING_NODE_EXTENSION",
        "-Wall",
        "<!@(freetype-config --cflags)"
      ]
    }
  ]
}
