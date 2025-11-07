/**
 * Test suite for LeaderboardPanel component
 * Tests: 5 test cases
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LeaderboardPanel from '../components/LeaderboardPanel';

// Mock fetch
global.fetch = jest.fn();

describe('LeaderboardPanel Component', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('renders LeaderboardPanel component', () => {
    fetch.mockResolvedValueOnce({
      json: async () => []
    });
    render(<LeaderboardPanel />);
    expect(screen.getByText('Loading leaderboard…')).toBeInTheDocument();
  });

  test('displays leaderboard table with data', async () => {
    const mockData = [
      { name: 'Restaurant 1', points: 100 },
      { name: 'Restaurant 2', points: 50 }
    ];
    fetch.mockResolvedValueOnce({
      json: async () => mockData
    });

    render(<LeaderboardPanel />);
    
    await waitFor(() => {
      expect(screen.getByText('Restaurant 1')).toBeInTheDocument();
      expect(screen.getByText('Restaurant 2')).toBeInTheDocument();
    });
  });

  test('handles array format data', async () => {
    const mockData = [{ name: 'Restaurant A', points: 75 }];
    fetch.mockResolvedValueOnce({
      json: async () => mockData
    });

    render(<LeaderboardPanel />);
    
    await waitFor(() => {
      expect(screen.getByText('Restaurant A')).toBeInTheDocument();
    });
  });

  test('handles object format data', async () => {
    const mockData = { 'Restaurant B': 80, 'Restaurant C': 60 };
    fetch.mockResolvedValueOnce({
      json: async () => mockData
    });

    render(<LeaderboardPanel />);
    
    await waitFor(() => {
      expect(screen.getByText('Restaurant B')).toBeInTheDocument();
    });
  });

  test('displays error message on fetch failure', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    render(<LeaderboardPanel />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load leaderboard')).toBeInTheDocument();
    });
  });
});

