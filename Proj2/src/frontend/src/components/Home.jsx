import React, { useEffect, useState } from 'react';
import { Leaf, TrendingUp, Users, Store, ArrowRight } from 'lucide-react';

export default function Home({ onNavigate }) {
  const [restaurants, setRestaurants] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/restaurants")
      .then((res) => res.json())
      .then((data) => setRestaurants(data))
      .catch((err) => console.error("Error fetching restaurants:", err));
  }, []);

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
          <Feature
            color="green"
            icon={<Leaf className="w-8 h-8 text-green-600" />}
            title="Save the Planet"
            desc="Reduce food waste and carbon emissions with every meal you rescue"
          />
          <Feature
            color="blue"
            icon={<TrendingUp className="w-8 h-8 text-blue-600" />}
            title="Save Money"
            desc="Get delicious meals at up to 40% off regular prices"
          />
          <Feature
            color="purple"
            icon={<Users className="w-8 h-8 text-purple-600" />}
            title="Support Local"
            desc="Help local restaurants reduce waste and thrive in your community"
          />
        </div>

        {/* Partner Restaurants */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-16">
          <h3 className="text-3xl font-bold text-gray-800 mb-6 text-center">Our Partner Restaurants</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {restaurants.map((r, index) => (
              <div key={index} className="text-center">
                <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-2">
                  <Store className="w-12 h-12 text-green-600" />
                </div>
                <p className="font-semibold text-gray-800 text-sm">{r.restaurant || r.name}</p>
                <p className="text-xs text-gray-500">{r.cuisine}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Community Impact */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl p-12 text-center">
          <h3 className="text-3xl font-bold mb-4">Community Impact</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Impact value="8,934" label="Meals Rescued" />
            <Impact value="4.2 tons" label="Waste Prevented" />
            <Impact value="1,247" label="Active Users" />
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

const Feature = ({ icon, title, desc }) => (
  <div className="bg-white rounded-xl shadow-lg p-8 text-center">
    <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
    <p className="text-gray-600">{desc}</p>
  </div>
);

const Impact = ({ value, label }) => (
  <div>
    <p className="text-5xl font-bold mb-2">{value}</p>
    <p className="text-green-100">{label}</p>
  </div>
);
