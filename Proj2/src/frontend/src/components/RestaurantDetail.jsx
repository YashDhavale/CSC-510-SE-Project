import React from 'react';
import { ArrowLeft, MapPin, Clock, Star, ShoppingCart, Leaf } from 'lucide-react';

const RestaurantDetail = ({ restaurant, onBack, onAddToCart }) => {
  if (!restaurant) {
    return null;
  }

  const hasMenus = Array.isArray(restaurant.menus) && restaurant.menus.length > 0;

  const createDefaultMealForRestaurant = () => {
    return {
      id: `${restaurant.id || restaurant._id || restaurant.name}-default-rescue`,
      name: 'Rescue Meal Box',
      description: 'Chef-selected surplus meal from today.',
      originalPrice: 12.0,
      rescuePrice: 5.0,
      pickupWindow: 'Today, 5–8 PM',
    };
  };

  const handleReserveBox = () => {
    const meal = createDefaultMealForRestaurant();
    onAddToCart(restaurant, meal);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <button
        type="button"
        onClick={onBack}
        className="mb-6 flex items-center space-x-2 text-green-600 hover:text-green-700"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Browse</span>
      </button>

      {/* Restaurant header */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">
              {restaurant.name}
            </h1>
            <p className="text-sm text-gray-500 mb-2">
              {restaurant.cuisine || 'Cuisine not listed'}
            </p>
            <div className="flex flex-wrap items-center text-xs text-gray-500 space-x-4">
              <span className="flex items-center">
                <Star className="w-4 h-4 text-yellow-400 mr-1" />
                {restaurant.rating || 4.5}
              </span>
              <span className="flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                {restaurant.address || 'Address not available'}
              </span>
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {restaurant.hours || 'Hours not listed'}
              </span>
            </div>
          </div>
          <div className="mt-4 md:mt-0 text-right">
            <p className="text-xs text-gray-500 mb-1">Rescue meals listed</p>
            <p className="text-3xl font-bold text-green-600">
              {hasMenus ? restaurant.menus.length : 0}
            </p>
          </div>
        </div>
      </div>

      {/* Meals list */}
      {hasMenus ? (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Available Rescue Meals
            </h2>
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">
              <Leaf className="w-4 h-4 mr-1" />
              Rescue surplus food today
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {restaurant.menus.map((meal) => (
              <div
                key={meal.id}
                className="border border-gray-100 rounded-lg p-4 hover:border-green-500 transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">
                      {meal.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {meal.description || 'Chef-selected rescue meal'}
                    </p>
                    <p className="text-xs text-orange-600 mt-1">
                      Pickup: {meal.pickupWindow || 'See details at pickup'}
                    </p>
                  </div>
                  <div className="text-right ml-3">
                    {meal.originalPrice && meal.rescuePrice && (
                      <p className="text-xs text-gray-400 line-through">
                        ${meal.originalPrice}
                      </p>
                    )}
                    <p className="text-lg font-bold text-green-600">
                      ${meal.rescuePrice || meal.originalPrice}
                    </p>
                    {meal.originalPrice && meal.rescuePrice && (
                      <p className="text-[10px] text-blue-600">
                        Save $
                        {(
                          parseFloat(meal.originalPrice) -
                          parseFloat(meal.rescuePrice)
                        ).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onAddToCart(restaurant, meal)}
                  className="mt-3 w-full inline-flex items-center justify-center px-3 py-2 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700"
                >
                  <ShoppingCart className="w-4 h-4 mr-1" />
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            Rescue Meals
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            This restaurant has not listed specific rescue meals, but you can
            still reserve a surprise Rescue Meal Box. The kitchen will pack
            surplus food that is still perfectly good to eat.
          </p>
          <button
            type="button"
            onClick={handleReserveBox}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Reserve a Rescue Meal Box
          </button>
        </div>
      )}
    </div>
  );
};

export default RestaurantDetail;
