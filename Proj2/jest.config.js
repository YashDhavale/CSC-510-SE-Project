module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/backend/**/*.js'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
    '/data/'
  ],
  collectCoverageFrom: [
    'src/backend/**/*.js',
    '!src/backend/**/*.test.js'
  ],
  coverageReporters: ['text', 'lcov', 'json', 'html'],
  moduleDirectories: ['node_modules', 'src/backend/node_modules'],
  roots: ['<rootDir>'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  }
};

