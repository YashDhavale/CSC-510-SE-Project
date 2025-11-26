/**
 * CustomerLogin component tests
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CustomerLogin from '../components/CustomerLogin';

// Mock Navbar to keep DOM smaller
jest.mock('../components/Navbar', () => {
  return function MockNavbar() {
    return <div data-testid="mock-navbar">Mock Navbar</div>;
  };
});

describe('CustomerLogin', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('toggles between login and register modes', () => {
    const onLogin = jest.fn();
    const onBack = jest.fn();

    render(<CustomerLogin onLogin={onLogin} onBack={onBack} />);

    // Default should be login mode
    expect(screen.getByText('Customer Login')).toBeInTheDocument();

    const toggleButton = screen.getByText('New user? Register here');
    fireEvent.click(toggleButton);

    expect(screen.getByText('Customer Register')).toBeInTheDocument();
  });

  test('submits login form and calls onLogin on success', async () => {
    const onLogin = jest.fn();
    const onBack = jest.fn();

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            user: { name: 'Test User', email: 'test@example.com' },
          }),
      })
    );

    render(<CustomerLogin onLogin={onLogin} onBack={onBack} />);

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'password123' },
    });

    const submitButton = screen.getByText('Login');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/login', expect.any(Object));
      expect(onLogin).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
      });
    });
  });

  test('calls onBack when Go Back is clicked', () => {
    const onLogin = jest.fn();
    const onBack = jest.fn();

    render(<CustomerLogin onLogin={onLogin} onBack={onBack} />);

    const backButton = screen.getByText('← Go Back');
    fireEvent.click(backButton);

    expect(onBack).toHaveBeenCalled();
  });
});
