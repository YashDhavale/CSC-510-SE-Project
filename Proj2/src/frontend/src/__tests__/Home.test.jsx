/**
 * Home component tests
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '../components/Home';

describe('Home', () => {
  beforeEach(() => {
    global.fetch = jest.fn((url) => {
      if (url === '/restaurants') {
        return Promise.resolve({
          json: () =>
            Promise.resolve([
              {
                id: 1,
                name: 'GreenBite Cafe',
                cuisine: 'Vegetarian',
                neighborhood: 'Downtown',
              },
              {
                id: 2,
                name: 'Sunrise Deli',
                cuisine: 'American',
                neighborhood: 'Midtown',
              },
            ]),
        });
      }
      if (url === '/impact') {
        return Promise.resolve({
          json: () =>
            Promise.resolve({
              mealsRescued: 1234,
              wastePrevented: '500 lbs',
              activeUsers: 250,
            }),
        });
      }
      return Promise.resolve({
        json: () => Promise.resolve({}),
      });
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('renders hero title and calls restaurants and impact endpoints', async () => {
    render(<Home onNavigate={jest.fn()} />);

    expect(
      screen.getByText('Fighting Food Waste, One Meal at a Time')
    ).toBeInTheDocument();

    // Wait for restaurants to be rendered
    await waitFor(() => {
      expect(screen.getByText('GreenBite Cafe')).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith('/restaurants');
    expect(global.fetch).toHaveBeenCalledWith('/impact');
  });

  test('shows featured partner restaurants', async () => {
    render(<Home onNavigate={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('GreenBite Cafe')).toBeInTheDocument();
    });

    // Just ensure at least one partner name from mock data appears
    expect(screen.getByText('GreenBite Cafe')).toBeInTheDocument();
    expect(screen.getByText('Sunrise Deli')).toBeInTheDocument();
  });
});
