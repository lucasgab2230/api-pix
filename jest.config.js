module.exports = {
  testEnvironment: 'node',
  moduleNameMapper: {
    '^uuid$': require.resolve('./__mocks__/uuid.js')
  }
};
