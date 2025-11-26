/**
 * App component tests - navigation and auth flow
 */
import React from 'react';
import {
  render,
  screen,
  waitFor,
  fireEvent,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';

describe('App', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  function createHomeFetchMock() {
    return jest.fn((url) => {
      if (url === '/restaurants') {
        return Promise.resolve({
          json: () =>
            Promise.resolve([
              {
                id: 1,
                name: 'GreenBite Cafe',
                cuisine: 'Vegetarian',
              },
            ]),
        });
      }
      if (url === '/impact') {
        return Promise.resolve({
          json: () =>
            Promise.resolve({
              mealsRescued: 0,
              wastePrevented: '',
              activeUsers: 0,
            }),
        });
      }
      // default fallback
      return Promise.resolve({
        json: () => Promise.resolve({}),
      });
    });
  }

  function createFullAppFetchMock() {
    return jest.fn((url) => {
      if (url === '/restaurants') {
        return Promise.resolve({
          json: () =>
            Promise.resolve([
              {
                id: 1,
                name: 'GreenBite Cafe',
                cuisine: 'Vegetarian',
              },
            ]),
        });
      }
      if (url === '/impact') {
        return Promise.resolve({
          json: () =>
            Promise.resolve({
              mealsRescued: 1200,
              wastePrevented: '500 lbs',
              activeUsers: 250,
            }),
        });
      }
      if (url === '/login') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              user: { name: 'Test User', email: 'test@example.com' },
            }),
        });
      }
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
  }

  test('renders navbar and home hero content by default', async () => {
    global.fetch = createHomeFetchMock();
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

  test('navigates from home to login choice and customer login', async () => {
    global.fetch = createHomeFetchMock();
    render(<App />);

    // Wait for home to be ready
    await waitFor(() => {
      expect(
        screen.getByText('Fighting Food Waste, One Meal at a Time')
      ).toBeInTheDocument();
    });

    // Click Get Started on Navbar
    fireEvent.click(screen.getByText('Get Started'));

    // Should see LoginChoice page
    await waitFor(() => {
      expect(
        screen.getByText('Choose your account type to continue')
      ).toBeInTheDocument();
    });

    // Click "Continue as Customer"
    fireEvent.click(screen.getByText('Continue as Customer'));

    // Now CustomerLogin should be visible
    await waitFor(() => {
      expect(screen.getByText('Customer Login')).toBeInTheDocument();
    });
  });

  test('logs in and shows dashboard after login', async () => {
    global.fetch = createFullAppFetchMock();
    render(<App />);

    // Wait for home
    await waitFor(() => {
      expect(
        screen.getByText('Fighting Food Waste, One Meal at a Time')
      ).toBeInTheDocument();
    });

    // Go to login choice
    fireEvent.click(screen.getByText('Get Started'));

    await waitFor(() => {
      expect(
        screen.getByText('Choose your account type to continue')
      ).toBeInTheDocument();
    });

    // Go to customer login
    fireEvent.click(screen.getByText('Continue as Customer'));

    await waitFor(() => {
      expect(screen.getByText('Customer Login')).toBeInTheDocument();
    });

    // Fill login form
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByText('Login'));

    // After successful login, dashboard should appear
    await waitFor(() => {
      expect(screen.getByText('Browse Meals')).toBeInTheDocument();
    });
  });
});
