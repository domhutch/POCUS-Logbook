export default {
  plugins: [
    {
      name: "preset-default",
      params: {
        overrides: {
          // The templates use glyph IDs for their text; SVGO's ID cleanup breaks those references.
          cleanupIds: false,
        },
      },
    },
  ],
};
