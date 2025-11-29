import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Navbar from './Navbar';

/**
 * RestaurantLogin
 * Simple login form for restaurant accounts.
 * It calls /login and only accepts accounts where accountType === "restaurant".
 */
function RestaurantLogin({ onLogin, onBack }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.message || 'Invalid credentials');
        return;
      }

      const user = data.user || {};

      if (user.accountType !== 'restaurant') {
        alert('This account is not registered as a restaurant account.');
        return;
      }

      onLogin(user);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error during restaurant login:', err);
      alert('Server error. Please try again later.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-white flex flex-col">
      <div className="fixed top-0 left-0 w-full z-50">
        <Navbar />
      </div>

      <div className="flex flex-col items-center justify-center flex-grow px-4 py-10 mt-20">
        <div className="bg-white shadow-xl rounded-2xl max-w-md w-full p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
            Restaurant Login
          </h2>
          <p className="text-sm text-gray-600 mb-6 text-center">
            Sign in to manage rescue meals, orders, and sustainability impact.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="restaurant@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700 transition"
            >
              Login
            </button>
          </form>

          <button
            type="button"
            onClick={onBack}
            className="mt-4 text-sm text-teal-700 hover:text-teal-900 font-semibold"
          >
            ← Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

RestaurantLogin.propTypes = {
  onLogin: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
};

export default RestaurantLogin;
