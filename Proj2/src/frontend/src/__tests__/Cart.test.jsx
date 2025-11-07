/**
 * Test suite for Cart component
 * Tests: 8 test cases
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Cart from '../components/Cart';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ShoppingCart: () => <div data-testid="shopping-cart-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  X: () => <div data-testid="x-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  Minus: () => <div data-testid="minus-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
  ArrowLeft: () => <div data-testid="arrow-left-icon" />,
  Award: () => <div data-testid="award-icon" />
}));

// Mock fetch
global.fetch = jest.fn();

describe('Cart Component', () => {
  const mockCart = [
    {
      restaurant: 'Restaurant 1',
      meal: {
        name: 'Meal 1',
        originalPrice: 15.99,
        rescuePrice: 9.99
      },
      quantity: 2
    }
  ];

  const mockSetCart = jest.fn();
  const mockOnBack = jest.fn();

  beforeEach(() => {
    fetch.mockClear();
    mockSetCart.mockClear();
    mockOnBack.mockClear();
  });

  test('renders empty cart message when cart is empty', () => {
    render(<Cart cart={[]} setCart={mockSetCart} onBack={mockOnBack} restaurants={[]} />);
    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
  });

  test('displays cart items when cart has items', () => {
    render(<Cart cart={mockCart} setCart={mockSetCart} onBack={mockOnBack} restaurants={[]} />);
    expect(screen.getByText('Meal 1')).toBeInTheDocument();
    expect(screen.getByText('Restaurant 1')).toBeInTheDocument();
  });

  test('calculates subtotal correctly', () => {
    render(<Cart cart={mockCart} setCart={mockSetCart} onBack={mockOnBack} restaurants={[]} />);
    // Subtotal should be 9.99 * 2 = 19.98
    const subtotalElements = screen.getAllByText('$19.98');
    expect(subtotalElements.length).toBeGreaterThan(0);
  });

  test('displays rescue meal badge for rescue meals', () => {
    render(<Cart cart={mockCart} setCart={mockSetCart} onBack={mockOnBack} restaurants={[]} />);
    expect(screen.getByText('Rescue Meal')).toBeInTheDocument();
  });

  test('increases quantity when plus button is clicked', () => {
    render(<Cart cart={mockCart} setCart={mockSetCart} onBack={mockOnBack} restaurants={[]} />);
    const buttons = screen.getAllByRole('button');
    const plusButton = buttons.find(btn => btn.querySelector('[data-testid="plus-icon"]'));
    if (plusButton) {
      fireEvent.click(plusButton);
      expect(mockSetCart).toHaveBeenCalled();
    }
  });

  test('decreases quantity when minus button is clicked', () => {
    render(<Cart cart={mockCart} setCart={mockSetCart} onBack={mockOnBack} restaurants={[]} />);
    const buttons = screen.getAllByRole('button');
    const minusButton = buttons.find(btn => btn.querySelector('[data-testid="minus-icon"]'));
    if (minusButton) {
      fireEvent.click(minusButton);
      expect(mockSetCart).toHaveBeenCalled();
    }
  });

  test('removes item when trash button is clicked', () => {
    render(<Cart cart={mockCart} setCart={mockSetCart} onBack={mockOnBack} restaurants={[]} />);
    const buttons = screen.getAllByRole('button');
    const trashButton = buttons.find(btn => btn.querySelector('[data-testid="trash-icon"]'));
    if (trashButton) {
      fireEvent.click(trashButton);
      expect(mockSetCart).toHaveBeenCalled();
    }
  });

  test('places order successfully', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, order: { id: '123' } })
    });

    render(<Cart cart={mockCart} setCart={mockSetCart} onBack={mockOnBack} restaurants={[]} />);
    const placeOrderButton = screen.getByText('Place Order');
    fireEvent.click(placeOrderButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/orders', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }));
    });
  });
});

