// Proj2/src/frontend/src/components/Cart.jsx
// Cart page with client-side inventory guard.
// - Quantity "+" button will not exceed the available inventory
//   reported on each meal (availableQuantity or quantity).
// - Layout and styling follow the original Tiffin Trails design.

import React, { useState } from 'react';
import { ArrowLeft, Plus, Minus, Trash2 } from 'lucide-react';

const Cart = ({ cart, setCart, onBack, onOrderPlaced, user }) => {
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [pickupPreference, setPickupPreference] = useState('any');

  const safeCart = Array.isArray(cart) ? cart : [];

  const getUnitPrice = (item) => {
    if (!item || !item.meal) return 0;
    const meal = item.meal;
    if (typeof meal.rescuePrice === 'number') return meal.rescuePrice;
    if (typeof meal.rescue_price === 'number') return meal.rescue_price;
    return Number(meal.rescuePrice || meal.rescue_price || 5.0) || 5.0;
  };

  const getOriginalPrice = (item) => {
    if (!item || !item.meal) return 0;
    const meal = item.meal;
    if (typeof meal.originalPrice === 'number') return meal.originalPrice;
    if (typeof meal.original_price === 'number') return meal.original_price;
    return Number(meal.originalPrice || meal.original_price || 12.0) || 12.0;
  };

  const getMaxQuantityForItem = (item) => {
    if (!item || !item.meal) return Infinity;

    const meal = item.meal;

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
    return Math.min(inventoryCap, perOrderCap);
  };

  const handleQuantityChange = (index, delta) => {
    setCart((prev) => {
      const current = Array.isArray(prev) ? [...prev] : [];
      const entry = current[index];
      if (!entry) return prev;

      const maxQty = getMaxQuantityForItem(entry);
      const currentQty = Number(entry.quantity) || 1;
      const nextQty = currentQty + delta;

      if (nextQty <= 0) {
        current.splice(index, 1);
        return current;
      }

      if (maxQty !== Infinity && nextQty > maxQty) {
        entry.quantity = maxQty;
        return current;
      }

      entry.quantity = nextQty;
      return current;
    });
  };

  const handleRemoveItem = (index) => {
    setCart((prev) => {
      const current = Array.isArray(prev) ? [...prev] : [];
      current.splice(index, 1);
      return current;
    });
  };

  const rescueMealCount = safeCart.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0
  );

  const subtotal = safeCart.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    return sum + getUnitPrice(item) * qty;
  }, 0);

  const totalOriginal = safeCart.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    return sum + getOriginalPrice(item) * qty;
  }, 0);

  const youSave = Math.max(totalOriginal - subtotal, 0);

  const handlePlaceOrder = async () => {
    if (safeCart.length === 0 || isPlacingOrder) return;

    setIsPlacingOrder(true);

    try {
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

      const response = await fetch('/cart/checkout', {
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
        // ignore json parse error, data stays {}
      }

      if (!response.ok || !data.success) {
        // eslint-disable-next-line no-console
        console.error('Checkout failed:', data.error || 'Unknown error');
        setIsPlacingOrder(false);
        return;
      }

      const order = data.order || null;

      setCart([]);
      setIsPlacingOrder(false);

      if (typeof onOrderPlaced === 'function') {
        onOrderPlaced(order);
      }

      if (typeof onBack === 'function') {
        onBack();
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error during checkout:', err);
      setIsPlacingOrder(false);
    }
  };

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
              Back to Browse
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Your Cart</h1>
            <div className="w-6" />
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-10 text-center">
          <p className="text-gray-600 mb-4">
            Your cart is empty. Start rescuing meals from local restaurants!
          </p>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700"
          >
            Browse Restaurants
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* header */}
      <header className="bg-white shadow">
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
            Your Cart ({rescueMealCount} meals)
          </h1>
          <div className="w-6" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: cart items */}
        <div className="lg:col-span-2 space-y-4">
          {safeCart.map((item, index) => {
            const unitPrice = getUnitPrice(item);
            const originalPrice = getOriginalPrice(item);
            const qty = Number(item.quantity) || 1;
            const maxQty = getMaxQuantityForItem(item);

            return (
              <div
                key={`${item.restaurant}-${index}`}
                className="bg-white rounded-xl shadow p-4 flex"
              >
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {item.meal?.name || 'Rescue Meal'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {item.restaurant}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Pickup:{' '}
                    {item.meal?.pickupWindow || 'Pickup within today'}
                  </p>
                </div>

                <div className="flex flex-col items-end ml-4">
                  <div className="text-right mb-2">
                    <p className="text-sm font-semibold text-gray-900">
                      ${unitPrice.toFixed(2)}
                    </p>
                    {Number.isFinite(originalPrice) && originalPrice > 0 && (
                      <p className="text-xs text-gray-400 line-through">
                        ${originalPrice.toFixed(2)}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(index, -1)}
                      className="p-1 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-medium text-gray-900">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(index, 1)}
                      disabled={maxQty !== Infinity && qty >= maxQty}
                      className={`p-1 rounded-full border border-gray-300 ${
                        maxQty !== Infinity && qty >= maxQty
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="mt-2 flex items-center text-xs text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Remove
                  </button>

                  {maxQty !== Infinity && (
                    <p className="mt-1 text-[11px] text-gray-400">
                      Max {maxQty} per order (based on inventory)
                    </p>
                  )}
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
                <span className="text-gray-600">You Save</span>
                <span className="text-green-600">
                  ${youSave.toFixed(2)}
                </span>
              </div>
              <hr className="my-3" />
              <div className="flex justify-between font-semibold">
                <span className="text-gray-900">Total</span>
                <span className="text-gray-900">
                  ${subtotal.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-1">
              <label className="block text-xs font-semibold text-gray-700">
                Pickup preference
              </label>
              <select
                value={pickupPreference}
                onChange={(e) => setPickupPreference(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm focus:ring-green-500 focus:border-green-500"
              >
                <option value="any">
                  Any time within the listed pickup window
                </option>
                <option value="early">Prefer earlier in the window</option>
                <option value="middle">Prefer middle of the window</option>
                <option value="late">Prefer closer to closing time</option>
              </select>
              <p className="mt-1 text-[11px] text-gray-500">
                This note is saved with your order to help partners plan pickups.
              </p>
            </div>

            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={safeCart.length === 0 || isPlacingOrder}
              className={`mt-6 w-full inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold ${
                safeCart.length === 0 || isPlacingOrder
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isPlacingOrder
                ? 'Placing Order...'
                : 'Place Order & Rescue Food'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Cart;
