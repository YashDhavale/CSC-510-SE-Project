/**
 * Test suite for Home Routes (routes/home.js)
 * Tests: 10 test cases
 */
const request = require('supertest');
const express = require('express');
const path = require('path');

// Mock fs and csv-parser BEFORE requiring routes
jest.mock('fs', () => {
  const actualFs = jest.requireActual('fs');
  return {
    ...actualFs,
    createReadStream: jest.fn()
  };
});

jest.mock('csv-parser', () => {
  return jest.fn(() => ({
    on: jest.fn()
  }));
});

const homeRoutes = require('../../src/backend/routes/home');
const fs = require('fs');
const csv = require('csv-parser');

describe('Home Routes Tests', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
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

      const mockStream = {
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            mockData.forEach(item => setTimeout(() => callback(item), 0));
          } else if (event === 'end') {
            setTimeout(() => callback(), 10);
          }
          return mockStream;
        })
      };

      fs.createReadStream.mockReturnValue({
        pipe: jest.fn(() => mockStream)
      });

      const response = await request(app).get('/restaurants');
      expect(response.status).toBe(200);
    });

    test('returns array of restaurants', async () => {
      const mockData = [
        { restaurant: 'Restaurant1', cuisine: 'Italian' }
      ];

      const mockStream = {
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            mockData.forEach(item => setTimeout(() => callback(item), 0));
          } else if (event === 'end') {
            setTimeout(() => callback(), 10);
          }
          return mockStream;
        })
      };

      fs.createReadStream.mockReturnValue({
        pipe: jest.fn(() => mockStream)
      });

      const response = await request(app).get('/restaurants');
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('handles file read error gracefully', async () => {
      const mockStream = {
        on: jest.fn((event, callback) => {
          if (event === 'error') {
            setTimeout(() => callback(new Error('File not found')), 10);
          }
          return mockStream;
        })
      };

      fs.createReadStream.mockReturnValue({
        pipe: jest.fn(() => mockStream)
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
      const mockUserData = [{ name: 'User1' }];

      let streamCallCount = 0;
      fs.createReadStream.mockImplementation((filePath) => {
        streamCallCount++;
        const isWasteFile = filePath.includes('Raleigh_Food_Waste') || filePath.includes('waste');
        const mockData = isWasteFile ? mockWasteData : mockUserData;
        
        const mockStream = {
          on: jest.fn((event, callback) => {
            if (event === 'data') {
              mockData.forEach(item => setTimeout(() => callback(item), 0));
            } else if (event === 'end') {
              setTimeout(() => callback(), 20);
            }
            return mockStream;
          })
        };

        return {
          pipe: jest.fn(() => mockStream)
        };
      });

      const response = await request(app).get('/impact');
      expect(response.status).toBe(200);
    });

    test('calculates total meals rescued', async () => {
      const mockWasteData = [
        { servings: '10', quantity_lb: '5.0' },
        { servings: '20', quantity_lb: '10.0' }
      ];
      const mockUserData = [{ name: 'User1' }];

      fs.createReadStream.mockImplementation((filePath) => {
        const isWasteFile = filePath.includes('Raleigh_Food_Waste') || filePath.includes('waste');
        const mockData = isWasteFile ? mockWasteData : mockUserData;
        
        const mockStream = {
          on: jest.fn((event, callback) => {
            if (event === 'data') {
              mockData.forEach(item => setTimeout(() => callback(item), 0));
            } else if (event === 'end') {
              setTimeout(() => callback(), 20);
            }
            return mockStream;
          })
        };

        return {
          pipe: jest.fn(() => mockStream)
        };
      });

      const response = await request(app).get('/impact');
      expect(response.body.mealsRescued).toBeDefined();
    });

    test('calculates waste prevented in tons', async () => {
      const mockWasteData = [
        { servings: '10', quantity_lb: '2000.0' }  // 1 ton
      ];
      const mockUserData = [{ name: 'User1' }];

      fs.createReadStream.mockImplementation((filePath) => {
        const isWasteFile = filePath.includes('Raleigh_Food_Waste') || filePath.includes('waste');
        const mockData = isWasteFile ? mockWasteData : mockUserData;
        
        const mockStream = {
          on: jest.fn((event, callback) => {
            if (event === 'data') {
              mockData.forEach(item => setTimeout(() => callback(item), 0));
            } else if (event === 'end') {
              setTimeout(() => callback(), 20);
            }
            return mockStream;
          })
        };

        return {
          pipe: jest.fn(() => mockStream)
        };
      });

      const response = await request(app).get('/impact');
      expect(response.body.wastePreventedTons).toBeDefined();
    });

    test('includes community impact', async () => {
      const mockWasteData = [
        { servings: '10', quantity_lb: '5.0' }
      ];
      const mockUserData = [{ name: 'User1' }, { name: 'User2' }];

      fs.createReadStream.mockImplementation((filePath) => {
        const isWasteFile = filePath.includes('Raleigh_Food_Waste') || filePath.includes('waste');
        const mockData = isWasteFile ? mockWasteData : mockUserData;
        
        const mockStream = {
          on: jest.fn((event, callback) => {
            if (event === 'data') {
              mockData.forEach(item => setTimeout(() => callback(item), 0));
            } else if (event === 'end') {
              setTimeout(() => callback(), 20);
            }
            return mockStream;
          })
        };

        return {
          pipe: jest.fn(() => mockStream)
        };
      });

      const response = await request(app).get('/impact');
      expect(response.body.communityImpact).toBeDefined();
    });

    test('handles invalid numeric values', async () => {
      const mockWasteData = [
        { servings: 'invalid', quantity_lb: 'not_a_number' }
      ];
      const mockUserData = [{ name: 'User1' }];

      fs.createReadStream.mockImplementation((filePath) => {
        const isWasteFile = filePath.includes('Raleigh_Food_Waste') || filePath.includes('waste');
        const mockData = isWasteFile ? mockWasteData : mockUserData;
        
        const mockStream = {
          on: jest.fn((event, callback) => {
            if (event === 'data') {
              mockData.forEach(item => setTimeout(() => callback(item), 0));
            } else if (event === 'end') {
              setTimeout(() => callback(), 20);
            }
            return mockStream;
          })
        };

        return {
          pipe: jest.fn(() => mockStream)
        };
      });

      const response = await request(app).get('/impact');
      expect(response.status).toBe(200);
      // Should handle NaN gracefully
    });

    test('handles file read error for waste file', async () => {
      const mockStream = {
        on: jest.fn((event, callback) => {
          if (event === 'error') {
            setTimeout(() => callback(new Error('File not found')), 10);
          }
          return mockStream;
        })
      };

      fs.createReadStream.mockReturnValue({
        pipe: jest.fn(() => mockStream)
      });

      const response = await request(app).get('/impact');
      expect(response.status).toBe(500);
    });

    test('handles file read error for users file', async () => {
      const mockWasteData = [
        { servings: '10', quantity_lb: '5.0' }
      ];

      fs.createReadStream.mockImplementation((filePath) => {
        const isWasteFile = filePath.includes('Raleigh_Food_Waste') || filePath.includes('waste');
        
        if (isWasteFile) {
          const mockStream = {
            on: jest.fn((event, callback) => {
              if (event === 'data') {
                mockWasteData.forEach(item => setTimeout(() => callback(item), 0));
              } else if (event === 'end') {
                setTimeout(() => callback(), 20);
              }
              return mockStream;
            })
          };
          return {
            pipe: jest.fn(() => mockStream)
          };
        } else {
          // Users file error
          const mockStream = {
            on: jest.fn((event, callback) => {
              if (event === 'error') {
                setTimeout(() => callback(new Error('File not found')), 10);
              }
              return mockStream;
            })
          };
          return {
            pipe: jest.fn(() => mockStream)
          };
        }
      });

      const response = await request(app).get('/impact');
      expect(response.status).toBe(500);
    });
  });
});

