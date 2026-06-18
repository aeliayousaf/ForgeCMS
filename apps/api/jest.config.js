/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: ".",
  testMatch: ["**/test/**/*.spec.ts"],
  moduleNameMapper: {
    "^@forgecms/shared$": "<rootDir>/../../packages/shared/src/index.ts",
    // Strip NodeNext ".js" specifiers so Jest resolves the ".ts" sources.
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: { module: "commonjs", esModuleInterop: true } }],
  },
};
