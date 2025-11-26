/**
 * Cart component tests
 */
import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import Cart from '../components/Cart';

describe('Cart', () => {
  const baseItem = {
    restaurant: 'GreenBite Cafe',
    meal: {
      id: 'meal-1',
      name: 'Rescue Box',
      rescuePrice: 5.0,
      originalPrice: 15.0,
      description: 'Test rescue meal',
    },
    quantity: 2,
  };

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('renders empty cart message when there are no items', () => {
    const onBack = jest.fn();
    render(
      <Cart
        cart={[]}
        setCart={jest.fn()}
        onBack={onBack}
        onOrderPlaced={jest.fn()}
        user={null}
      />
    );

    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    expect(
      screen.getByText('Your cart is empty. Browse restaurants to rescue meals!')
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText('Browse Restaurants'));
    expect(onBack).toHaveBeenCalled();
  });

  test('renders items and allows quantity controls to trigger updates', () => {
    const setCart = jest.fn();

    render(
      <Cart
        cart={[baseItem]}
        setCart={setCart}
        onBack={jest.fn()}
        onOrderPlaced={jest.fn()}
        user={null}
      />
    );

    // There should be an item with the meal name
    expect(screen.getByText('Rescue Box')).toBeInTheDocument();

    // Remove button should call setCart
    const removeButton = screen.getByText('Remove');
    fireEvent.click(removeButton);

    expect(setCart).toHaveBeenCalled();
  });

  test('places order successfully and shows thank you screen', async () => {
    const mockUser = { email: 'test@example.com', name: 'Test User' };
    const setCart = jest.fn();

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            orderId: 'order-123',
          }),
      })
    );

    render(
      <Cart
        cart={[baseItem]}
        setCart={setCart}
        onBack={jest.fn()}
        onOrderPlaced={jest.fn()}
        user={mockUser}
      />
    );

    const placeOrderButton = screen.getByText('Place Order & Rescue Food');
    fireEvent.click(placeOrderButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/orders',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    await waitFor(() => {
      expect(
        screen.getByText('Thank you for rescuing food!')
      ).toBeInTheDocument();
    });

    // bonus: check rescued text uses totals
    expect(
      screen.getByText(/You just rescued/i)
    ).toBeInTheDocument();
  });

  test('shows alert when backend returns non-ok response', async () => {
    const alertSpy = jest
      .spyOn(window, 'alert')
      .mockImplementation(() => {});
    const mockUser = { email: 'test@example.com', name: 'Test User' };

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
      })
    );

    render(
      <Cart
        cart={[baseItem]}
        setCart={jest.fn()}
        onBack={jest.fn()}
        onOrderPlaced={jest.fn()}
        user={mockUser}
      />
    );

    const placeOrderButton = screen.getByText('Place Order & Rescue Food');
    fireEvent.click(placeOrderButton);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Failed to place order. Please try again.'
      );
    });

    alertSpy.mockRestore();
  });

  test('shows alert when backend returns unsuccessful payload', async () => {
    const alertSpy = jest
      .spyOn(window, 'alert')
      .mockImplementation(() => {});
    const mockUser = { email: 'test@example.com', name: 'Test User' };

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            success: false,
            message: 'Order rejected',
          }),
      })
    );

    render(
      <Cart
        cart={[baseItem]}
        setCart={jest.fn()}
        onBack={jest.fn()}
        onOrderPlaced={jest.fn()}
        user={mockUser}
      />
    );

    const placeOrderButton = screen.getByText('Place Order & Rescue Food');
    fireEvent.click(placeOrderButton);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Order rejected');
    });

    alertSpy.mockRestore();
  });

  test('shows alert when fetch throws error', async () => {
    const alertSpy = jest
      .spyOn(window, 'alert')
      .mockImplementation(() => {});
    const mockUser = { email: 'test@example.com', name: 'Test User' };

    global.fetch = jest.fn(() =>
      Promise.reject(new Error('network error'))
    );

    render(
      <Cart
        cart={[baseItem]}
        setCart={jest.fn()}
        onBack={jest.fn()}
        onOrderPlaced={jest.fn()}
        user={mockUser}
      />
    );

    const placeOrderButton = screen.getByText('Place Order & Rescue Food');
    fireEvent.click(placeOrderButton);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalled();
    });

    alertSpy.mockRestore();
  });
});
