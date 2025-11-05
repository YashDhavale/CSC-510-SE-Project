import React, { useState } from 'react';
import { ShoppingCart, Heart, Leaf, TrendingUp, Users, Star, Search, MapPin, Clock, Award, Truck, Package, Menu, X, ChevronRight, Zap, User, Store, ArrowRight, CheckCircle } from 'lucide-react';

export default function TiffinTrails() {
  const [appView, setAppView] = useState('home');
  const [currentView, setCurrentView] = useState('browse');
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCuisine, setFilterCuisine] = useState('all');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [favorites, setFavorites] = useState(new Set([1, 3]));
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  const users = {
    'customer@test.com': { password: 'customer123', type: 'customer', name: 'John Doe' },
    'jane@test.com': { password: 'jane123', type: 'customer', name: 'Jane Smith' }
  };

  const restaurants = [
    {
      id: 1,
      name: "Eastside Deli",
      cuisine: "Deli",
      location: "Raleigh, Zone-1",
      rating: 4.7,
      reviews: 234,
      sustainabilityScore: 92,
      avgDeliveryTime: 18.5,
      onTimeRate: 94.3,
      avgDistance: 4.2,
      efficiencyScore: 88.5,
      wasteReduction: "+23%",
      rescueMeals: [
        { id: 101, name: "Chicken Salad Sandwich", originalPrice: 10.99, rescuePrice: 6.99, quantity: 3, expiresIn: "2 hours" },
        { id: 102, name: "Veggie Grain Bowl", originalPrice: 12.99, rescuePrice: 7.99, quantity: 2, expiresIn: "1 hour" }
      ]
    },
    {
      id: 2,
      name: "Oak Street Bistro",
      cuisine: "Southern",
      location: "Raleigh, Zone-2",
      rating: 4.9,
      reviews: 456,
      sustainabilityScore: 88,
      avgDeliveryTime: 22.1,
      onTimeRate: 91.8,
      avgDistance: 5.8,
      efficiencyScore: 82.3,
      wasteReduction: "+15%",
      rescueMeals: [
        { id: 201, name: "Biscuits & Gravy", originalPrice: 9.99, rescuePrice: 5.99, quantity: 4, expiresIn: "3 hours" }
      ]
    },
    {
      id: 3,
      name: "GreenBite Cafe",
      cuisine: "Indian",
      location: "Raleigh, Zone-3",
      rating: 4.8,
      reviews: 312,
      sustainabilityScore: 96,
      avgDeliveryTime: 16.3,
      onTimeRate: 97.2,
      avgDistance: 3.5,
      efficiencyScore: 94.7,
      wasteReduction: "+34%",
      rescueMeals: [
        { id: 301, name: "Veggie Thali", originalPrice: 13.99, rescuePrice: 8.99, quantity: 5, expiresIn: "2 hours" },
        { id: 302, name: "Paneer Tikka Bowl", originalPrice: 14.99, rescuePrice: 9.99, quantity: 2, expiresIn: "1.5 hours" }
      ]
    },
    {
      id: 4,
      name: "Triangle BBQ Co.",
      cuisine: "BBQ",
      location: "Raleigh, Zone-4",
      rating: 4.6,
      reviews: 198,
      sustainabilityScore: 75,
      avgDeliveryTime: 25.8,
      onTimeRate: 88.5,
      avgDistance: 6.2,
      efficiencyScore: 76.2,
      wasteReduction: "+8%",
      rescueMeals: []
    },
    {
      id: 5,
      name: "Village Noodle Bar",
      cuisine: "Asian",
      location: "Raleigh, Zone-5",
      rating: 4.7,
      reviews: 267,
      sustainabilityScore: 84,
      avgDeliveryTime: 19.7,
      onTimeRate: 92.6,
      avgDistance: 4.8,
      efficiencyScore: 85.9,
      wasteReduction: "+19%",
      rescueMeals: [
        { id: 501, name: "Pad Thai", originalPrice: 11.99, rescuePrice: 6.99, quantity: 3, expiresIn: "2.5 hours" }
      ]
    }
  ];

  const userImpact = {
    mealsOrdered: 47,
    moneySaved: 156.80,
    foodWastePrevented: 23.4,
    carbonReduced: 18.7,
    localRestaurantsSupported: 8,
    impactLevel: "Sustainability Champion"
  };

  const cuisineTypes = ['all', 'Deli', 'Southern', 'Italian', 'BBQ', 'Asian', 'Mexican', 'Indian'];

  const filteredRestaurants = restaurants.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         r.cuisine.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCuisine = filterCuisine === 'all' || r.cuisine === filterCuisine;
    return matchesSearch && matchesCuisine;
  });

  const addToCart = (restaurant, meal) => {
    setCart([...cart, { restaurant: restaurant.name, meal, quantity: 1 }]);
  };

  const toggleFavorite = (restaurantId) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(restaurantId)) {
      newFavorites.delete(restaurantId);
    } else {
      newFavorites.add(restaurantId);
    }
    setFavorites(newFavorites);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const user = users[loginEmail];
    if (user && user.password === loginPassword) {
      setCurrentUser({ email: loginEmail, ...user });
      setAppView('app');
    } else {
      alert('Invalid credentials. Try customer@test.com / customer123');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAppView('home');
    setLoginEmail('');
    setLoginPassword('');
  };

  if (appView === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
        <header className="bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Leaf className="w-8 h-8" />
                <div>
                  <h1 className="text-2xl font-bold">Tiffin Trails</h1>
                  <p className="text-xs text-green-100">Save Food. Save Money. Save Planet.</p>
                </div>
              </div>
              <button 
                onClick={() => setAppView('loginChoice')}
                className="bg-white text-green-600 px-6 py-2 rounded-lg font-semibold hover:bg-green-50 transition"
              >
                Get Started
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-800 mb-4">Fighting Food Waste, One Meal at a Time</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Connect with local restaurants to rescue surplus food at amazing prices while making a positive environmental impact.
            </p>
          </div>

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
              onClick={() => setAppView('loginChoice')}
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

  if (appView === 'loginChoice') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Leaf className="w-12 h-12 text-green-600" />
              <h1 className="text-4xl font-bold text-gray-800">Tiffin Trails</h1>
            </div>
            <p className="text-gray-600">Choose your account type to continue</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div 
              onClick={() => setAppView('customerLogin')}
              className="bg-white rounded-xl shadow-lg p-8 cursor-pointer hover:shadow-2xl transition transform hover:-translate-y-1"
            >
              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">Customer</h2>
              <p className="text-gray-600 text-center mb-4">Rescue meals, save money, and help the environment</p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-600">Browse rescue meals from local restaurants</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-600">Save up to 40% on delicious food</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-600">Track your environmental impact</span>
                </li>
              </ul>
              <button className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition">
                Continue as Customer
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8 opacity-50 relative">
              <div className="absolute top-4 right-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                Coming Soon
              </div>
              <div className="bg-purple-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Store className="w-10 h-10 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">Restaurant</h2>
              <p className="text-gray-600 text-center mb-4">Reduce waste and earn rewards for sustainability</p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-600">List surplus meals before they expire</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-600">Earn sustainability badges and rewards</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-600">Reduce waste and increase efficiency</span>
                </li>
              </ul>
              <button disabled className="w-full bg-gray-400 text-white py-3 rounded-lg font-semibold cursor-not-allowed">
                Available in Future Milestone
              </button>
            </div>
          </div>

          <div className="text-center mt-6">
            <button 
              onClick={() => setAppView('home')}
              className="text-green-600 hover:text-green-700 font-semibold"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (appView === 'customerLogin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Customer Login</h2>
              <p className="text-gray-600">Welcome back to Tiffin Trails</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="customer@test.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter your password"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
              >
                Sign In
              </button>
            </form>

            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <p className="text-sm font-semibold text-gray-700 mb-2">Demo Accounts:</p>
              <div className="text-xs text-gray-600 space-y-1">
                <p>📧 customer@test.com</p>
                <p>🔑 customer123</p>
                <p className="mt-2">📧 jane@test.com</p>
                <p>🔑 jane123</p>
              </div>
            </div>

            <div className="mt-6 text-center">
              <button 
                onClick={() => setAppView('loginChoice')}
                className="text-green-600 hover:text-green-700 font-semibold text-sm"
              >
                ← Back to account selection
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Welcome, {currentUser?.name}!</h2>
        <p className="text-gray-600 mb-8">Restaurant browsing features will be added in the next update.</p>
        <button 
          onClick={handleLogout}
          className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
}