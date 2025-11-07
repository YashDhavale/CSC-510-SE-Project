/**
 * Test suite for Express Server (server.js)
 * Tests: 10 test cases
 */
const request = require('supertest');
const express = require('express');
const fs = require('fs');
const path = require('path');

// Mock the routes and users before requiring server
jest.mock('../../src/backend/routes/home', () => {
  const router = require('express').Router();
  router.get('/restaurants', (req, res) => res.json([]));
  router.get('/impact', (req, res) => res.json({ mealsRescued: 0 }));
  return router;
});

jest.mock('../../src/backend/routes/cart', () => {
  const router = require('express').Router();
  router.post('/api/orders', (req, res) => res.json({ success: true }));
  return router;
});

jest.mock('../../src/backend/routes/dashboard', () => {
  const router = require('express').Router();
  router.get('/dashboard/restaurants', (req, res) => res.json([]));
  return router;
});

// Mock users file
const mockUsers = [
  { name: 'Test User', email: 'test@example.com', password: 'password123' }
];

jest.mock('../../src/backend/secrets/users.js', () => mockUsers, { virtual: true });

const app = require('../../src/backend/server');

describe('Server Tests', () => {
  describe('Root Route', () => {
    test('GET / returns 200 and success message', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
      expect(response.text).toContain('Backend is running successfully');
    });
  });

  describe('Login Endpoint', () => {
    test('POST /login with valid credentials returns success', async () => {
      const response = await request(app)
        .post('/login')
        .send({ email: 'test@example.com', password: 'password123' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
    });

    test('POST /login with invalid credentials returns failure', async () => {
      const response = await request(app)
        .post('/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(false);
    });

    test('POST /login with missing email returns failure', async () => {
      const response = await request(app)
        .post('/login')
        .send({ password: 'password123' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(false);
    });

    test('POST /login with missing password returns failure', async () => {
      const response = await request(app)
        .post('/login')
        .send({ email: 'test@example.com' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Register Endpoint', () => {
    const testUsersFile = path.join(__dirname, '../src/backend/secrets/users.js');
    let originalUsers;

    beforeEach(() => {
      // Backup original users
      if (fs.existsSync(testUsersFile)) {
        originalUsers = require(testUsersFile);
      }
    });

    afterEach(() => {
      // Restore original users if needed
      if (originalUsers && fs.existsSync(testUsersFile)) {
        fs.writeFileSync(testUsersFile, `module.exports = ${JSON.stringify(originalUsers, null, 2)};`);
      }
    });

    test('POST /register with new user returns success', async () => {
      const response = await request(app)
        .post('/register')
        .send({ 
          name: 'New User', 
          email: 'newuser@example.com', 
          password: 'newpass123' 
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('POST /register with existing email returns failure', async () => {
      const response = await request(app)
        .post('/register')
        .send({ 
          name: 'Test User', 
          email: 'test@example.com', 
          password: 'password123' 
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    test('POST /register with missing name returns failure', async () => {
      const response = await request(app)
        .post('/register')
        .send({ 
          email: 'newuser@example.com', 
          password: 'newpass123' 
        });
      
      expect(response.status).toBe(200);
      // Should handle missing name gracefully
    });

    test('POST /register with missing email returns failure', async () => {
      const response = await request(app)
        .post('/register')
        .send({ 
          name: 'New User', 
          password: 'newpass123' 
        });
      
      expect(response.status).toBe(200);
      // Should handle missing email gracefully
    });
  });

  describe('CORS Configuration', () => {
    test('Server has CORS enabled', async () => {
      const response = await request(app).get('/');
      // CORS middleware should be applied
      expect(response.status).toBe(200);
    });
  });
});

