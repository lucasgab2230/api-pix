let idCounter = 1;

module.exports = {
  v4: jest.fn(() => `mock-uuid-${idCounter++}`),
  v1: jest.fn(() => `mock-uuid-v1-${idCounter++}`),
  v3: jest.fn(() => `mock-uuid-v3-${idCounter++}`),
  v5: jest.fn(() => `mock-uuid-v5-${idCounter++}`),
  NIL: '00000000-0000-0000-0000-000000000000',
  validate: jest.fn(() => true),
  version: jest.fn(() => 4)
};
