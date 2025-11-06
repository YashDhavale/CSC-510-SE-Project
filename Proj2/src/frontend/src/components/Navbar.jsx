import React from 'react';
import { Leaf } from 'lucide-react';

export default function Navbar({ onNavigate, loggedIn }) {
  return (
    <header className="bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Leaf className="w-8 h-8" />
          <div>
            <h1 className="text-2xl font-bold">Tiffin Trails</h1>
            <p className="text-xs text-green-100">Save Food. Save Money. Save Planet.</p>
          </div>
        </div>
        <div>
          {!loggedIn && (
            <button
              onClick={() => onNavigate('login')}
              className="bg-white text-green-600 px-6 py-2 rounded-lg font-semibold hover:bg-green-50 transition"
            >
              Get Started
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
