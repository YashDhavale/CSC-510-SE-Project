// Proj2/src/frontend/src/components/Cart.jsx
// Cart page with client-side inventory guard.
// - Quantity "+" button will not exceed the available inventory
//   reported on each meal (availableQuantity or quantity).
// - Layout and styling follow the original Tiffin Trails design.

import React, { useState } from 'react';
import { ArrowLeft, Plus, Minus, Trash2 } from 'lucide-react';

const Cart = ({ cart, setCart, onBack, onOrderPlaced, user }) => {
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const safeCart = Array.isArray(cart) ? cart : [];

  const getUnitPrice = (item) => {
    if (!item || !item.meal) return 0;
    const meal = item.meal;
    if (typeof meal.rescuePrice === 'number') return meal.rescuePrice;
    if (typeof meal.price === 'number') return meal.price;
    if (typeof meal.originalPrice === 'number') return meal.originalPrice;
    const parsed = Number(meal.rescuePrice || meal.price || meal.originalPrice || 0);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const getOriginalPrice = (item) => {
    if (!item || !item.meal) return null;
    const meal = item.meal;
    if (typeof meal.originalPrice === 'number') return meal.originalPrice;
    const parsed = Number(meal.originalPrice);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const getMaxQuantityForItem = (item) => {
    if (!item || !item.meal) return Infinity;
    const meal = item.meal;
    if (typeof meal.availableQuantity === 'number' && Number.isFinite(meal.availableQuantity)) {
      return meal.availableQuantity;
    }
    if (typeof meal.quantity === 'number' && Number.isFinite(meal.quantity)) {
      return meal.quantity;
    }
    return Infinity; // no explicit limit from backend
  };

  const handleUpdateQuantity = (index, newQuantity) => {
    if (!Number.isFinite(newQuantity)) return;

    setCart((prev) => {
      const current = Array.isArray(prev) ? [...prev] : [];
      const item = current[index];
      if (!item) return current;

      const maxQty = getMaxQuantityForItem(item);

      // clamp between 1 and maxQty (or at least 1)
      const clamped =
        maxQty === Infinity
          ? Math.max(1, newQuantity)
          : Math.max(1, Math.min(newQuantity, maxQty));

      current[index] = { ...item, quantity: clamped };
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
    const price = getUnitPrice(item);
    return sum + price * qty;
  }, 0);

  const totalOriginal = safeCart.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const orig = getOriginalPrice(item);
    const price = getUnitPrice(item);
    if (orig != null && orig > 0) {
      return sum + orig * qty;
    }
    return sum + price * qty;
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
              originalPrice != null ? originalPrice : unitPrice,
          };
        }),
        userEmail: user && user.email ? user.email : null,
        totals: {
          rescueMealCount,
          subtotal: Number(subtotal.toFixed(2)),
          youSave: Number(youSave.toFixed(2)),
        },
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

      if (!response.ok || !data || data.success !== true) {
        const errorMessage =
          (data && data.error) ||
          'Failed to place order. Please try again.';
        // keep the existing alert UX
        // eslint-disable-next-line no-alert
        alert(errorMessage);
        setIsPlacingOrder(false);
        return;
      }

      // success
      setCart([]);
      setIsPlacingOrder(false);

      if (typeof onOrderPlaced === 'function') {
        onOrderPlaced(data.order);
      }

      // eslint-disable-next-line no-alert
      alert('Thank you! Your rescue order has been placed.');
    } catch (err) {
      console.error('Error placing order:', err);
      // eslint-disable-next-line no-alert
      alert('Failed to place order. Please try again.');
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center text-sm text-green-700 hover:text-green-900"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Browse
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: cart items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Your Cart
                </h1>
                <p className="text-sm text-gray-600">
                  Review your rescued meals before checking out
                </p>
              </div>
              <div className="text-right text-xs text-gray-500">
                <div className="uppercase tracking-wide">Rescue Meals</div>
                <div className="text-green-600 text-lg font-bold">
                  {rescueMealCount}
                </div>
                <div className="mt-1 uppercase tracking-wide text-gray-500">
                  You Save
                </div>
                <div className="text-blue-600 text-lg font-bold">
                  ${youSave.toFixed(2)}
                </div>
              </div>
            </div>

            {safeCart.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500">
                Your cart is empty. Browse meals to start rescuing surplus food.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                {safeCart.map((item, index) => {
                  const unitPrice = getUnitPrice(item);
                  const originalPrice = getOriginalPrice(item);
                  const qty = Number(item.quantity) || 1;
                  const maxQty = getMaxQuantityForItem(item);
                  const atMax =
                    maxQty !== Infinity && qty >= maxQty;

                  return (
                    <div
                      key={`${item.restaurant}-${index}`}
                      className="flex items-center justify-between border border-gray-100 rounded-lg px-4 py-3 bg-white"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {item.restaurant}
                        </p>
                        <p className="text-sm text-gray-700">
                          {item.meal && item.meal.name
                            ? item.meal.name
                            : 'Rescue meal'}
                        </p>
                        <span className="inline-flex mt-1 px-2 py-0.5 rounded-full text-[11px] bg-green-50 text-green-700">
                          Rescue meal
                        </span>
                        {maxQty !== Infinity && (
                          <p className="mt-1 text-[11px] text-gray-500">
                            Max {maxQty} per order for this meal.
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          {originalPrice != null && originalPrice > unitPrice && (
                            <p className="text-xs text-gray-400 line-through">
                              ${originalPrice.toFixed(2)}
                            </p>
                          )}
                          <p className="text-sm font-semibold text-gray-900">
                            ${unitPrice.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateQuantity(index, qty - 1)
                            }
                            disabled={qty <= 1}
                            className={`w-7 h-7 flex items-center justify-center rounded-full border ${
                              qty <= 1
                                ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-sm font-medium">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateQuantity(index, qty + 1)
                            }
                            disabled={atMax}
                            className={`w-7 h-7 flex items-center justify-center rounded-full border ${
                              atMax
                                ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="text-xs text-red-500 hover:text-red-600 flex items-center"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
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
