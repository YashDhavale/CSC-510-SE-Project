import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Navbar from './Navbar';

function CustomerLogin({ onLogin, onBack }) {
  const [name, setName] = useState(''); // only used for register
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Use relative paths so CRA dev server proxy can forward to backend (port 5000)
    const url = isRegister ? '/register' : '/login';
    const bodyData = isRegister ? { name, email, password } : { email, password };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });
      const data = await res.json();

      if (data.success) {
        if (isRegister) {
          alert(data.message);
          setIsRegister(false);
        } else {
          onLogin(data.user);
        }
      } else {
        alert(data.message || 'Authentication failed, please try again.');
      }
    } catch (err) {
      console.error('Error during auth:', err);
      alert('Server error. Please try again later.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-white flex flex-col">
      <div className="fixed top-0 left-0 w-full z-50">
        <Navbar />
      </div>

      <div className="flex flex-col items-center justify-center flex-grow px-4 py-10 mt-20">
        <div className="bg-white shadow-lg rounded-2xl p-8 max-w-md w-full border border-gray-200">
          <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">
            {isRegister ? 'Customer Register' : 'Customer Login'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="Enter your name"
                />
              </div>
            )}

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
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="you@example.com"
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
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700 transition"
            >
              {isRegister ? 'Register' : 'Login'}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="mt-2 text-sm text-teal-600 hover:underline block text-center"
          >
            {isRegister ? '← Back to Login' : 'New user? Register here'}
          </button>

          <button
            type="button"
            onClick={onBack}
            className="mt-2 text-sm text-teal-600 hover:underline block text-center"
          >
            ← Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

CustomerLogin.propTypes = {
  onLogin: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
};

export default CustomerLogin;
