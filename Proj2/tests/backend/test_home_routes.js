/**
 * Test suite for Home Routes (routes/home.js)
 * Tests: 10 test cases
 */
const request = require('supertest');
const express = require('express');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Mock fs and csv-parser
jest.mock('fs');
jest.mock('csv-parser');

const homeRoutes = require('../../src/backend/routes/home');

describe('Home Routes Tests', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/', homeRoutes);
  });

  describe('GET /restaurants', () => {
    test('returns 200 status code', async () => {
      const mockData = [
        { restaurant: 'Restaurant1', cuisine: 'Italian' },
        { restaurant: 'Restaurant2', cuisine: 'Mexican' }
      ];

      fs.createReadStream = jest.fn().mockReturnValue({
        pipe: jest.fn().mockReturnValue({
          on: jest.fn((event, callback) => {
            if (event === 'data') {
              mockData.forEach(item => callback(item));
            } else if (event === 'end') {
              setTimeout(() => callback(), 0);
            }
            return {
              on: jest.fn()
            };
          })
        })
      });

      const response = await request(app).get('/restaurants');
      expect(response.status).toBe(200);
    });

    test('returns array of restaurants', async () => {
      const mockData = [
        { restaurant: 'Restaurant1', cuisine: 'Italian' }
      ];

      fs.createReadStream = jest.fn().mockReturnValue({
        pipe: jest.fn().mockReturnValue({
          on: jest.fn((event, callback) => {
            if (event === 'data') {
              mockData.forEach(item => callback(item));
            } else if (event === 'end') {
              setTimeout(() => callback(), 0);
            }
            return {
              on: jest.fn()
            };
          })
        })
      });

      const response = await request(app).get('/restaurants');
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('handles file read error gracefully', async () => {
      fs.createReadStream = jest.fn().mockReturnValue({
        pipe: jest.fn().mockReturnValue({
          on: jest.fn((event, callback) => {
            if (event === 'error') {
              setTimeout(() => callback(new Error('File not found')), 0);
            }
            return {
              on: jest.fn()
            };
          })
        })
      });

      const response = await request(app).get('/restaurants');
      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /impact', () => {
    test('returns 200 status code', async () => {
      const mockWasteData = [
        { servings: '10', quantity_lb: '5.0' },
        { servings: '20', quantity_lb: '10.0' }
      ];

      let callCount = 0;
      fs.createReadStream = jest.fn().mockReturnValue({
        pipe: jest.fn().mockReturnValue({
          on: jest.fn((event, callback) => {
            if (event === 'data') {
              mockWasteData.forEach(item => callback(item));
            } else if (event === 'end') {
              callCount++;
              if (callCount === 1) {
                // First stream (waste data) ends
                setTimeout(() => callback(), 0);
              } else {
                // Second stream (users) ends
                setTimeout(() => callback(), 0);
              }
            } else if (event === 'error') {
              // Handle errors
            }
            return {
              on: jest.fn()
            };
          })
        })
      });

      const response = await request(app).get('/impact');
      expect(response.status).toBe(200);
    });

    test('calculates total meals rescued', async () => {
      const mockWasteData = [
        { servings: '10', quantity_lb: '5.0' },
        { servings: '20', quantity_lb: '10.0' }
      ];

      let callCount = 0;
      fs.createReadStream = jest.fn().mockReturnValue({
        pipe: jest.fn().mockReturnValue({
          on: jest.fn((event, callback) => {
            if (event === 'data') {
              mockWasteData.forEach(item => callback(item));
            } else if (event === 'end') {
              callCount++;
              setTimeout(() => callback(), 0);
            }
            return {
              on: jest.fn()
            };
          })
        })
      });

      const response = await request(app).get('/impact');
      expect(response.body.mealsRescued).toBeDefined();
    });

    test('calculates waste prevented in tons', async () => {
      const mockWasteData = [
        { servings: '10', quantity_lb: '2000.0' }  // 1 ton
      ];

      let callCount = 0;
      fs.createReadStream = jest.fn().mockReturnValue({
        pipe: jest.fn().mockReturnValue({
          on: jest.fn((event, callback) => {
            if (event === 'data') {
              mockWasteData.forEach(item => callback(item));
            } else if (event === 'end') {
              callCount++;
              setTimeout(() => callback(), 0);
            }
            return {
              on: jest.fn()
            };
          })
        })
      });

      const response = await request(app).get('/impact');
      expect(response.body.wastePreventedTons).toBeDefined();
    });

    test('includes community impact', async () => {
      const mockWasteData = [
        { servings: '10', quantity_lb: '5.0' }
      ];

      let callCount = 0;
      fs.createReadStream = jest.fn().mockReturnValue({
        pipe: jest.fn().mockReturnValue({
          on: jest.fn((event, callback) => {
            if (event === 'data') {
              mockWasteData.forEach(item => callback(item));
            } else if (event === 'end') {
              callCount++;
              setTimeout(() => callback(), 0);
            }
            return {
              on: jest.fn()
            };
          })
        })
      });

      const response = await request(app).get('/impact');
      expect(response.body.communityImpact).toBeDefined();
    });

    test('handles invalid numeric values', async () => {
      const mockWasteData = [
        { servings: 'invalid', quantity_lb: 'not_a_number' }
      ];

      let callCount = 0;
      fs.createReadStream = jest.fn().mockReturnValue({
        pipe: jest.fn().mockReturnValue({
          on: jest.fn((event, callback) => {
            if (event === 'data') {
              mockWasteData.forEach(item => callback(item));
            } else if (event === 'end') {
              callCount++;
              setTimeout(() => callback(), 0);
            }
            return {
              on: jest.fn()
            };
          })
        })
      });

      const response = await request(app).get('/impact');
      expect(response.status).toBe(200);
      // Should handle NaN gracefully
    });

    test('handles file read error for waste file', async () => {
      fs.createReadStream = jest.fn().mockReturnValue({
        pipe: jest.fn().mockReturnValue({
          on: jest.fn((event, callback) => {
            if (event === 'error') {
              setTimeout(() => callback(new Error('File not found')), 0);
            }
            return {
              on: jest.fn()
            };
          })
        })
      });

      const response = await request(app).get('/impact');
      expect(response.status).toBe(500);
    });

    test('handles file read error for users file', async () => {
      const mockWasteData = [
        { servings: '10', quantity_lb: '5.0' }
      ];

      let callCount = 0;
      fs.createReadStream = jest.fn().mockImplementation((filePath) => {
        if (filePath.includes('users')) {
          return {
            pipe: jest.fn().mockReturnValue({
              on: jest.fn((event, callback) => {
                if (event === 'error') {
                  setTimeout(() => callback(new Error('File not found')), 0);
                }
                return {
                  on: jest.fn()
                };
              })
            })
          };
        } else {
          return {
            pipe: jest.fn().mockReturnValue({
              on: jest.fn((event, callback) => {
                if (event === 'data') {
                  mockWasteData.forEach(item => callback(item));
                } else if (event === 'end') {
                  callCount++;
                  setTimeout(() => callback(), 0);
                }
                return {
                  on: jest.fn()
                };
              })
            })
          };
        }
      });

      const response = await request(app).get('/impact');
      expect(response.status).toBe(500);
    });
  });
});

