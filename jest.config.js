const nextJest = require("next/jest");
const createJestConfig = nextJest({
  dir: "./",
});
const customJestConfig = {
  moduleDirectories: ["node_modules", "<rootDir>/", "src"],
  modulePaths: ["<rootDir>/src/"],
  setupFiles: ["<rootDir>/jest-shim.js"],
};
module.exports = createJestConfig(customJestConfig);
