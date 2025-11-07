/**
 * Test suite for App component
 * Tests: 5 test cases
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';

// Mock child components
jest.mock('../components/Navbar', () => {
  return function MockNavbar({ onNavigate, loggedIn }) {
    return (
      <nav data-testid="navbar">
        <button onClick={() => onNavigate('home')}>Home</button>
        <button onClick={() => onNavigate('login')}>Login</button>
        {loggedIn && <span>Logged In</span>}
      </nav>
    );
  };
});

jest.mock('../components/Home', () => {
  return function MockHome({ onNavigate }) {
    return (
      <div data-testid="home">
        <button onClick={() => onNavigate('login')}>Go to Login</button>
      </div>
    );
  };
});

jest.mock('../components/LoginChoice', () => {
  return function MockLoginChoice({ onLoginSelect }) {
    return (
      <div data-testid="login-choice">
        <button onClick={() => onLoginSelect('customer')}>Customer Login</button>
      </div>
    );
  };
});

jest.mock('../components/CustomerLogin', () => {
  return function MockCustomerLogin({ onLogin, onBack }) {
    return (
      <div data-testid="customer-login">
        <button onClick={() => onLogin({ name: 'Test User', email: 'test@example.com' })}>Login</button>
        <button onClick={onBack}>Back</button>
      </div>
    );
  };
});

jest.mock('../components/Dashboard', () => {
  return function MockDashboard({ user }) {
    return <div data-testid="dashboard">Dashboard for {user?.name}</div>;
  };
});

describe('App Component', () => {
  test('renders App component', () => {
    render(<App />);
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
  });

  test('displays Home component by default', () => {
    render(<App />);
    expect(screen.getByTestId('home')).toBeInTheDocument();
  });

  test('navigates to login page when login is clicked', () => {
    render(<App />);
    const loginButton = screen.getByText('Go to Login');
    fireEvent.click(loginButton);
    expect(screen.getByTestId('login-choice')).toBeInTheDocument();
  });

  test('navigates to customer login from login choice', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Go to Login'));
    fireEvent.click(screen.getByText('Customer Login'));
    expect(screen.getByTestId('customer-login')).toBeInTheDocument();
  });

  test('handles user login and navigates to dashboard', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Go to Login'));
    fireEvent.click(screen.getByText('Customer Login'));
    const loginButtons = screen.getAllByText('Login');
    fireEvent.click(loginButtons[loginButtons.length - 1]); // Click the last Login button (in CustomerLogin)
    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    expect(screen.getByText('Dashboard for Test User')).toBeInTheDocument();
  });
});

