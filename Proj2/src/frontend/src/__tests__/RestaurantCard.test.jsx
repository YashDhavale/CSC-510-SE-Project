/**
 * Test suite for RestaurantCard component
 * Tests: 3 test cases
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import RestaurantCard from '../components/RestaurantCard';

describe('RestaurantCard Component', () => {
  test('renders RestaurantCard with name', () => {
    render(<RestaurantCard name="Test Restaurant" cuisine="Italian" rating={4.5} />);
    expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
  });

  test('displays cuisine type', () => {
    render(<RestaurantCard name="Test Restaurant" cuisine="Italian" rating={4.5} />);
    expect(screen.getByText('Italian')).toBeInTheDocument();
  });

  test('displays rating', () => {
    render(<RestaurantCard name="Test Restaurant" cuisine="Italian" rating={4.5} />);
    expect(screen.getByText(/4.5/)).toBeInTheDocument();
  });
});

