import React from 'react';
import { Leaf, TrendingUp, Users, Store, ArrowRight } from 'lucide-react';

export default function Home({ onNavigate }) {
  // Static data for now (restaurants, stats, etc.)
  const restaurants = [
    { id: 1, name: 'Eastside Deli', cuisine: 'Deli' },
    { id: 2, name: 'Oak Street Bistro', cuisine: 'Southern' },
    { id: 3, name: 'GreenBite Cafe', cuisine: 'Indian' },
    { id: 4, name: 'Triangle BBQ Co.', cuisine: 'BBQ' },
    { id: 5, name: 'Village Noodle Bar', cuisine: 'Asian' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-800 mb-4">
            Fighting Food Waste, One Meal at a Time
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Connect with local restaurants to rescue surplus food at amazing prices while making a positive environmental impact.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Leaf className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Save the Planet</h3>
            <p className="text-gray-600">Reduce food waste and carbon emissions with every meal you rescue</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Save Money</h3>
            <p className="text-gray-600">Get delicious meals at up to 40% off regular prices</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Support Local</h3>
            <p className="text-gray-600">Help local restaurants reduce waste and thrive in your community</p>
          </div>
        </div>

        {/* Partner Restaurants */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-16">
          <h3 className="text-3xl font-bold text-gray-800 mb-6 text-center">Our Partner Restaurants</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {restaurants.map(r => (
              <div key={r.id} className="text-center">
                <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-2">
                  <Store className="w-12 h-12 text-green-600" />
                </div>
                <p className="font-semibold text-gray-800 text-sm">{r.name}</p>
                <p className="text-xs text-gray-500">{r.cuisine}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Community Impact */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl p-12 text-center">
          <h3 className="text-3xl font-bold mb-4">Community Impact</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div>
              <p className="text-5xl font-bold mb-2">8,934</p>
              <p className="text-green-100">Meals Rescued</p>
            </div>
            <div>
              <p className="text-5xl font-bold mb-2">4.2 tons</p>
              <p className="text-green-100">Waste Prevented</p>
            </div>
            <div>
              <p className="text-5xl font-bold mb-2">1,247</p>
              <p className="text-green-100">Active Users</p>
            </div>
          </div>
          <button 
            onClick={() => onNavigate('login')}
            className="mt-8 bg-white text-green-600 px-8 py-3 rounded-lg font-bold text-lg hover:bg-green-50 transition inline-flex items-center space-x-2"
          >
            <span>Join Us Today</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
