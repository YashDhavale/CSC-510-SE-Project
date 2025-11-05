import React from 'react';

function RestaurantCard({ name, cuisine, rating }) {
  return (
    <div className="restaurant-card">
      <h4>{name}</h4>
      <p>{cuisine}</p>
      <p>⭐ {rating}</p>
    </div>
  );
}

export default RestaurantCard;
