// Proj2/src/frontend/src/components/RestaurantDetail.jsx
import React from 'react';
import {
  ArrowLeft,
  Clock,
  MapPin,
  Star,
  Leaf,
  ShoppingCart,
} from 'lucide-react';

/**
 * Restaurant detail page showing rescue meals for a single restaurant.
 * Props:
 *  - restaurant: restaurant object (with menus array)
 *  - cart: current cart array [{ restaurant, meal, quantity }, ...]
 *  - onBack: () => void
 *  - onAddToCart: (restaurant, meal) => void
 */
const RestaurantDetail = ({ restaurant, cart, onBack, onAddToCart }) => {
  if (!restaurant) {
    return null;
  }

  const menus = Array.isArray(restaurant.menus) ? restaurant.menus : [];

  const getCartQuantityForMeal = (meal) => {
    if (!Array.isArray(cart)) {
      return 0;
    }

    const mealId =
      meal.id ||
      `${restaurant.name}-${meal.name || ''}-${meal.pickupWindow || ''}`;

    const entry = cart.find((item) => {
      if (!item || item.restaurant !== restaurant.name || !item.meal) {
        return false;
      }
      const existingMealId =
        item.meal.id ||
        `${restaurant.name}-${item.meal.name || ''}-${
          item.meal.pickupWindow || ''
        }`;
      return existingMealId === mealId;
    });

    return entry && typeof entry.quantity === 'number'
      ? entry.quantity
      : Number(entry && entry.quantity) || 0;
  };

  const computeLimitInfo = (meal) => {
    const inventoryCap =
      typeof meal.availableQuantity === 'number' &&
      Number.isFinite(meal.availableQuantity)
        ? meal.availableQuantity
        : typeof meal.quantity === 'number' && Number.isFinite(meal.quantity)
        ? meal.quantity
        : Infinity;

    const perOrderCap =
      typeof meal.maxPerOrder === 'number' && Number.isFinite(meal.maxPerOrder)
        ? meal.maxPerOrder
        : Infinity;

    const maxQty =
      inventoryCap === Infinity && perOrderCap === Infinity
        ? Infinity
        : Math.min(inventoryCap, perOrderCap);

    const inCart = getCartQuantityForMeal(meal);

    const isAtLimit =
      maxQty !== Infinity && maxQty > 0 ? inCart >= maxQty : false;

    return { maxQty, inCart, isAtLimit };
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* back link */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Browse
      </button>

      {/* restaurant header */}
      <div className="bg-white rounded-xl shadow p-6 mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">
            {restaurant.name}
          </h2>
          <p className="text-sm text-gray-500 mb-2">
            {restaurant.cuisine || 'Cuisine not listed'}
          </p>
          <div className="flex flex-wrap items-center text-xs text-gray-500 space-x-4">
            <span className="flex items-center">
              <Star className="w-4 h-4 text-yellow-400 mr-1" />
              {restaurant.rating || 4.5} / 5.0
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

        <div className="mt-4 md:mt-0 bg-green-50 border border-green-100 rounded-lg px-4 py-3">
          <p className="text-xs font-semibold text-green-700 mb-1">
            Rescue Meals Available
          </p>
          <p className="text-xs text-green-700">
            Help reduce food waste by reserving a surprise box from this
            partner.
          </p>
          <div className="mt-2 flex items-center text-xs text-green-700">
            <Leaf className="w-4 h-4 mr-1" />
            <span>
              Meals listed:{' '}
              {Array.isArray(restaurant.menus)
                ? restaurant.menus.length
                : 0}
            </span>
          </div>
        </div>
      </div>

      {/* meals list */}
      <h3 className="text-lg font-semibold text-gray-800 mb-3">
        Available Rescue Meals
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {menus.map((meal) => {
          const {
            maxQty,
            inCart,
            isAtLimit,
          } = computeLimitInfo(meal);

          const originalPrice =
            typeof meal.originalPrice === 'number'
              ? meal.originalPrice
              : Number(meal.originalPrice);
          const rescuePrice =
            typeof meal.rescuePrice === 'number'
              ? meal.rescuePrice
              : Number(meal.rescuePrice);

          const hasPrices =
            Number.isFinite(originalPrice) && Number.isFinite(rescuePrice);

          const savings = hasPrices ? originalPrice - rescuePrice : null;

          const availableLeft =
            typeof meal.availableQuantity === 'number' &&
            Number.isFinite(meal.availableQuantity)
              ? Math.max(0, meal.availableQuantity - inCart)
              : null;

          const handleClick = () => {
            if (isAtLimit) {
              return;
            }
            onAddToCart(restaurant, meal);
          };

          const buttonBase =
            'inline-flex items-center justify-center w-full px-3 py-2 rounded-md text-sm font-medium';
          const buttonEnabled = ' bg-green-600 text-white hover:bg-green-700';
          const buttonDisabled =
            ' bg-gray-200 text-gray-400 cursor-not-allowed';

          return (
            <div
              key={meal.id || meal.name}
              className="bg-white rounded-xl shadow p-4 flex flex-col justify-between"
            >
              <div>
                <h4 className="text-md font-semibold text-gray-800">
                  {meal.name || 'Rescue Meal'}
                </h4>
                <p className="text-sm text-gray-500 mt-1">
                  {meal.description ||
                    'Chef-selected rescue meal from today.'}
                </p>
                <p className="text-xs text-orange-600 mt-2">
                  Pickup:{' '}
                  {meal.pickupWindow || 'Pickup within today'}
                </p>
                {meal.expiresIn && (
                  <p className="text-xs text-red-500">
                    Expires in {meal.expiresIn}
                  </p>
                )}
                {availableLeft !== null && (
                  <p className="mt-1 text-xs text-gray-600">
                    {availableLeft} left today
                    {maxQty !== Infinity && (
                      <span className="text-gray-400">
                        {' '}
                        (max {maxQty} per order)
                      </span>
                    )}
                  </p>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="text-right">
                  {hasPrices ? (
                    <>
                      <p className="text-xs text-gray-400 line-through">
                        ${originalPrice.toFixed(2)}
                      </p>
                      <p className="text-lg font-bold text-green-700">
                        ${rescuePrice.toFixed(2)}
                      </p>
                      {savings !== null && savings > 0 && (
                        <p className="text-xs text-blue-600">
                          Save ${savings.toFixed(2)}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm font-semibold text-green-700">
                      ${meal.rescuePrice}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-3">
                <button
                  type="button"
                  onClick={handleClick}
                  disabled={isAtLimit}
                  className={
                    buttonBase +
                    (isAtLimit ? buttonDisabled : buttonEnabled)
                  }
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {isAtLimit ? 'Limit reached' : 'Add to Cart'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RestaurantDetail;
