// Setup file for Jest tests
const { sequelize } = require('../config/database');
const logger = require('../utils/logger');

// Disable logging during tests
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

// Global setup - runs once before all tests
beforeAll(async () => {
  // Connect to the test database
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully for testing.');
  } catch (error) {
    console.error('Unable to connect to the database for testing:', error);
    process.exit(1);
  }
});

// Global teardown - runs once after all tests
afterAll(async () => {
  // Close the database connection
  await sequelize.close();
  console.log('Database connection closed after testing.');
});
