/**
 * App component tests
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';

describe('App', () => {
  beforeEach(() => {
    // Default fetch mock used by Home component
    global.fetch = jest.fn((url) => {
      if (url === '/restaurants') {
        return Promise.resolve({
          json: () => Promise.resolve([]),
        });
      }
      if (url === '/impact') {
        return Promise.resolve({
          json: () => Promise.resolve({
            mealsRescued: 0,
            wastePrevented: '',
            activeUsers: 0,
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

  test('renders navbar and home hero content by default', async () => {
    render(<App />);

    // Navbar title
    expect(screen.getByText('Tiffin Trails')).toBeInTheDocument();

    // Home hero title
    await waitFor(() => {
      expect(
        screen.getByText('Fighting Food Waste, One Meal at a Time')
      ).toBeInTheDocument();
    });
  });
});
