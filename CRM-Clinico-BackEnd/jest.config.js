module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/'],
  coverageThreshold: {
    global: {
      branches: 40,
      functions: 40,
      lines: 40,
      statements: 40
    }
  },
  verbose: true,
  testMatch: ['**/__tests__/**/*.js?(x)', '**/?(*.)+(spec|test).js?(x)'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/server.js',
    '!**/node_modules/**',
    '!**/vendor/**'
  ],
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js'],
};
