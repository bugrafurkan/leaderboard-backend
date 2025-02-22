module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  transformIgnorePatterns: [
    '/node_modules/'
  ],
  testMatch: ['**/test/**/*.test.ts']
};
