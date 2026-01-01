module.exports = {
  testEnvironment: 'node',
  moduleNameMapper: {
    '^uuid$': require.resolve('./__mocks__/uuid.js')
  },
  reporters: ['default', ['jest-junit', { outputDirectory: '.', outputName: 'test-report.xml' }]]
};
