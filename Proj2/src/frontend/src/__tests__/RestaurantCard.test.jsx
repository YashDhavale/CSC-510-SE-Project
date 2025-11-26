/**
 * RestaurantCard component tests
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import RestaurantCard from '../components/RestaurantCard';

describe('RestaurantCard', () => {
  test('renders restaurant information', () => {
    render(
      <RestaurantCard
        name="GreenBite Cafe"
        cuisine="Vegetarian"
        rating={4.5}
      />
    );

    expect(screen.getByText('GreenBite Cafe')).toBeInTheDocument();
    expect(screen.getByText('Vegetarian')).toBeInTheDocument();
    expect(screen.getByText(/4.5/)).toBeInTheDocument();
  });
});
