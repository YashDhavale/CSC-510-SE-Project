/**
 * Dashboard component tests
 */
import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
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
                address: '123 Main St',
                hours: '5–9 PM',
                menus: [
                  {
                    id: 'meal-1',
                    name: 'Rescue Box',
                    rescuePrice: 5.0,
                    originalPrice: 15.0,
                    description: 'Surprise vegetarian rescue box',
                    pickupWindow: '5–7 PM',
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

  afterEach(() => {
    jest.resetAllMocks();
  });

  beforeEach(() => {
    global.fetch = createFetchMock();
  });

  test('renders browse view with restaurants after data load', async () => {
    render(<Dashboard user={mockUser} onLogout={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('GreenBite Cafe')).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/dashboard/restaurants-with-meals'
    );
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

  test('shows cart view when cart is selected from mobile menu', async () => {
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

  test('filters restaurants by search text and cuisine filter', async () => {
    // Override fetch with richer restaurant data for this test
    global.fetch = jest.fn((url) => {
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
                menus: [],
              },
              {
                id: 2,
                name: 'Spicy Dragon',
                cuisine: 'Chinese',
                distance: 2.5,
                rating: 4.7,
                menus: [],
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
              mealsOrdered: 0,
              moneySaved: 0,
              foodWastePrevented: 0,
              carbonReduced: 0,
              localRestaurantsSupported: 0,
              impactLevel: 'Getting Started',
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

    render(<Dashboard user={mockUser} onLogout={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('GreenBite Cafe')).toBeInTheDocument();
      expect(screen.getByText('Spicy Dragon')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(
      'Search by restaurant or cuisine...'
    );

    // Search for "Spicy" should hide GreenBite Cafe
    fireEvent.change(searchInput, { target: { value: 'Spicy' } });

    await waitFor(() => {
      expect(screen.getByText('Spicy Dragon')).toBeInTheDocument();
      expect(screen.queryByText('GreenBite Cafe')).not.toBeInTheDocument();
    });

    // Clear search and filter by cuisine
    fireEvent.change(searchInput, { target: { value: '' } });

    const vegetarianButton = screen.getByText('Vegetarian');
    fireEvent.click(vegetarianButton);

    await waitFor(() => {
      expect(screen.getByText('GreenBite Cafe')).toBeInTheDocument();
      expect(screen.queryByText('Spicy Dragon')).not.toBeInTheDocument();
    });
  });

  test('opens restaurant detail, adds meal to cart, shows toast and cart badge', async () => {
    render(<Dashboard user={mockUser} onLogout={jest.fn()} />);

    // Wait for restaurant list
    await waitFor(() => {
      expect(screen.getByText('GreenBite Cafe')).toBeInTheDocument();
    });

    // Open restaurant detail directly via button
    const viewMealsButton = screen.getByText('View Rescue Meals');
    fireEvent.click(viewMealsButton);

    // Wait for detail view
    await waitFor(() => {
      expect(
        screen.getByText('Available Rescue Meals')
      ).toBeInTheDocument();
    });

    // Click Add to Cart for the listed meal
    const addToCartButton = screen.getByText('Add to Cart');
    fireEvent.click(addToCartButton);

    // Toast should appear
    await waitFor(() => {
      expect(screen.getByText('Added to cart')).toBeInTheDocument();
    });

    // Header should show cart badge with "1"
    const header = screen.getByRole('banner');
    expect(within(header).getByText('1')).toBeInTheDocument();
  });

  test('Rescue Again uses order history to rebuild cart and opens cart view', async () => {
    // Custom fetch: include one past order for this user
    global.fetch = jest.fn((url) => {
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
                menus: [],
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
              orders: [
                {
                  id: 'order-1',
                  userEmail: mockUser.email,
                  timestamp: '2024-01-01T12:00:00Z',
                  items: [
                    { restaurant: 'GreenBite Cafe', quantity: 2 },
                  ],
                  totals: {
                    total: 10,
                    rescueMealCount: 2,
                  },
                },
              ],
            }),
        });
      }

      return Promise.resolve({
        json: () => Promise.resolve({}),
      });
    });

    render(<Dashboard user={mockUser} onLogout={jest.fn()} />);

    // Wait for initial browse view
    await waitFor(() => {
      expect(screen.getByText('Browse Meals')).toBeInTheDocument();
    });

    // Switch to My Impact
    fireEvent.click(screen.getByText('My Impact'));

    // Wait for order history to show
    await waitFor(() => {
      expect(screen.getByText('Your Recent Orders')).toBeInTheDocument();
      expect(screen.getByText('GreenBite Cafe')).toBeInTheDocument();
      expect(screen.getByText('Rescue Again')).toBeInTheDocument();
    });

    // Click Rescue Again
    const rescueAgainButton = screen.getByText('Rescue Again');
    fireEvent.click(rescueAgainButton);

    // Should navigate to cart view (mocked Cart component)
    await waitFor(() => {
      expect(screen.getByTestId('mock-cart')).toBeInTheDocument();
    });
  });
});
