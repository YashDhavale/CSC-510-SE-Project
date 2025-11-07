/**
 * Test suite for CustomerLogin component
 * Tests: 5 test cases
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CustomerLogin from '../components/CustomerLogin';

// Mock fetch
global.fetch = jest.fn();

// Mock Navbar
jest.mock('../components/Navbar', () => {
  return function MockNavbar() {
    return <nav data-testid="navbar">Navbar</nav>;
  };
});

describe('CustomerLogin Component', () => {
  const mockOnLogin = jest.fn();
  const mockOnBack = jest.fn();

  beforeEach(() => {
    fetch.mockClear();
    mockOnLogin.mockClear();
    mockOnBack.mockClear();
  });

  test('renders CustomerLogin component', () => {
    render(<CustomerLogin onLogin={mockOnLogin} onBack={mockOnBack} />);
    expect(screen.getByText('Customer Login')).toBeInTheDocument();
  });

  test('displays login form fields', () => {
    render(<CustomerLogin onLogin={mockOnLogin} onBack={mockOnBack} />);
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
  });

  test('switches to register mode', () => {
    render(<CustomerLogin onLogin={mockOnLogin} onBack={mockOnBack} />);
    const registerLink = screen.getByText('New user? Register here');
    fireEvent.click(registerLink);
    expect(screen.getByText('Customer Register')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
  });

  test('calls onBack when back button is clicked', () => {
    render(<CustomerLogin onLogin={mockOnLogin} onBack={mockOnBack} />);
    const backButton = screen.getByText('← Go Back');
    fireEvent.click(backButton);
    expect(mockOnBack).toHaveBeenCalled();
  });

  test('handles successful login', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ success: true, user: { name: 'Test User', email: 'test@example.com' } })
    });

    render(<CustomerLogin onLogin={mockOnLogin} onBack={mockOnBack} />);
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/login', expect.any(Object));
    });
  });
});

