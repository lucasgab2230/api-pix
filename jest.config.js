module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['lcov', 'text'],
  collectCoverageFrom: [
    'services/**/*.js',
    'routes/**/*.js',
    'server.js',
    '!jest.config.js',
    '!**/*.test.js',
    '!**/node_modules/**',
    '!**/__mocks__/**'
  ],
  moduleNameMapper: {
    '^uuid$': require.resolve('./__mocks__/uuid.js')
  },
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: '.',
      outputName: 'test-report.xml',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}',
      ancestorSeparator: ' ',
      usePathForSuiteName: true
    }]
  ]
};
