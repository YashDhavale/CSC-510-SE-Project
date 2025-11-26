/**
 * LoginChoice component tests
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginChoice from '../components/LoginChoice';

describe('LoginChoice', () => {
  test('renders customer and restaurant options', () => {
    const onLoginSelect = jest.fn();
    render(<LoginChoice onLoginSelect={onLoginSelect} />);

    expect(screen.getByText('Tiffin Trails')).toBeInTheDocument();
    expect(
      screen.getByText('Choose your account type to continue')
    ).toBeInTheDocument();

    expect(screen.getByText('Customer')).toBeInTheDocument();
    expect(screen.getByText('Restaurant')).toBeInTheDocument();
  });

  test('selecting customer calls onLoginSelect with "customer"', () => {
    const onLoginSelect = jest.fn();
    render(<LoginChoice onLoginSelect={onLoginSelect} />);

    // Click the explicit button text; entire card also has onClick but button is enough
    const customerButton = screen.getByText('Continue as Customer');
    fireEvent.click(customerButton);

    expect(onLoginSelect).toHaveBeenCalledWith('customer');
  });

  test('back to home calls onLoginSelect with "home"', () => {
    const onLoginSelect = jest.fn();
    render(<LoginChoice onLoginSelect={onLoginSelect} />);

    const backButton = screen.getByText('← Back to Home');
    fireEvent.click(backButton);

    expect(onLoginSelect).toHaveBeenCalledWith('home');
  });
});
