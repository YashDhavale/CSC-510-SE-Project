/**
 * Test suite for Home component
 * Tests: 6 test cases
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '../components/Home';

// Mock fetch
global.fetch = jest.fn();

describe('Home Component', () => {
  beforeEach(() => {
    fetch.mockClear();
    // Default mock for all tests
    fetch.mockResolvedValue({
      json: async () => []
    });
  });

  test('renders Home component', async () => {
    render(<Home onNavigate={jest.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('Fighting Food Waste, One Meal at a Time')).toBeInTheDocument();
    });
  });

  test('displays feature cards', async () => {
    render(<Home onNavigate={jest.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('Save the Planet')).toBeInTheDocument();
      expect(screen.getByText('Save Money')).toBeInTheDocument();
      expect(screen.getByText('Support Local')).toBeInTheDocument();
    });
  });

  test('fetches restaurants on mount', async () => {
    const mockRestaurants = [
      { restaurant: 'Restaurant 1', cuisine: 'Italian' },
      { restaurant: 'Restaurant 2', cuisine: 'Mexican' }
    ];
    fetch
      .mockResolvedValueOnce({
        json: async () => mockRestaurants,
      })
      .mockResolvedValueOnce({
        json: async () => ({ mealsRescued: 0, wastePreventedTons: 0, communityImpact: 0 })
      });

    render(<Home onNavigate={jest.fn()} />);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/restaurants');
    });
  });

  test('fetches impact stats on mount', async () => {
    const mockImpact = {
      mealsRescued: '1000',
      wastePreventedTons: '5.0',
      communityImpact: 50
    };
    fetch
      .mockResolvedValueOnce({ json: async () => [] })
      .mockResolvedValueOnce({ json: async () => mockImpact });

    render(<Home onNavigate={jest.fn()} />);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/impact');
    });
  });

  test('displays community impact section', async () => {
    render(<Home onNavigate={jest.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('Community Impact')).toBeInTheDocument();
      expect(screen.getByText('Meals Rescued')).toBeInTheDocument();
      expect(screen.getByText('Waste Prevented')).toBeInTheDocument();
      expect(screen.getByText('Active Users')).toBeInTheDocument();
    });
  });

  test('navigates to login when Join Us button is clicked', async () => {
    const mockNavigate = jest.fn();
    render(<Home onNavigate={mockNavigate} />);
    await waitFor(() => {
      const joinButton = screen.getByText('Join Us Today');
      fireEvent.click(joinButton);
      expect(mockNavigate).toHaveBeenCalledWith('login');
    });
  });
});

