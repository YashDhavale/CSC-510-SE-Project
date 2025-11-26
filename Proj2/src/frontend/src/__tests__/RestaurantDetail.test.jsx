/**
 * RestaurantDetail component tests
 */
import React from 'react';
import {
  render,
  screen,
  fireEvent,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import RestaurantDetail from '../components/RestaurantDetail';

describe('RestaurantDetail', () => {
  test('returns null when restaurant is not provided', () => {
    const { container } = render(
      <RestaurantDetail
        restaurant={null}
        onBack={jest.fn()}
        onAddToCart={jest.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  test('calls onBack when Back to Browse is clicked', () => {
    const onBack = jest.fn();
    const restaurant = {
      id: 1,
      name: 'GreenBite Cafe',
      cuisine: 'Vegetarian',
      distance: 1.2,
      rating: 4.5,
      address: '123 Main St',
      menus: [],
    };

    render(
      <RestaurantDetail
        restaurant={restaurant}
        onBack={onBack}
        onAddToCart={jest.fn()}
      />
    );

    const backButton = screen.getByText('Back to Browse');
    fireEvent.click(backButton);

    expect(onBack).toHaveBeenCalled();
  });

  test('calls onAddToCart with selected menu meal when Add to Cart is clicked', () => {
    const onAddToCart = jest.fn();
    const restaurant = {
      id: 2,
      name: 'Spicy Dragon',
      cuisine: 'Chinese',
      distance: 2.5,
      rating: 4.7,
      address: '456 Dragon St',
      menus: [
        {
          id: 'meal-1',
          name: 'Spicy Rescue Box',
          rescuePrice: 6.0,
          originalPrice: 18.0,
          description: 'Spicy surprise box',
          pickupWindow: '6–8 PM',
        },
      ],
    };

    render(
      <RestaurantDetail
        restaurant={restaurant}
        onBack={jest.fn()}
        onAddToCart={onAddToCart}
      />
    );

    const addToCartButton = screen.getByText('Add to Cart');
    fireEvent.click(addToCartButton);

    expect(onAddToCart).toHaveBeenCalledTimes(1);
    const [passedRestaurant, passedMeal] = onAddToCart.mock.calls[0];
    expect(passedRestaurant.name).toBe('Spicy Dragon');
    expect(passedMeal.name).toBe('Spicy Rescue Box');
  });

  test('uses default rescue meal when restaurant has no menus', () => {
    const onAddToCart = jest.fn();
    const restaurant = {
      id: 3,
      name: 'NoMenu Cafe',
      cuisine: 'Cafe',
      distance: 0.8,
      rating: 4.0,
      address: '789 Hidden St',
      menus: [],
    };

    render(
      <RestaurantDetail
        restaurant={restaurant}
        onBack={jest.fn()}
        onAddToCart={onAddToCart}
      />
    );

    const reserveButton = screen.getByText('Reserve a Rescue Meal Box');
    fireEvent.click(reserveButton);

    expect(onAddToCart).toHaveBeenCalledTimes(1);
    const [passedRestaurant, passedMeal] = onAddToCart.mock.calls[0];

    expect(passedRestaurant.name).toBe('NoMenu Cafe');
    expect(passedMeal.name).toBe('Rescue Meal Box');
    expect(passedMeal.id).toContain('-default-rescue');
  });
});
