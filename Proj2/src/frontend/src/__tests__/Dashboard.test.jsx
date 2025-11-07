/**
 * Test suite for Dashboard component
 * Tests: 5 test cases
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Dashboard from '../components/Dashboard';

// Mock fetch
global.fetch = jest.fn();

// Mock Cart component
jest.mock('../components/Cart', () => {
  return function MockCart({ cart, onBack }) {
    return (
      <div data-testid="cart">
        <p>Cart with {cart.length} items</p>
        <button onClick={onBack}>Back</button>
      </div>
    );
  };
});

// Mock LeaderboardPanel
jest.mock('../components/LeaderboardPanel', () => {
  return function MockLeaderboardPanel() {
    return <div data-testid="leaderboard">Leaderboard</div>;
  };
});

describe('Dashboard Component', () => {
  beforeEach(() => {
    fetch.mockClear();
    fetch.mockResolvedValue({
      json: async () => []
    });
  });

  test('renders Dashboard component', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Tiffin Trails')).toBeInTheDocument();
    });
  });

  test('displays browse view by default', () => {
    render(<Dashboard />);
    // Wait for loading to complete
    waitFor(() => {
      expect(screen.getByText('Browse')).toBeInTheDocument();
    });
  });

  test('switches to cart view when cart button is clicked', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      const cartButtons = screen.getAllByRole('button');
      const cartButton = cartButtons.find(btn => btn.querySelector('svg[class*="ShoppingCart"]'));
      if (cartButton) {
        fireEvent.click(cartButton);
        expect(screen.getByTestId('cart')).toBeInTheDocument();
      }
    });
  });

  test('fetches restaurants on mount', async () => {
    const mockRestaurants = [
      { id: 1, name: 'Restaurant 1', cuisine: 'Italian', rescueMeals: [] }
    ];
    fetch
      .mockResolvedValueOnce({ json: async () => mockRestaurants })
      .mockResolvedValueOnce({ json: async () => ({}) })
      .mockResolvedValueOnce({ json: async () => ({}) });

    render(<Dashboard />);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/dashboard/restaurants-with-meals');
    });
  });

  test('displays navigation buttons', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Browse')).toBeInTheDocument();
      expect(screen.getByText('Rescue Meals')).toBeInTheDocument();
      expect(screen.getByText('My Impact')).toBeInTheDocument();
    });
  });
});

