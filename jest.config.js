const nextJest = require("next/jest");
const createJestConfig = nextJest({
  dir: "./",
});
const customJestConfig = {
  moduleDirectories: ["node_modules", "<rootDir>/"],
  testEnvironment: "jsdom",
  setupFiles: ["<rootDir>/jest-shim.js"],
};
module.exports = createJestConfig(customJestConfig);
