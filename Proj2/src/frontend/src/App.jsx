import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Home from './components/Home';
import LoginChoice from './components/LoginChoice';
import CustomerLogin from './components/CustomerLogin';
import Dashboard from './components/Dashboard';
import './index.css';

function App() {
  const [page, setPage] = useState('home');
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    setUser(userData);
    setLoggedIn(true);
    setPage('dashboard');
  };

  return (
    <div>
      
      {page !== 'dashboard' && <Navbar onNavigate={setPage} loggedIn={loggedIn} />}
      {page === 'home' && <Home onNavigate={setPage} />}
      {page === 'login' && <LoginChoice onLoginSelect={setPage} />}
      {page === 'customer' && (<CustomerLogin 
        onLogin={handleLogin} 
        onBack={() => setPage('login')} />)}
      {page === 'dashboard' && loggedIn && <Dashboard user={user} />}
    </div>
  );
}

export default App;
