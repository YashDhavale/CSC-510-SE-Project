// Proj2/src/frontend/src/components/RestaurantDetail.jsx
import React from 'react';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Star,
  ShoppingCart,
  Leaf,
} from 'lucide-react';

const RestaurantDetail = ({ restaurant, cart, onBack, onAddToCart }) => {
  if (!restaurant) {
    return null;
  }

  const hasMenus = Array.isArray(restaurant.menus) && restaurant.menus.length > 0;

  // Fallback for restaurants without explicit rescue meals
  const createDefaultMealForRestaurant = () => {
    return {
      id: `${restaurant.id || restaurant._id || restaurant.name}-default-rescue`,
      name: 'Rescue Meal Box',
      description: 'Chef-selected surplus meal from today.',
      originalPrice: 12.0,
      rescuePrice: 5.0,
      pickupWindow: 'Today',
    };
  };

  const handleReserveBox = () => {
    const defaultMeal = createDefaultMealForRestaurant();
    onAddToCart(restaurant, defaultMeal);
  };

  const safeCart = Array.isArray(cart) ? cart : [];

  // Count how many of a given meal are already in the cart for this restaurant
  const getQuantityInCartForMeal = (meal) => {
    const mealKey = meal.id || meal._id || meal.name;
    if (!mealKey) {
      return 0;
    }

    return safeCart.reduce((sum, item) => {
      if (!item || !item.meal || !item.restaurant) return sum;
      if (item.restaurant !== restaurant.name) return sum;

      const itemMeal = item.meal;
      const itemKey = itemMeal.id || itemMeal._id || itemMeal.name;

      if (itemKey !== mealKey) return sum;

      const q =
        typeof item.quantity === 'number' && Number.isFinite(item.quantity)
          ? item.quantity
          : 1;

      return sum + q;
    }, 0);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header / Back */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center">
          <button
            type="button"
            onClick={onBack}
            className="mr-3 inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Browse
          </button>
          <h1 className="text-base font-semibold text-gray-900 truncate">
            {restaurant.name}
          </h1>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        {/* Restaurant summary card */}
        <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">
              {restaurant.name}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {restaurant.cuisine || 'Cuisine not listed'}
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500">
              {restaurant.address && (
                <span className="inline-flex items-center">
                  <MapPin className="w-4 h-4 mr-1 text-green-600" />
                  {restaurant.address}
                </span>
              )}
              {restaurant.hours && (
                <span className="inline-flex items-center">
                  <Clock className="w-4 h-4 mr-1 text-gray-500" />
                  {restaurant.hours}
                </span>
              )}
              {typeof restaurant.distance === 'number' && (
                <span className="inline-flex items-center">
                  <Clock className="w-4 h-4 mr-1 text-gray-500" />
                  ~{restaurant.distance.toFixed(1)} miles away
                </span>
              )}
              {typeof restaurant.rating === 'number' && (
                <span className="inline-flex items-center">
                  <Star className="w-4 h-4 mr-1 text-yellow-400" />
                  {restaurant.rating.toFixed(1)} / 5.0
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 md:mt-0 md:ml-6">
            <div className="bg-green-50 border border-green-100 rounded-lg px-4 py-3 text-xs text-green-800">
              <p className="font-semibold">Rescue Meals Available</p>
              <p className="mt-1">
                Help reduce food waste by reserving a surprise box from this
                partner.
              </p>
              <div className="mt-2 flex items-center text-[11px] text-gray-600">
                <Leaf className="w-3 h-3 text-green-500 mr-1" />
                <span>
                  Meals listed:{' '}
                  <span className="font-semibold">
                    {hasMenus ? restaurant.menus.length : 0}
                  </span>
                </span>
              </div>
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
              {restaurant.menus.map((meal) => {
                const baseAvailable =
                  typeof meal.availableQuantity === 'number'
                    ? meal.availableQuantity
                    : typeof meal.quantity === 'number'
                    ? meal.quantity
                    : null;

                const alreadyInCart =
                  baseAvailable !== null ? getQuantityInCartForMeal(meal) : 0;

                const remaining =
                  baseAvailable !== null
                    ? Math.max(baseAvailable - alreadyInCart, 0)
                    : null;

                const isSoldOut =
                  meal.isSoldOut || (remaining !== null && remaining === 0);

                return (
                  <div
                    key={meal.id || meal._id || meal.name}
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
                          Pickup:{' '}
                          {meal.pickupWindow || 'See details at pickup'}
                        </p>
                        {meal.expiresIn && (
                          <p className="text-[11px] text-red-500 mt-1">
                            Expires in {meal.expiresIn}
                          </p>
                        )}
                        {remaining !== null && (
                          <p className="text-[11px] text-gray-600 mt-1">
                            {remaining === 0
                              ? 'Sold out for today'
                              : `${remaining} left today`}
                          </p>
                        )}
                      </div>
                      <div className="text-right ml-3">
                        {meal.originalPrice && meal.rescuePrice && (
                          <p className="text-xs text-gray-400 line-through">
                            ${meal.originalPrice}
                          </p>
                        )}
                        <p className="text-sm font-semibold text-green-700">
                          ${meal.rescuePrice || meal.originalPrice || '9.00'}
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
                      onClick={() => {
                        if (!isSoldOut) {
                          onAddToCart(restaurant, meal);
                        }
                      }}
                      disabled={isSoldOut}
                      className={
                        'mt-3 w-full inline-flex items-center justify-center px-3 py-2 text-xs font-medium rounded-md ' +
                        (isSoldOut
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700')
                      }
                    >
                      <ShoppingCart className="w-4 h-4 mr-1" />
                      {isSoldOut ? 'Sold Out' : 'Add to Cart'}
                    </button>
                  </div>
                );
              })}
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
    </div>
  );
};

export default RestaurantDetail;
