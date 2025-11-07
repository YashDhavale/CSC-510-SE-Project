/**
 * Test suite for Navbar component
 * Tests: 3 test cases
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Navbar from '../components/Navbar';

describe('Navbar Component', () => {
  test('renders Navbar component', () => {
    render(<Navbar onNavigate={jest.fn()} loggedIn={false} />);
    expect(screen.getByText('Tiffin Trails')).toBeInTheDocument();
  });

  test('displays Get Started button when not logged in', () => {
    render(<Navbar onNavigate={jest.fn()} loggedIn={false} />);
    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });

  test('calls onNavigate when Get Started is clicked', () => {
    const mockNavigate = jest.fn();
    render(<Navbar onNavigate={mockNavigate} loggedIn={false} />);
    const button = screen.getByText('Get Started');
    fireEvent.click(button);
    expect(mockNavigate).toHaveBeenCalledWith('login');
  });
});

