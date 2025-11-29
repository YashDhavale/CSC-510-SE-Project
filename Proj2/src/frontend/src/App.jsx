import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Footer from './components/Footer';
import LoginChoice from './components/LoginChoice';
import CustomerLogin from './components/CustomerLogin';
import RestaurantLogin from './components/RestaurantLogin';
import Dashboard from './components/Dashboard';
import RestaurantDashboard from './components/RestaurantDashboard';
import './index.css';

function App() {
  const [page, setPage] = useState('home');
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    setUser(userData);
    setLoggedIn(true);

    if (userData && userData.accountType === 'restaurant') {
      setPage('restaurantDashboard');
    } else {
      setPage('dashboard');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setLoggedIn(false);
    setPage('home');
  };

  return (
    <div>
      {/* Hide global navbar only when on dashboards, to keep their custom headers clean */}
      {page !== 'dashboard' && page !== 'restaurantDashboard' && (
        <Navbar onNavigate={setPage} loggedIn={loggedIn} />
      )}

      {page === 'home' && <Home onNavigate={setPage} />}

      {page === 'login' && <LoginChoice onLoginSelect={setPage} />}

      {page === 'customer' && (
        <CustomerLogin onLogin={handleLogin} onBack={() => setPage('login')} />
      )}

      {page === 'restaurant' && (
        <RestaurantLogin onLogin={handleLogin} onBack={() => setPage('login')} />
      )}

      {page === 'dashboard' && loggedIn && user?.accountType !== 'restaurant' && (
        <Dashboard user={user} onLogout={handleLogout} />
      )}

      {page === 'restaurantDashboard' &&
        loggedIn &&
        user?.accountType === 'restaurant' && (
          <RestaurantDashboard
            restaurantName={user.restaurantName}
            onLogout={handleLogout}
          />
        )}

      <Footer />
    </div>
  );
}

export default App;
