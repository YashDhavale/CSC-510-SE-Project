/**
 * LeaderboardPanel component tests
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LeaderboardPanel from '../components/LeaderboardPanel';

describe('LeaderboardPanel', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('renders leaderboard rows after successful fetch', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve([
            { name: 'Eastside Deli', points: 60 },
            { name: 'GreenBite Cafe', points: 45 },
          ]),
      })
    );

    render(<LeaderboardPanel />);

    await waitFor(() => {
      expect(screen.getByText('Eastside Deli')).toBeInTheDocument();
      expect(screen.getByText('GreenBite Cafe')).toBeInTheDocument();
    });
  });

  test('shows error message when fetch fails', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));

    render(<LeaderboardPanel />);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to load leaderboard')
      ).toBeInTheDocument();
    });
  });
});
