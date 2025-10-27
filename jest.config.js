module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'modules/**/src/**/*.js',
    'api/**/src/**/*.js',
    'shared/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testMatch: ['**/tests/**/*.test.js', '**/__tests__/**/*.js'],
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
  verbose: true,
};
