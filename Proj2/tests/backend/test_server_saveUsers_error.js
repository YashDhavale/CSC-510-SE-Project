/**
 * Extra tests for Express Server (server.js) focusing on saveUsers() failure path.
 * This file increases backend coverage without changing existing behavior.
 */

const request = require('supertest');
const path = require('path');

// Mock fs BEFORE requiring server, to control loadUsers/saveUsers behavior
jest.mock('fs', () => {
  const actualFs = jest.requireActual('fs');

  // We simulate:
  //  - First writeFileSync (from loadUsers init) succeeds
  //  - Later writeFileSync (from saveUsers during /register) throws
  let writeCallCount = 0;

  return {
    ...actualFs,
    existsSync: jest.fn(() => false), // usersFile does not exist at startup
    mkdirSync: jest.fn(),             // no-op for directory creation
    writeFileSync: jest.fn((filePath, data) => {
      writeCallCount += 1;

      // First call: loadUsers() writing "module.exports = [];\n" — allow it
      if (
        writeCallCount === 1 &&
        typeof data === 'string' &&
        data.includes('module.exports = []')
      ) {
        return;
      }

      // Any later call (saveUsers) will fail
      throw new Error('Simulated write failure from test');
    }),
  };
});

// Pull in the mocked fs after jest.mock
const fs = require('fs');

// Mock feature routes so server can mount them without touching real CSV / files
jest.mock('../../src/backend/routes/home', () => {
  const router = require('express').Router();
  router.get('/restaurants', (req, res) => res.json([]));
  router.get('/impact', (req, res) => res.json({ mealsRescued: 0 }));
  return router;
});

jest.mock('../../src/backend/routes/cart', () => {
  const router = require('express').Router();
  router.post('/api/orders', (req, res) => res.json({ success: true }));
  router.get('/api/orders', (req, res) => res.json({ success: true, orders: [] }));
  router.get('/api/restaurant-points', (req, res) =>
    res.json({ success: true, points: {} })
  );
  return router;
});

jest.mock('../../src/backend/routes/dashboard', () => {
  const router = require('express').Router();
  router.get('/dashboard/restaurants-with-meals', (req, res) => res.json([]));
  return router;
});

// Require the server AFTER all mocks are set up
const app = require('../../src/backend/server');

describe('Express Server - saveUsers failure handling', () => {
  test('POST /register returns failure when users file cannot be written', async () => {
    const payload = {
      name: 'New User',
      email: 'newuser@example.com',
      password: 'securePassword123',
    };

    const response = await request(app).post('/register').send(payload);

    // HTTP status kept 200 to stay compatible with existing frontend/tests
    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/server error/i);

    // Ensure writeFileSync was actually invoked (loadUsers + saveUsers)
    expect(fs.writeFileSync).toHaveBeenCalled();
    expect(fs.writeFileSync.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});
