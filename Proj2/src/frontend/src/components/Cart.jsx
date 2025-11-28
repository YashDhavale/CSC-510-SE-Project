// Cart page with client-side inventory guard.
// - Quantity "+" button will not exceed the available inventory
//   reported on each meal (availableQuantity or quantity).
// - Layout and styling follow the original Tiffin Trails design.

import React, { useState } from 'react';
import { ArrowLeft, Plus, Minus, Trash2 } from 'lucide-react';

const Cart = ({ cart, setCart, onBack, onOrderPlaced, user }) => {
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [pickupPreference, setPickupPreference] = useState('any');
  // Local state for post-checkout thank-you screen
  const [orderSuccess, setOrderSuccess] = useState(null);

  const safeCart = Array.isArray(cart) ? cart : [];

  // Get rescue price for a cart item
  const getUnitPrice = (item) => {
    if (!item || !item.meal) return 0;
    const meal = item.meal;
    if (typeof meal.rescuePrice === 'number') return meal.rescuePrice;
    if (typeof meal.rescue_price === 'number') return meal.rescue_price;
    return Number(meal.rescuePrice || meal.rescue_price || 5.0) || 5.0;
  };

  // Get original (non-rescue) price for a cart item
  const getOriginalPrice = (item) => {
    if (!item || !item.meal) return 0;
    const meal = item.meal;
    if (typeof meal.originalPrice === 'number') return meal.originalPrice;
    if (typeof meal.original_price === 'number') return meal.original_price;
    return Number(meal.originalPrice || meal.original_price || 12.0) || 12.0;
  };

  // Compute maximum allowed quantity for a single cart line
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

  // Update quantity with guard for min=1 and max inventory/per-order cap
  const handleQuantityChange = (index, delta) => {
    setCart((prev) => {
      const current = Array.isArray(prev) ? [...prev] : [];
      if (!current[index]) return current;

      const item = current[index];
      const maxQty = getMaxQuantityForItem(item);

      const existingQty = Number(item.quantity) || 1;
      let nextQty = existingQty + delta;

      if (nextQty < 1) nextQty = 1;
      if (maxQty !== Infinity && nextQty > maxQty) nextQty = maxQty;

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
      current.splice(index, 1);
      return current;
    });
  };

  // Total rescued meal count (sum of quantities)
  const rescueMealCount = safeCart.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0
  );

  // Subtotal (rescue price)
  const subtotal = safeCart.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    return sum + getUnitPrice(item) * qty;
  }, 0);

  // Original total before rescue discount
  const totalOriginal = safeCart.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    return sum + getOriginalPrice(item) * qty;
  }, 0);

  const youSave = Math.max(totalOriginal - subtotal, 0);

  // Place order via backend and show thank-you screen instead of blank page
  const handlePlaceOrder = async () => {
    if (safeCart.length === 0 || isPlacingOrder) return;

    setIsPlacingOrder(true);

    // Build payload once so we can also pass it back to Dashboard
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
        // ignore json parse error, data stays {}
      }

      // Non-OK HTTP response (e.g., 500)
      if (!response.ok) {
        window.alert(
          data.error ||
            data.message ||
            'Failed to place order. Please try again.'
        );
        setIsPlacingOrder(false);
        return;
      }

      // Backend responded but did not accept the order
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

      // Let parent Dashboard know an order was placed (for impact, orders list, etc.)
      if (typeof onOrderPlaced === 'function') {
        // Pass both backend order (may be null/partial) and the payload we sent
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

  // After successful checkout: full-screen thank-you message instead of blank page
  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="w-6" />
            <h1 className="text-lg font-semibold text-gray-900">
              Thank you for rescuing food!
            </h1>
            <div className="w-6" />
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-10 text-center">
          <p className="text-gray-700 mb-4">
            You just rescued {orderSuccess.rescuedMeals} meals and saved $
            {orderSuccess.youSave.toFixed(2)}.
          </p>
          <p className="text-gray-500 mb-8">
            Your choices help local restaurants reduce waste and support your
            community.
          </p>
          <button
            type="button"
            onClick={() => {
              setOrderSuccess(null);
              if (typeof onBack === 'function') {
                onBack();
              }
            }}
            className="inline-flex items-center px-4 py-2 rounded-full bg-green-600 text-white text-sm font-medium hover:bg-green-700"
          >
            Continue rescuing meals
          </button>
        </main>
      </div>
    );
  }

  // Empty cart view
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
            className="inline-flex items-center px-4 py-2 rounded-full bg-green-600 text-white text-sm font-medium hover:bg-green-700"
          >
            Browse Restaurants
          </button>
        </main>
      </div>
    );
  }

  // Normal cart view with items and order summary
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
          <h1 className="text-lg font-semibold text-gray-900">Your Cart</h1>
          <div className="w-6" />
        </div>
      </header>

      {/* main */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: cart items */}
          <div className="lg:col-span-2 space-y-4">
            {safeCart.map((item, index) => {
              const meal = item.meal || {};
              const unitPrice = getUnitPrice(item);
              const originalPrice = getOriginalPrice(item);
              const qty = Number(item.quantity) || 1;
              const lineTotal = unitPrice * qty;
              const maxQty = getMaxQuantityForItem(item);

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
                      {Number.isFinite(originalPrice) &&
                        originalPrice > unitPrice && (
                          <p className="text-xs text-gray-400 line-through">
                            ${originalPrice.toFixed(2)}
                          </p>
                        )}
                    </div>

                    <div className="flex items-center space-x-2 mt-3">
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
                        className={`p-1 rounded-full border text-gray-600 hover:bg-gray-100 ${
                          maxQty !== Infinity && qty >= maxQty
                            ? 'opacity-40 cursor-not-allowed'
                            : 'border-gray-300'
                        }`}
                        disabled={maxQty !== Infinity && qty >= maxQty}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      {maxQty !== Infinity && (
                        <span className="ml-2 text-[11px] text-gray-400">
                          Max {maxQty} per order (based on inventory)
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="mt-2 flex items-center text-xs text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Remove
                    </button>
                  </div>

                  <div className="ml-4 text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      ${lineTotal.toFixed(2)}
                    </p>
                    <p className="text-[11px] text-gray-400">Rescue total</p>
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
                {isPlacingOrder
                  ? 'Placing Order...'
                  : 'Place Order & Rescue Food'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Cart;
