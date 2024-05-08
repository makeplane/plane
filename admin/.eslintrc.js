module.exports = {
  root: true,
  extends: ["custom"],
  parser: "@typescript-eslint/parser",
  settings: {
    "import/resolver": {
      typescript: {},
      node: {
        moduleDirectory: ["node_modules", "."],
      },
    },
  },
  rules: {}
}