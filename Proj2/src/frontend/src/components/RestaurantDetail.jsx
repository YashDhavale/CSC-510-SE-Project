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

    if (!entry) {
      return 0;
    }

    const qty = Number(entry.quantity);
    return Number.isFinite(qty) ? Math.max(0, qty) : 0;
  };

  const computeLimitInfo = (meal) => {
    const rawAvailable = Number(meal.availableQuantity);
    const available =
      Number.isFinite(rawAvailable) && rawAvailable >= 0
        ? rawAvailable
        : Infinity;

    const perOrderCapRaw = Number(meal.maxPerOrder);
    const perOrderCap =
      Number.isFinite(perOrderCapRaw) && perOrderCapRaw > 0
        ? perOrderCapRaw
        : Infinity;

    let maxQty;
    if (available === Infinity && perOrderCap === Infinity) {
      maxQty = Infinity;
    } else if (available === Infinity) {
      maxQty = Math.max(0, perOrderCap);
    } else if (perOrderCap === Infinity) {
      maxQty = Math.max(0, available);
    } else {
      maxQty = Math.max(0, Math.min(available, perOrderCap));
    }

    const inCart = getCartQuantityForMeal(meal);
    const isAtLimit =
      maxQty === 0 || (maxQty !== Infinity && inCart >= maxQty);

    return { maxQty, inCart, isAtLimit, available };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* sticky top bar */}
      <header className="bg-white shadow sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Browse
          </button>
          <h1 className="text-lg font-semibold text-gray-900">
            {restaurant.name}
          </h1>
          <div className="w-6" />
        </div>
      </header>

      <main className="px-4 py-6">
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
              <p className="text-sm text-gray-600">
                {restaurant.cuisine || 'Rescue-friendly cuisine'}
              </p>
              <div className="flex items-center text-xs text-gray-500 mt-2 space-x-3">
                <span className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {restaurant.address || 'Address not available'}
                </span>
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {restaurant.hours || 'Today · 11:00 AM – 8:00 PM'}
                </span>
              </div>
              <div className="flex items-center text-xs text-gray-500 mt-2 space-x-3">
                <span className="flex items-center">
                  <Star className="w-4 h-4 mr-1 text-yellow-400" />
                  {restaurant.rating?.toFixed
                    ? restaurant.rating.toFixed(1)
                    : restaurant.rating || 4.5}{' '}
                  ·{' '}
                  {restaurant.numReviews
                    ? `${restaurant.numReviews}+ reviews`
                    : 'Community favorite'}
                </span>
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="flex items-center space-x-2">
                <div className="flex items-center text-xs text-green-700 bg-green-50 px-3 py-1 rounded-full">
                  <Leaf className="w-4 h-4 mr-1" />
                  <span>Community rescue partner</span>
                </div>
                <div className="flex items-center text-xs text-green-700 bg-green-50 px-3 py-1 rounded-full">
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
          </div>

          {/* meals list */}
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Available Rescue Meals
          </h3>

          {menus.length === 0 ? (
            <p className="text-sm text-gray-600">
              This restaurant has not listed any rescue meals yet today.
              Check back later or explore other partners.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {menus.map((meal) => {
                const {
                  maxQty,
                  inCart,
                  isAtLimit,
                  available,
                } = computeLimitInfo(meal);

                const originalPriceNum = Number(meal.originalPrice);
                const rescuePriceNum = Number(meal.rescuePrice);

                const hasPrices =
                  Number.isFinite(originalPriceNum) &&
                  Number.isFinite(rescuePriceNum);

                const savings = hasPrices
                  ? originalPriceNum - rescuePriceNum
                  : null;

                const isSoldOut =
                  Number.isFinite(available) && available <= 0;

                const isLowInventory =
                  Number.isFinite(available) && available > 0 && available <= 3;

                const noAvailable = isSoldOut;

                const handleClick = () => {
                  if (noAvailable || isAtLimit) {
                    return;
                  }
                  onAddToCart(restaurant, meal);
                };

                const buttonBase =
                  'inline-flex items-center justify-center px-3 py-1 rounded-md text-[11px] font-medium';
                const buttonEnabled =
                  ' bg-green-600 text-white hover:bg-green-700';
                const buttonDisabled =
                  ' bg-gray-200 text-gray-400 cursor-not-allowed';

                const isDisabled = noAvailable || isAtLimit;

                let buttonLabel = 'Add to Cart';
                if (noAvailable) {
                  buttonLabel = 'Sold out';
                } else if (isAtLimit) {
                  buttonLabel = 'Limit reached';
                }

                const buttonTitle = noAvailable
                  ? 'This rescue meal is sold out for today'
                  : isAtLimit
                  ? 'You have reached the maximum for this meal'
                  : 'Add this rescue meal to your cart';

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
                      {Number.isFinite(available) && (
                        <p className="mt-1 text-xs text-gray-600">
                          {available} left today
                          {isLowInventory && (
                            <span className="text-red-500 font-semibold">
                              {' '}
                              • Almost gone today
                            </span>
                          )}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div>
                        {hasPrices ? (
                          <>
                            <p className="text-sm font-semibold text-green-700">
                              ${rescuePriceNum.toFixed(2)} rescue price
                            </p>
                            <p className="text-xs text-gray-500">
                              <span className="line-through text-gray-400">
                                ${originalPriceNum.toFixed(2)}
                              </span>{' '}
                              {savings !== null && savings > 0 && (
                                <span className="text-green-600 font-semibold">
                                  · Save ${savings.toFixed(2)}
                                </span>
                              )}
                            </p>
                          </>
                        ) : (
                          <p className="text-sm text-gray-500">
                            Rescue pricing available at checkout
                          </p>
                        )}
                        {maxQty !== Infinity && (
                          <p className="mt-1 text-[11px] text-gray-500">
                            Max {maxQty} per order
                            {inCart > 0 && (
                              <>
                                {' '}
                                · You have {inCart} in your cart
                              </>
                            )}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end space-y-1">
                        {inCart > 0 && (
                          <p className="text-[10px] text-green-600">
                            In cart: {inCart}x
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={handleClick}
                          disabled={isDisabled}
                          title={buttonTitle}
                          className={
                            buttonBase +
                            (isDisabled ? buttonDisabled : buttonEnabled)
                          }
                        >
                          <ShoppingCart className="w-4 h-4 mr-1" />
                          {buttonLabel}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default RestaurantDetail;
