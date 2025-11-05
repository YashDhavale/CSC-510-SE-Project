import React, { useState } from "react";
import Navbar from "./Navbar";

function CustomerLogin({ onLogin, onBack }) {
  const [name, setName] = useState(""); // only used for register
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = isRegister ? "http://localhost:5000/register" : "http://localhost:5000/login";
    const bodyData = isRegister ? { name, email, password } : { email, password };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });
      const data = await res.json();

      if (data.success) {
        if (isRegister) {
          alert(data.message);
          setIsRegister(false); // switch to login after successful registration
        } else {
          onLogin(data.user);
        }
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Server error, try again later");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-white flex flex-col">
      {/* Fixed Navbar at top */}
      <div className="fixed top-0 left-0 w-full z-50">
        <Navbar />
      </div>

      {/* Push content below fixed navbar */}
      <div className="flex flex-col items-center justify-center flex-grow px-4 py-10 mt-20">
        <div className="bg-white shadow-lg rounded-2xl p-8 max-w-md w-full border border-gray-200">
          <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">
            {isRegister ? "Customer Register" : "Customer Login"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            )}
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
              {isRegister ? "Register" : "Login"}
            </button>
          </form>
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="mt-2 text-sm text-teal-600 hover:underline block text-center"
          >
            {isRegister ? "← Back to Login" : "New user? Register here"}
          </button>
          <button
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

export default CustomerLogin;
