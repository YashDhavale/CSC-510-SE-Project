/**
 * ImpactCard component tests
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ImpactCard from '../components/ImpactCard';

describe('ImpactCard', () => {
  test('renders label and value', () => {
    render(<ImpactCard label="Meals Rescued" value="120" />);

    expect(screen.getByText('Meals Rescued')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
  });
});
