import React, { useEffect, useState } from 'react';

/**
 * LeaderboardPanel
 * Fetches ranking from backend and renders a clean table.
 * Backend endpoint should serve JSON sorted or unsorted; we sort client-side too.
 * Expected formats supported:
 *   1) Array: [{ name: "Eastside Deli", points: 60 }, ...]
 *   2) Object map: { "Eastside Deli": 60, ... }
 */
export default function LeaderboardPanel() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  (async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/restaurant-points');
      const data = await res.json();

      let arr = [];

      // 1) Your current shape: { success: true, points: { Name: count, ... } }
      if (data && typeof data === 'object' && data.points) {
        if (Array.isArray(data.points)) {
          arr = data.points.map(d => ({
            name: d.name ?? d.restaurant ?? String(d.id ?? ''),
            points: Number(d.points ?? d.count ?? 0),
          }));
        } else {
          // points is a map
          arr = Object.entries(data.points).map(([name, pts]) => ({
            name,
            points: Number(pts ?? 0),
          }));
        }
      }
      // 2) Plain list: [{name, points}] or variants
      else if (Array.isArray(data)) {
        arr = data.map(d => ({
          name: d.name ?? d.restaurant ?? String(d.id ?? ''),
          points: Number(d.points ?? d.count ?? 0),
        }));
      }
      // 3) Plain map: { Name: count, ... }
      else if (data && typeof data === 'object') {
        arr = Object.entries(data).map(([name, pts]) => ({
          name,
          points: Number(pts ?? 0),
        }));
      }

      arr.sort((a, b) => (b.points - a.points) || a.name.localeCompare(b.name));
      setRows(arr);
    } catch {
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  })();
}, []);


  if (loading) {
    return <div className="text-gray-600">Loading leaderboard…</div>;
  }
  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  if (!rows.length) {
    return <div className="text-gray-600">No data yet.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Restaurant</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {rows.map((r, idx) => (
            <tr key={r.name} className={idx < 3 ? 'bg-yellow-50' : ''}>
              <td className="px-6 py-4 whitespace-nowrap font-semibold">#{idx + 1}</td>
              <td className="px-6 py-4 whitespace-nowrap">{r.name}</td>
              <td className="px-6 py-4 whitespace-nowrap">{r.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
