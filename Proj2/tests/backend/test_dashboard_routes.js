/**
 * Test suite for Dashboard Routes (routes/dashboard.js)
 * Tests: 10 test cases
 */
const request = require('supertest');
const express = require('express');
const fs = require('fs');

// Mock fs and csv reading
const mockFs = {
  existsSync: jest.fn(),
  createReadStream: jest.fn()
};

jest.mock('fs', () => mockFs);

const dashboardRoutes = require('../../src/backend/routes/dashboard');

describe('Dashboard Routes Tests', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/', dashboardRoutes);
    
    jest.clearAllMocks();
    mockFs.existsSync.mockReturnValue(true);
  });

  describe('GET /dashboard/restaurants', () => {
    test('returns 200 status code', async () => {
      const mockData = [
        { restaurant: 'R1', cuisine: 'Italian', zip_code: '27601', has_sustainability_program: 'True' }
      ];

      setupMockCSVRead(mockData);

      const response = await request(app).get('/dashboard/restaurants');
      expect(response.status).toBe(200);
    });

    test('returns array of restaurants', async () => {
      const mockData = [
        { restaurant: 'R1', cuisine: 'Italian', zip_code: '27601', has_sustainability_program: 'True' }
      ];

      setupMockCSVRead(mockData);

      const response = await request(app).get('/dashboard/restaurants');
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('includes restaurant details', async () => {
      const mockData = [
        { 
          restaurant: 'R1', 
          cuisine: 'Italian', 
          zip_code: '27601', 
          has_sustainability_program: 'True',
          efficiency_score: '75.0',
          avg_delivery_time: '20.0',
          on_time_rate: '90.0'
        }
      ];

      setupMockCSVRead(mockData);

      const response = await request(app).get('/dashboard/restaurants');
      expect(response.body[0].name).toBe('R1');
      expect(response.body[0].cuisine).toBe('Italian');
    });

    test('calculates sustainability score', async () => {
      const mockData = [
        { 
          restaurant: 'R1', 
          cuisine: 'Italian', 
          zip_code: '27601', 
          has_sustainability_program: 'True',
          efficiency_score: '80.0'
        }
      ];

      setupMockCSVRead(mockData);

      const response = await request(app).get('/dashboard/restaurants');
      expect(response.body[0].sustainabilityScore).toBeDefined();
    });

    test('handles missing files gracefully', async () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.createReadStream.mockReturnValue({
        pipe: jest.fn().mockReturnValue({
          on: jest.fn((event, callback) => {
            if (event === 'end') {
              setTimeout(() => callback(), 0);
            }
            return { on: jest.fn() };
          })
        })
      });

      const response = await request(app).get('/dashboard/restaurants');
      expect(response.status).toBe(200);
    });

    test('handles file read error', async () => {
      mockFs.createReadStream.mockReturnValue({
        pipe: jest.fn().mockReturnValue({
          on: jest.fn((event, callback) => {
            if (event === 'error') {
              setTimeout(() => callback(new Error('File error')), 0);
            }
            return { on: jest.fn() };
          })
        })
      });

      const response = await request(app).get('/dashboard/restaurants');
      expect(response.status).toBe(500);
    });
  });

  describe('GET /dashboard/rescue-meals', () => {
    test('returns 200 status code', async () => {
      const mockData = [
        { 
          meal_name: 'Meal1', 
          original_price: '10.99', 
          rescue_price: '6.99', 
          quantity: '5',
          expires_in: '2 hours',
          restaurant: 'R1'
        }
      ];

      setupMockCSVRead(mockData);

      const response = await request(app).get('/dashboard/rescue-meals');
      expect(response.status).toBe(200);
    });

    test('returns formatted rescue meals', async () => {
      const mockData = [
        { 
          meal_name: 'Meal1', 
          original_price: '10.99', 
          rescue_price: '6.99', 
          quantity: '5',
          expires_in: '2 hours',
          restaurant: 'R1'
        }
      ];

      setupMockCSVRead(mockData);

      const response = await request(app).get('/dashboard/rescue-meals');
      expect(response.body[0].name).toBe('Meal1');
      expect(response.body[0].originalPrice).toBe(10.99);
      expect(response.body[0].rescuePrice).toBe(6.99);
    });

    test('handles file read error', async () => {
      mockFs.createReadStream.mockReturnValue({
        pipe: jest.fn().mockReturnValue({
          on: jest.fn((event, callback) => {
            if (event === 'error') {
              setTimeout(() => callback(new Error('File error')), 0);
            }
            return { on: jest.fn() };
          })
        })
      });

      const response = await request(app).get('/dashboard/rescue-meals');
      expect(response.status).toBe(500);
    });
  });

  describe('GET /dashboard/user-impact', () => {
    test('returns 200 status code', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync = jest.fn().mockReturnValue('[]');

      const response = await request(app).get('/dashboard/user-impact');
      expect(response.status).toBe(200);
    });

    test('calculates user impact metrics', async () => {
      const ordersData = [
        {
          items: [
            {
              isRescueMeal: true,
              quantity: 2,
              originalPrice: 10.99,
              rescuePrice: 6.99,
              restaurant: 'R1'
            }
          ]
        }
      ];

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(ordersData));

      const response = await request(app).get('/dashboard/user-impact');
      expect(response.body.mealsOrdered).toBe(2);
      expect(response.body.moneySaved).toBeDefined();
    });

    test('determines impact level', async () => {
      const ordersData = [
        {
          items: Array(50).fill({
            isRescueMeal: true,
            quantity: 1,
            originalPrice: 10.99,
            rescuePrice: 6.99
          })
        }
      ];

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(ordersData));

      const response = await request(app).get('/dashboard/user-impact');
      expect(response.body.impactLevel).toBe('Sustainability Champion');
    });
  });

  describe('GET /dashboard/community-stats', () => {
    test('returns 200 status code', async () => {
      const mockWasteData = [
        { servings: '10', quantity_lb: '5.0' }
      ];
      const mockDeliveryData = [
        { restaurant: 'R1', courier_id: 'C1' }
      ];

      setupMockCSVReadMultiple([mockWasteData, mockDeliveryData]);

      const response = await request(app).get('/dashboard/community-stats');
      expect(response.status).toBe(200);
    });

    test('calculates community statistics', async () => {
      const mockWasteData = [
        { servings: '10', quantity_lb: '2000.0' }
      ];
      const mockDeliveryData = [
        { restaurant: 'R1', courier_id: 'C1' },
        { restaurant: 'R2', courier_id: 'C2' }
      ];

      setupMockCSVReadMultiple([mockWasteData, mockDeliveryData]);

      const response = await request(app).get('/dashboard/community-stats');
      expect(response.body.mealsRescued).toBeDefined();
      expect(response.body.wastePreventedTons).toBeDefined();
    });
  });
});

// Helper function to setup mock CSV reading
function setupMockCSVRead(mockData) {
  mockFs.createReadStream.mockReturnValue({
    pipe: jest.fn().mockReturnValue({
      on: jest.fn((event, callback) => {
        if (event === 'data') {
          mockData.forEach(item => callback(item));
        } else if (event === 'end') {
          setTimeout(() => callback(), 0);
        }
        return { on: jest.fn() };
      })
    })
  });
}

// Helper function to setup multiple CSV reads
function setupMockCSVReadMultiple(mockDataArrays) {
  let callIndex = 0;
  mockFs.createReadStream.mockImplementation(() => {
    const data = callIndex < mockDataArrays.length ? mockDataArrays[callIndex] : [];
    callIndex++;
    return {
      pipe: jest.fn().mockReturnValue({
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            data.forEach(item => callback(item));
          } else if (event === 'end') {
            setTimeout(() => callback(), 0);
          }
          return { on: jest.fn() };
        })
      })
    };
  });
}

