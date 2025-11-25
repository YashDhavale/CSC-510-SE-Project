import React, { useEffect, useState } from 'react';
import { Leaf, TrendingUp, Users, Store, ArrowRight } from 'lucide-react';

export default function Home({ onNavigate }) {
  const [restaurants, setRestaurants] = useState([]);
  const [impact, setImpact] = useState({
    mealsRescued: 0,
    wastePrevented: '',
    activeUsers: 0,
  });

  useEffect(() => {
    // Fetch restaurants
    fetch('/restaurants')
      .then((res) => res.json())
      .then((data) => setRestaurants(data))
      .catch((err) => console.error('Error fetching restaurants:', err));

    // Fetch impact stats
    fetch('/impact')
      .then((res) => res.json())
      .then((data) => setImpact(data))
      .catch((err) => console.error('Error fetching impact stats:', err));
  }, []);

  const formatCount = (value) => {
    if (typeof value !== 'number') return value;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return value.toString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-800 mb-4">
            Fighting Food Waste, One Meal at a Time
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            MealSlot connects you with local restaurants to rescue surplus food,
            save money, and reduce environmental impact.
          </p>
          <div className="mt-8">
            <button
              type="button"
              onClick={() => onNavigate('customer-login')}
              className="mt-8 bg-white text-green-600 px-8 py-3 rounded-full shadow-lg hover:bg-green-50 transition inline-flex items-center space-x-2"
            >
              <span className="font-semibold">Start Rescuing Meals</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Impact Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-green-600 text-white rounded-2xl p-8 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <span className="text-green-100 text-sm uppercase tracking-wide">
                Community Impact
              </span>
              <Leaf className="w-8 h-8 text-green-200" />
            </div>
            <Impact
              value={`${formatCount(impact.mealsRescued)}+`}
              label="Meals Rescued"
            />
          </div>

          <div className="bg-emerald-600 text-white rounded-2xl p-8 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <span className="text-green-100 text-sm uppercase tracking-wide">
                Waste Prevented
              </span>
              <TrendingUp className="w-8 h-8 text-green-200" />
            </div>
            <Impact value={impact.wastePrevented || '0 lbs'} label="Food Saved" />
          </div>

          <div className="bg-teal-600 text-white rounded-2xl p-8 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <span className="text-green-100 text-sm uppercase tracking-wide">
                Active Neighbors
              </span>
              <Users className="w-8 h-8 text-green-200" />
            </div>
            <Impact
              value={`${formatCount(impact.activeUsers)}+`}
              label="Local Users"
            />
          </div>
        </div>

        {/* Featured Partners */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-800">
              Featured Partner Restaurants
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('browse')}
              className="inline-flex items-center space-x-2 text-green-600 hover:text-green-700"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {restaurants.length === 0 ? (
            <p className="text-gray-500">Loading restaurants...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {restaurants.slice(0, 4).map((r, index) => (
                <div
                  key={index}
                  className="bg-green-50 rounded-xl p-4 flex flex-col items-center text-center"
                >
                  <div className="bg-white rounded-full w-12 h-12 flex items-center justify-center mb-3 shadow">
                    <Store className="w-6 h-6 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-gray-800">{r.name}</h4>
                  <p className="text-sm text-gray-500 mb-1">{r.cuisine}</p>
                  <p className="text-xs text-green-700 font-medium">
                    {r.neighborhood || 'Local Partner'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const Impact = ({ value, label }) => (
  <div>
    <p className="text-5xl font-bold mb-2">{value}</p>
    <p className="text-green-100">{label}</p>
  </div>
);
