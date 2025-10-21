module.exports = {
  plugins: {
    "postcss-import": {
      resolve: function (id, basedir) {
        // Handle package imports like @plane/tailwind-config
        if (id.startsWith("@plane/")) {
          return require.resolve(id);
        }
        // Default resolution
        return id;
      },
    },
    "tailwindcss/nesting": {},
    tailwindcss: {},
    autoprefixer: {},
  },
};
