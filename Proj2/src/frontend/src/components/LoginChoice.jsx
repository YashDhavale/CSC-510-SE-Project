import React from 'react';
import { User, Store, CheckCircle } from 'lucide-react';

export default function LoginChoice({ onLoginSelect }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <User className="w-12 h-12 text-green-600" />
            <h1 className="text-4xl font-bold text-gray-800">Tiffin Trails</h1>
          </div>
          <p className="text-gray-600">Choose your account type to continue</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Login */}
          <div
            onClick={() => onLoginSelect('customer')}
            className="bg-white rounded-xl shadow-lg p-8 cursor-pointer hover:shadow-2xl transition transform hover:-translate-y-1 flex flex-col"
          >
            <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
              Customer
            </h2>
            <p className="text-gray-600 text-center mb-4">
              Rescue meals, save money, and help the environment
            </p>
            <ul className="space-y-2 mb-6 flex-1">
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-600">
                  Browse rescue meals from local restaurants
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-600">
                  Track your personal impact over time
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-600">
                  Join the community rescuing surplus food
                </span>
              </li>
            </ul>
            <button
              type="button"
              onClick={() => onLoginSelect('customer')}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition mt-auto"
            >
              Continue as Customer
            </button>
          </div>

          {/* Restaurant Login */}
          <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col">
            <div className="bg-purple-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Store className="w-10 h-10 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
              Restaurant
            </h2>
            <p className="text-gray-600 text-center mb-4">
              List surplus meals, reduce waste, and earn extra revenue
            </p>
            <ul className="space-y-2 mb-6 flex-1">
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-600">
                  Monitor rescue orders and inventory in real-time
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-600">
                  List surplus meals before they expire
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-600">
                  Earn sustainability badges and rewards
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-600">
                  Reduce waste and increase efficiency
                </span>
              </li>
            </ul>
            <button
              type="button"
              onClick={() => onLoginSelect('restaurant')}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition mt-auto"
            >
              Continue as Restaurant
            </button>
          </div>
        </div>

        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => onLoginSelect('home')}
            className="text-green-600 hover:text-green-700 font-semibold"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
