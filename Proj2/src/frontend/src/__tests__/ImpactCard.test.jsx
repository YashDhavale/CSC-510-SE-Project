/**
 * Test suite for ImpactCard component
 * Tests: 3 test cases
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ImpactCard from '../components/ImpactCard';

describe('ImpactCard Component', () => {
  test('renders ImpactCard with value', () => {
    render(<ImpactCard label="Test Label" value="100" />);
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  test('displays label', () => {
    render(<ImpactCard label="Test Label" value="100" />);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  test('renders with different values', () => {
    render(<ImpactCard label="Meals Rescued" value="500" />);
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText('Meals Rescued')).toBeInTheDocument();
  });
});

