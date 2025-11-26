/**
 * Dashboard component tests
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import Dashboard from '../components/Dashboard';

// Mock Cart to simplify DOM; Cart itself has its own tests
jest.mock('../components/Cart', () => {
  return function MockCart() {
    return <div data-testid="mock-cart">Mock Cart</div>;
  };
});

// Mock LeaderboardPanel to avoid additional fetches here
jest.mock('../components/LeaderboardPanel', () => {
  return function MockLeaderboard() {
    return <div data-testid="mock-leaderboard">Mock Leaderboard</div>;
  };
});

describe('Dashboard', () => {
  const mockUser = { email: 'test@example.com', name: 'Test User' };

  const createFetchMock = () => {
    return jest.fn((url) => {
      if (url === '/dashboard/restaurants-with-meals') {
        return Promise.resolve({
          json: () =>
            Promise.resolve([
              {
                id: 1,
                name: 'GreenBite Cafe',
                cuisine: 'Vegetarian',
                distance: 1.2,
                rating: 4.5,
                menus: [
                  {
                    id: 'meal-1',
                    name: 'Rescue Box',
                    rescuePrice: 5.0,
                    originalPrice: 15.0,
                    description: 'Surprise vegetarian rescue box',
                    tags: ['Vegetarian'],
                  },
                ],
              },
            ]),
        });
      }

      if (url === '/dashboard/community-stats') {
        return Promise.resolve({
          json: () =>
            Promise.resolve({
              activeUsers: 120,
              mealsRescued: 350,
              wastePreventedTons: 0.4,
            }),
        });
      }

      if (url.startsWith('/dashboard/user-impact')) {
        return Promise.resolve({
          json: () =>
            Promise.resolve({
              mealsOrdered: 3,
              moneySaved: 25,
              foodWastePrevented: 10,
              carbonReduced: 5,
              localRestaurantsSupported: 2,
              impactLevel: 'Food Hero',
            }),
        });
      }

      if (url === '/api/orders') {
        return Promise.resolve({
          json: () =>
            Promise.resolve({
              success: true,
              orders: [],
            }),
        });
      }

      return Promise.resolve({
        json: () => Promise.resolve({}),
      });
    });
  };

  beforeEach(() => {
    global.fetch = createFetchMock();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('renders browse view with restaurants after data load', async () => {
    render(<Dashboard user={mockUser} onLogout={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('GreenBite Cafe')).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith('/dashboard/restaurants-with-meals');
  });

  test('can switch between Browse, My Impact, and Community views', async () => {
    render(<Dashboard user={mockUser} onLogout={jest.fn()} />);

    // Wait for initial load so the component is stable
    await waitFor(() => {
      expect(screen.getByText('Browse Meals')).toBeInTheDocument();
    });

    // Switch to My Impact
    fireEvent.click(screen.getByText('My Impact'));
    await waitFor(() => {
      expect(
        screen.getByText('Your Environmental Impact')
      ).toBeInTheDocument();
    });

    // Switch to Community
    fireEvent.click(screen.getByText('Community'));
    await waitFor(() => {
      expect(screen.getByText('Community Impact')).toBeInTheDocument();
    });
  });

  test('shows cart view when cart is selected', async () => {
    render(<Dashboard user={mockUser} onLogout={jest.fn()} />);

    // Wait for initial data load
    await waitFor(() => {
      expect(screen.getByText('Browse Meals')).toBeInTheDocument();
    });

    // Open the mobile menu so that the "Cart" text button is rendered
    const header = screen.getByRole('banner');
    const headerButtons = within(header).getAllByRole('button');
    const menuToggle = headerButtons[headerButtons.length - 1];
    fireEvent.click(menuToggle);

    // Now click the Cart item in the mobile menu
    const cartButton = await screen.findByText('Cart');
    fireEvent.click(cartButton);

    await waitFor(() => {
      expect(screen.getByTestId('mock-cart')).toBeInTheDocument();
    });
  });
});
