{
  'targets': [
    {
      # have to specify 'liblib' here since gyp will remove the first one :\
      'target_name': 'libfreetype',
      'sources': [
        'src/freetype.cc',
        'src/util.cc'
      ],
      'ldflags': [
        "-lfreetype"
      ],
      'cflags': [
        "-DENABLE_GDB_JIT_INTERFACE",
        "-DBUILDING_NODE_EXTENSION",
        "-Wall"
      ]
    }
  ]
}
