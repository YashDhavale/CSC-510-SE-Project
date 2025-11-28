// Proj2/src/frontend/src/components/Cart.jsx
// Cart page with client-side inventory guard and pickup time preference.
// - Quantity +/- buttons never exceed available inventory (availableQuantity or quantity).
// - Sends pickupPreference to backend so orders carry a simple time-slot hint.
// - After successful checkout, shows an in-app thank-you screen instead of a blank page.

import React, { useState } from 'react';
import { ArrowLeft, Plus, Minus, Trash2 } from 'lucide-react';

const Cart = ({ cart, setCart, onBack, onOrderPlaced, user }) => {
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [pickupPreference, setPickupPreference] = useState('any');
  const [orderSuccess, setOrderSuccess] = useState(null); // { rescuedMeals, youSave }

  const safeCart = Array.isArray(cart) ? cart : [];

  // ----- Helpers for pricing & limits -----

  const getUnitPrice = (item) => {
    const meal = item.meal || {};
    const raw = Number(meal.rescuePrice);
    if (Number.isFinite(raw) && raw > 0) {
      return raw;
    }
    const fallback = Number(meal.price);
    if (Number.isFinite(fallback) && fallback > 0) {
      return fallback;
    }
    return 5.0;
  };

  const getOriginalPrice = (item) => {
    const meal = item.meal || {};
    const raw = Number(meal.originalPrice);
    if (Number.isFinite(raw) && raw > 0) {
      return raw;
    }
    const rescue = getUnitPrice(item);
    return rescue + 3.0;
  };

  // Max quantity allowed for a single cart line:
  //  - inventory cap: min(availableQuantity, quantity) if present
  //  - per-order cap: meal.maxPerOrder if present
  const getMaxQuantityForItem = (item) => {
    const meal = item.meal || {};

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

    if (inventoryCap === Infinity && perOrderCap === Infinity) {
      return Infinity;
    }
    if (inventoryCap === Infinity) {
      return Math.max(0, perOrderCap);
    }
    if (perOrderCap === Infinity) {
      return Math.max(0, inventoryCap);
    }
    return Math.max(0, Math.min(inventoryCap, perOrderCap));
  };

  const handleQuantityChange = (index, delta) => {
    setCart((prev) => {
      const current = Array.isArray(prev) ? [...prev] : [];
      if (index < 0 || index >= current.length) {
        return current;
      }

      const item = current[index];
      const meal = item.meal || {};
      const maxQty = getMaxQuantityForItem(item);

      const currentQty = Number(item.quantity) || 1;
      let nextQty = currentQty + delta;

      // If decrementing below 1, treat as remove.
      if (nextQty <= 0) {
        current.splice(index, 1);
        return current;
      }

      if (maxQty !== Infinity && nextQty > maxQty) {
        nextQty = maxQty;
        window.alert(
          `You can only rescue up to ${maxQty} of "${meal.name || 'this meal'}" for this order.`
        );
      }

      current[index] = {
        ...item,
        quantity: nextQty,
      };
      return current;
    });
  };

  const handleRemoveItem = (index) => {
    setCart((prev) => {
      const current = Array.isArray(prev) ? [...prev] : [];
      if (index < 0 || index >= current.length) {
        return current;
      }
      current.splice(index, 1);
      return current;
    });
  };

  // ----- Aggregate totals -----

  const rescueMealCount = safeCart.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0
  );

  const subtotal = safeCart.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const unit = getUnitPrice(item);
    return sum + qty * unit;
  }, 0);

  const totalOriginal = safeCart.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const orig = getOriginalPrice(item);
    return sum + qty * orig;
  }, 0);

  const youSave = totalOriginal - subtotal;

  // ----- Checkout handler (talks to backend /checkout) -----

  const handlePlaceOrder = async () => {
    if (safeCart.length === 0) {
      window.alert('Your cart is empty. Please add a rescue meal first.');
      return;
    }

    // Validate client-side that no cart line exceeds allowed limit
    for (let i = 0; i < safeCart.length; i += 1) {
      const item = safeCart[i];
      const maxQty = getMaxQuantityForItem(item);
      const qty = Number(item.quantity) || 0;
      if (maxQty !== Infinity && qty > maxQty) {
        const mealName = (item.meal && item.meal.name) || 'this meal';
        window.alert(
          `You have ${qty}x "${mealName}" in your cart, but only ${maxQty} are allowed for this order. Please adjust your quantities.`
        );
        return;
      }
    }

    setIsPlacingOrder(true);

    const payload = {
      items: safeCart.map((item) => {
        const unitPrice = getUnitPrice(item);
        const originalPrice = getOriginalPrice(item);

        return {
          restaurant: item.restaurant,
          meal: item.meal,
          quantity: Number(item.quantity) || 1,
          isRescueMeal: true,
          price: unitPrice,
          originalPrice:
            Number.isFinite(originalPrice) && originalPrice > 0
              ? originalPrice
              : unitPrice,
        };
      }),
      userEmail: user && user.email ? user.email : null,
      totals: {
        rescueMealCount,
        subtotal: Number(subtotal.toFixed(2)),
        youSave: Number(youSave.toFixed(2)),
      },
      pickupPreference,
    };

    try {
      // Backend checkout route (proxied to http://localhost:5000/checkout)
      const response = await fetch('/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      let data = {};
      try {
        data = await response.json();
      } catch (e) {
        // ignore JSON parse errors
      }

      if (!response.ok) {
        window.alert(
          data.error ||
            data.message ||
            'Failed to place order. Please try again.'
        );
        setIsPlacingOrder(false);
        return;
      }

      if (!data.success) {
        window.alert(
          data.error ||
            data.message ||
            'Order was not accepted. Please double-check your cart and try again.'
        );
        setIsPlacingOrder(false);
        return;
      }

      const order = data.order || null;

      // Clear cart and show local thank-you screen
      setCart([]);
      setOrderSuccess({
        rescuedMeals: rescueMealCount,
        youSave: Number(youSave.toFixed(2)),
      });
      setIsPlacingOrder(false);

      // Notify parent Dashboard (for impact, orders list, etc.)
      if (typeof onOrderPlaced === 'function') {
        onOrderPlaced(order, payload);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error during checkout:', err);
      window.alert(
        'A network error occurred while placing your order. Please try again.'
      );
      setIsPlacingOrder(false);
    }
  };

  // ----- UI states -----

  // After successful checkout: full-screen thank-you message (no blank page)
  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="w-6" />
            <h1 className="text-lg font-semibold text-gray-900">
              Rescue complete
            </h1>
            <div className="w-6" />
          </div>
        </header>

        <main className="px-4 py-8">
          <div className="max-w-md mx-auto bg-white rounded-xl shadow p-6 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Thank you for rescuing food!
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              You rescued{' '}
              <span className="font-semibold text-green-700">
                {orderSuccess.rescuedMeals} meal
                {orderSuccess.rescuedMeals === 1 ? '' : 's'}
              </span>{' '}
              and saved approximately{' '}
              <span className="font-semibold">
                ${orderSuccess.youSave.toFixed(2)}
              </span>
              .
            </p>
            <button
              type="button"
              onClick={onBack}
              className="mt-4 inline-flex items-center px-4 py-2 rounded-full bg-green-600 text-white text-sm font-semibold hover:bg-green-700"
            >
              Back to Browse
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Empty cart state
  if (safeCart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Your Cart</h1>
            <div className="w-6" />
          </div>
        </header>

        <main className="px-4 py-8">
          <div className="max-w-lg mx-auto bg-white rounded-xl shadow p-6 text-center">
            <p className="text-sm text-gray-600 mb-4">
              You don&apos;t have any rescue meals in your cart yet.
            </p>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center px-4 py-2 rounded-full bg-green-600 text-white text-sm font-semibold hover:bg-green-700"
            >
              Browse rescue meals
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Normal cart view
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Your Cart</h1>
          <div className="w-6" />
        </div>
      </header>

      <main className="px-4 py-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: cart items */}
          <div className="lg:col-span-2 space-y-4">
            {safeCart.map((item, index) => {
              const meal = item.meal || {};
              const unitPrice = getUnitPrice(item);
              const originalPrice = getOriginalPrice(item);
              const qty = Number(item.quantity) || 1;
              const lineTotal = unitPrice * qty;
              const maxQty = getMaxQuantityForItem(item);

              const inventoryInfo =
                typeof meal.availableQuantity === 'number' &&
                Number.isFinite(meal.availableQuantity)
                  ? meal.availableQuantity
                  : null;

              return (
                <div
                  key={`${meal.id || index}-${index}`}
                  className="bg-white rounded-xl shadow p-4 flex items-start justify-between"
                >
                  <div className="flex-1">
                    <h2 className="text-base font-semibold text-gray-900">
                      {meal.name || 'Rescue Meal'}
                    </h2>
                    <p className="text-xs text-gray-500 mb-2">
                      {item.restaurant || 'Selected restaurant'}
                    </p>
                    <p className="text-xs text-gray-600">
                      {meal.description || 'Surprise rescue meal box.'}
                    </p>

                    <div className="mt-3 flex items-center space-x-3">
                      <p className="text-sm font-semibold text-green-700">
                        ${unitPrice.toFixed(2)} rescue
                      </p>
                      {Number.isFinite(originalPrice) && originalPrice > 0 && (
                        <p className="text-xs text-gray-500">
                          <span className="line-through text-gray-400">
                            ${originalPrice.toFixed(2)}
                          </span>{' '}
                          <span className="text-green-600 font-semibold">
                            you save ${(originalPrice - unitPrice).toFixed(2)}
                          </span>
                        </p>
                      )}
                    </div>

                    {inventoryInfo !== null && (
                      <p className="mt-1 text-[11px] text-gray-500">
                        {inventoryInfo <= 0
                          ? 'Sold out after this order window'
                          : `${inventoryInfo} left today`}
                      </p>
                    )}

                    {maxQty !== Infinity && (
                      <p className="mt-1 text-[11px] text-gray-500">
                        Max {maxQty} per order
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end space-y-2 ml-4">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(index, -1)}
                        className="p-1 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(index, 1)}
                        className="p-1 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      ${lineTotal.toFixed(2)}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="flex items-center text-xs text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: summary */}
          <div>
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Order Summary
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Original value</span>
                  <span className="text-gray-900">
                    ${totalOriginal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">You save</span>
                  <span className="text-green-700 font-semibold">
                    -${youSave.toFixed(2)}
                  </span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between text-base font-semibold">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs text-gray-500 mb-2 text-left">
                  Meals rescued: {rescueMealCount}
                </p>
                <label className="block text-xs text-gray-600 mb-1 text-left">
                  Pickup preference
                </label>
                <select
                  value={pickupPreference}
                  onChange={(e) => setPickupPreference(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="any">Any available time</option>
                  <option value="lunch">Prefer lunchtime pickup</option>
                  <option value="dinner">Prefer dinnertime pickup</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder || safeCart.length === 0}
                className={`mt-6 w-full inline-flex justify-center items-center px-4 py-2 rounded-full text-sm font-semibold ${
                  isPlacingOrder || safeCart.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isPlacingOrder ? 'Placing order...' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Cart;
