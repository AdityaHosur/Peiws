module.exports = {
  testMatch: ['**/__api_tests__/**/*.[jt]s?(x)', '**/?(*.)+(api.test).[tj]s?(x)'],
  testEnvironment: 'node',
  globalTeardown: '<rootDir>/config/teardown.js',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testTimeout: 30000,
};