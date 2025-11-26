/**
 * Navbar component tests
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Navbar from '../components/Navbar';

describe('Navbar', () => {
  test('renders brand name', () => {
    render(<Navbar onNavigate={jest.fn()} loggedIn={false} />);

    expect(screen.getByText('Tiffin Trails')).toBeInTheDocument();
  });

  test('calls onNavigate when Get Started is clicked', () => {
    const onNavigate = jest.fn();
    render(<Navbar onNavigate={onNavigate} loggedIn={false} />);

    const button = screen.getByText('Get Started');
    fireEvent.click(button);

    expect(onNavigate).toHaveBeenCalledWith('login');
  });
});
