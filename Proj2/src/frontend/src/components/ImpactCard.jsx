import React from 'react';

function ImpactCard({ label, value }) {
  return (
    <div className="impact-card">
      <h4>{value}</h4>
      <p>{label}</p>
    </div>
  );
}

export default ImpactCard;
