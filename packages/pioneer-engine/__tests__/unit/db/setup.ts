// Jest setup file for database tests
import path from 'path';
import fs from 'fs';
import os from 'os';

// Jest globals
declare const afterAll: (fn: () => void) => void;

// Create a temporary directory for test databases
const tempDir = path.join(os.tmpdir(), 'pioneer-engine-tests');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Set environment variables for testing
process.env.PIONEER_TEST_MODE = 'true';
const dbPath = path.join(tempDir, 'test.db');
process.env.PIONEER_DB_PATH = dbPath;

// Clean up function to run after all tests
afterAll(() => {
  // Remove test database file if it exists
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
}); 