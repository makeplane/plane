import path from "node:path";

export default {
  test: {
    environment: "jsdom",
    include: ["tests/components/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname) },
  },
};
