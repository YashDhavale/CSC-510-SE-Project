import React from 'react';

function Dashboard({ user }) {
  return (
    <div className="dashboard">
      <h2>Welcome, {user?.name}!</h2>
      <p>Hi Page — Coming Soon!</p>
    </div>
  );
}

export default Dashboard;
