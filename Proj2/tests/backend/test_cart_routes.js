/**
 * Test suite for Cart Routes (routes/cart.js)
 * Tests: 10 test cases
 */
const request = require('supertest');
const express = require('express');
const fs = require('fs');
const path = require('path');

// Mock fs before requiring routes
const mockFs = {
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn()
};

jest.mock('fs', () => mockFs);

const cartRoutes = require('../../src/backend/routes/cart');

describe('Cart Routes Tests', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/', cartRoutes);
    
    // Reset mocks
    jest.clearAllMocks();
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue('{}');
  });

  describe('POST /api/orders', () => {
    test('returns 200 status code for valid order', async () => {
      const orderData = {
        items: [
          { id: 1, name: 'Item1', quantity: 2, isRescueMeal: true, restaurant: 'R1' }
        ],
        totals: { subtotal: 20.0, total: 22.0 }
      };

      mockFs.readFileSync.mockReturnValue('{}');

      const response = await request(app)
        .post('/api/orders')
        .send(orderData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('returns 400 for invalid order data', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send({ items: [] });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('returns 400 for missing items', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send({ totals: { subtotal: 20.0 } });

      expect(response.status).toBe(400);
    });

    test('calculates points for rescue meals', async () => {
      const orderData = {
        items: [
          { 
            id: 1, 
            name: 'Rescue Meal', 
            quantity: 3, 
            isRescueMeal: true, 
            restaurant: 'Restaurant1' 
          }
        ],
        totals: { subtotal: 20.0, total: 22.0 }
      };

      mockFs.readFileSync.mockReturnValue('{}');

      const response = await request(app)
        .post('/api/orders')
        .send(orderData);

      expect(response.status).toBe(200);
      expect(response.body.order.pointsEarned).toBeDefined();
      expect(response.body.order.pointsEarned.Restaurant1).toBe(30); // 3 * 10
    });

    test('creates order with timestamp', async () => {
      const orderData = {
        items: [
          { id: 1, name: 'Item1', quantity: 1, isRescueMeal: false }
        ],
        totals: { subtotal: 10.0, total: 11.0 }
      };

      mockFs.readFileSync.mockReturnValue('[]');

      const response = await request(app)
        .post('/api/orders')
        .send(orderData);

      expect(response.status).toBe(200);
      expect(response.body.order.timestamp).toBeDefined();
      expect(response.body.order.id).toContain('ORD-');
    });

    test('saves order to file', async () => {
      const orderData = {
        items: [
          { id: 1, name: 'Item1', quantity: 1, isRescueMeal: false }
        ],
        totals: { subtotal: 10.0, total: 11.0 }
      };

      mockFs.readFileSync.mockReturnValue('[]');

      await request(app)
        .post('/api/orders')
        .send(orderData);

      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });

    test('updates restaurant points for rescue meals', async () => {
      const orderData = {
        items: [
          { 
            id: 1, 
            name: 'Rescue Meal', 
            quantity: 2, 
            isRescueMeal: true, 
            restaurant: 'Restaurant1' 
          }
        ],
        totals: { subtotal: 15.0, total: 16.5 }
      };

      const existingPoints = { Restaurant1: 50 };
      mockFs.readFileSync.mockReturnValue(JSON.stringify(existingPoints));

      const response = await request(app)
        .post('/api/orders')
        .send(orderData);

      expect(response.status).toBe(200);
      // Points should be updated
      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });

    test('handles multiple restaurants in one order', async () => {
      const orderData = {
        items: [
          { 
            id: 1, 
            name: 'Meal1', 
            quantity: 1, 
            isRescueMeal: true, 
            restaurant: 'Restaurant1' 
          },
          { 
            id: 2, 
            name: 'Meal2', 
            quantity: 2, 
            isRescueMeal: true, 
            restaurant: 'Restaurant2' 
          }
        ],
        totals: { subtotal: 30.0, total: 33.0 }
      };

      mockFs.readFileSync.mockReturnValue('{}');

      const response = await request(app)
        .post('/api/orders')
        .send(orderData);

      expect(response.status).toBe(200);
      expect(Object.keys(response.body.order.pointsEarned).length).toBe(2);
    });

    test('handles server error gracefully', async () => {
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File read error');
      });

      const orderData = {
        items: [
          { id: 1, name: 'Item1', quantity: 1, isRescueMeal: false }
        ],
        totals: { subtotal: 10.0, total: 11.0 }
      };

      const response = await request(app)
        .post('/api/orders')
        .send(orderData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/restaurant-points', () => {
    test('returns 200 status code', async () => {
      mockFs.readFileSync.mockReturnValue('{"Restaurant1": 100}');

      const response = await request(app).get('/api/restaurant-points');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('returns points data', async () => {
      const pointsData = { Restaurant1: 100, Restaurant2: 50 };
      mockFs.readFileSync.mockReturnValue(JSON.stringify(pointsData));

      const response = await request(app).get('/api/restaurant-points');

      expect(response.body.points).toEqual(pointsData);
    });

    test('returns empty object when file does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);

      const response = await request(app).get('/api/restaurant-points');

      expect(response.status).toBe(200);
      expect(response.body.points).toEqual({});
    });

    test('handles file read error', async () => {
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File read error');
      });

      const response = await request(app).get('/api/restaurant-points');

      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/orders', () => {
    test('returns 200 status code', async () => {
      mockFs.readFileSync.mockReturnValue('[]');

      const response = await request(app).get('/api/orders');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('returns orders array', async () => {
      const ordersData = [
        { id: 'ORD-1', items: [], totals: {} }
      ];
      mockFs.readFileSync.mockReturnValue(JSON.stringify(ordersData));

      const response = await request(app).get('/api/orders');

      expect(response.body.orders).toEqual(ordersData);
    });

    test('returns empty array when file does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);

      const response = await request(app).get('/api/orders');

      expect(response.status).toBe(200);
      expect(response.body.orders).toEqual([]);
    });

    test('handles file read error', async () => {
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File read error');
      });

      const response = await request(app).get('/api/orders');

      expect(response.status).toBe(500);
    });
  });
});

