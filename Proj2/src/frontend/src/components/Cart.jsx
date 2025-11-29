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
    return 0;
  };

  const getOriginalPrice = (item) => {
    const meal = item.meal || {};
    const raw = Number(meal.originalPrice);
    if (Number.isFinite(raw) && raw > 0) {
      return raw;
    }
    return getUnitPrice(item);
  };

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
      if (!item) {
        return current;
      }

      const quantity = Number(item.quantity) || 0;
      const maxQty = getMaxQuantityForItem(item);

      let nextQty = quantity + delta;
      if (Number.isFinite(maxQty)) {
        if (nextQty > maxQty) {
          nextQty = maxQty;
        }
      }
      if (nextQty < 1) {
        nextQty = 1;
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

  const totals = safeCart.reduce(
    (acc, item) => {
      const qty = Number(item.quantity) || 0;
      if (qty <= 0) {
        return acc;
      }

      const unitPrice = getUnitPrice(item);
      const original = getOriginalPrice(item);

      const lineSavings = Math.max(original - unitPrice, 0) * qty;

      return {
        count: acc.count + qty,
        subtotal: acc.subtotal + unitPrice * qty,
        youSave: acc.youSave + lineSavings,
      };
    },
    { count: 0, subtotal: 0, youSave: 0 }
  );

  // ----- Submit order -----

  const handlePlaceOrder = async () => {
    if (!safeCart.length) {
      return;
    }

    setIsPlacingOrder(true);

    const payload = {
      cart: safeCart.map((item) => ({
        restaurant: item.restaurant,
        meal: item.meal,
        quantity: item.quantity,
      })),
      userEmail: user && user.email ? user.email : null,
      totals: {
        rescueMealCount: totals.count,
        subtotal: Number(totals.subtotal.toFixed(2)),
        youSave: Number(totals.youSave.toFixed(2)),
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

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        const message =
          errData && errData.error
            ? errData.error
            : 'Failed to place order. Please try again.';
        // eslint-disable-next-line no-alert
        alert(message);
        setIsPlacingOrder(false);
        return;
      }

      const data = await response.json();

      const rescuedMeals = totals.count;
      const youSave = totals.youSave;

      setOrderSuccess({
        rescuedMeals,
        youSave,
      });

      if (typeof onOrderPlaced === 'function') {
        onOrderPlaced({
          order: data.order || null,
          rescuedMeals,
          youSave,
        });
      }

      setCart([]);
      setIsPlacingOrder(false);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error placing order:', err);
      // eslint-disable-next-line no-alert
      alert(
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
            <h1 className="text-lg font-semibold text-gray-800">
              Thanks for rescuing food!
            </h1>
            <div className="w-6" />
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
            <p className="text-xl font-semibold text-gray-900 mb-2">
              Order confirmed
            </p>
            <p className="text-sm text-gray-600 mb-4">
              You rescued
              {' '}
              <span className="font-semibold text-green-700">
                {orderSuccess.rescuedMeals}
                {' '}
                meals
              </span>
              {' '}
              and saved
              {' '}
              <span className="font-semibold text-green-700">
                $
                {orderSuccess.youSave.toFixed(2)}
              </span>
              .
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Show your confirmation at pickup. Your restaurant partner is
              preparing your rescue meal.
            </p>
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 bg-green-600 text-white rounded-full text-sm font-medium hover:bg-green-700"
            >
              Back to browsing
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Empty-cart view (before placing any order)
  if (!safeCart.length) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center text-sm text-gray-700 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to browse
            </button>
            <h1 className="text-lg font-semibold text-gray-800">Your Cart</h1>
            <div className="w-6" />
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center text-sm text-gray-500">
            No items in your cart yet. Browse rescue meals and add a few to
            start your rescue.
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center text-sm text-gray-700 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to browse
          </button>
          <h1 className="text-lg font-semibold text-gray-800">Your Cart</h1>
          <div className="w-6" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <section className="bg-white rounded-xl shadow-sm border border-gray-100">
          <ul className="divide-y divide-gray-100">
            {safeCart.map((item, index) => {
              const meal = item.meal || {};
              const restaurantName = item.restaurant || 'Restaurant';

              const unitPrice = getUnitPrice(item);
              const original = getOriginalPrice(item);
              const quantity = Number(item.quantity) || 0;

              const lineSavings = Math.max(original - unitPrice, 0) * quantity;

              const maxQty = getMaxQuantityForItem(item);
              const reachedMax =
                Number.isFinite(maxQty) && quantity >= maxQty && maxQty > 0;

              return (
                <li
                  key={`${restaurantName}-${meal.id || meal.name || index}`}
                  className="px-4 py-3 flex items-start justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {meal.name || 'Rescue meal'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {restaurantName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Pickup:
                      {' '}
                      {meal.pickupWindow || 'Pickup within today'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {Number.isFinite(original) && original > 0 ? (
                        <>
                          <span className="line-through mr-1">
                            $
                            {original.toFixed(2)}
                          </span>
                          <span className="text-green-700 font-semibold">
                            $
                            {unitPrice.toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <span className="text-green-700 font-semibold">
                          $
                          {unitPrice.toFixed(2)}
                        </span>
                      )}
                    </p>
                    {lineSavings > 0 && (
                      <p className="text-xs text-green-600 mt-1">
                        You save $
                        {lineSavings.toFixed(2)}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(index, -1)}
                        className="p-1 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-medium text-gray-900 w-6 text-center">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(index, 1)}
                        className={`p-1 rounded-full border ${
                          reachedMax
                            ? 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                        disabled={reachedMax}
                        title={
                          reachedMax
                            ? 'Reached maximum available for this meal'
                            : 'Increase quantity'
                        }
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    {Number.isFinite(maxQty) && maxQty > 0 && (
                      <p className="mt-1 text-[10px] text-gray-500">
                        Max:
                        {' '}
                        {maxQty}
                        {' '}
                        today
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="mt-2 inline-flex items-center text-xs text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Remove
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Rescue meals
            </span>
            <span className="text-sm font-semibold text-gray-900">
              {totals.count}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Subtotal
            </span>
            <span className="text-sm font-semibold text-gray-900">
              $
              {totals.subtotal.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              You save
            </span>
            <span className="text-sm font-semibold text-green-700">
              $
              {totals.youSave.toFixed(2)}
            </span>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-medium text-gray-700 mb-2">
              Pickup preference
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                { value: 'any', label: 'Any time today' },
                { value: 'lunch', label: 'Lunch window' },
                { value: 'dinner', label: 'Dinner window' },
              ].map((slot) => (
                <button
                  key={slot.value}
                  type="button"
                  onClick={() => setPickupPreference(slot.value)}
                  className={`px-3 py-1 rounded-full border ${
                    pickupPreference === slot.value
                      ? 'border-green-600 bg-green-50 text-green-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {slot.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={isPlacingOrder}
              className={`w-full inline-flex items-center justify-center px-4 py-2 rounded-full text-sm font-semibold ${
                isPlacingOrder
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isPlacingOrder ? 'Placing order...' : 'Place Order'}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Cart;
