/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": "ts-jest",
    "^.+\\.jsx?$": "ts-jest",
  },
  transformIgnorePatterns: ["node_modules/(?!(@plane)/)"],
};
