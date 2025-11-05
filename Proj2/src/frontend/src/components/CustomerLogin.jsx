import React, { useState } from "react";
import users from "../secrets/users";
import Navbar from "./Navbar";

function CustomerLogin({ onLogin, onBack }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const user = users.find(
      (u) => u.email === email && u.password === password
    );
    if (user) {
      onLogin({ name: user.name, email: user.email });
    } else {
      alert("Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-white flex flex-col">
      <Navbar />
      <div className="flex flex-col items-center justify-center flex-grow px-4 py-10">
        <div className="bg-white shadow-lg rounded-2xl p-8 max-w-md w-full border border-gray-200">
          <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">
            Customer Login
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              type="submit"
              className="w-full bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700 transition"
            >
              Login
            </button>
          </form>
          <button
            onClick={onBack}
            className="mt-4 text-sm text-teal-600 hover:underline block text-center"
          >
            ← Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

export default CustomerLogin;
