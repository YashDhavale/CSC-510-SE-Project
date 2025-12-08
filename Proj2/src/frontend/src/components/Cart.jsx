// Proj2/src/frontend/src/components/Cart.jsx
// Cart page with client-side inventory guard and pickup time preference.
// - Quantity +/- buttons never exceed available inventory (availableQuantity or quantity).
// - Sends pickupPreference to backend so orders carry a simple time-slot hint.
// - After successful checkout, shows an in-app thank-you screen instead of a blank page.

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Minus, Trash2 } from 'lucide-react';

const RESCUE_STEPS = [
  {
    target: 25,
    label: 'Order received',
    description: 'We have your rescue order and are logging your impact.',
  },
  {
    target: 50,
    label: 'Reserving surplus meals',
    description:
      'We’re reserving surplus portions at the restaurant so they don’t get wasted.',
  },
  {
    target: 75,
    label: 'Coordinating pickup window',
    description:
      'We’re aligning your pickup window with the restaurant’s closing routine.',
  },
  {
    target: 100,
    label: 'Ready for pickup window',
    description:
      'Your rescued meal will be ready during your chosen pickup window.',
  },
];

const Cart = ({ cart, setCart, onBack, onOrderPlaced, user }) => {
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [pickupPreference, setPickupPreference] = useState('any');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(null); // { rescuedMeals, youSave }
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [showCardDemo, setShowCardDemo] = useState(false);

  const safeCart = Array.isArray(cart) ? cart : [];

  useEffect(() => {
    // If there is no successful order yet, reset and do nothing
    if (!orderSuccess) {
      setProgress(0);
      setCurrentStep(0);
      return undefined;
    }

    let cancelled = false;
    const timeouts = [];

    const runStep = (stepIndex) => {
      if (cancelled || stepIndex >= RESCUE_STEPS.length) return;

      const step = RESCUE_STEPS[stepIndex];
      setCurrentStep(stepIndex);

      // Move the bar to this checkpoint
      setProgress(step.target);

      // Time for the bar to animate + pause at the checkpoint
      const ANIMATION_MS = 2000; // bar visually moves ~2s
      const PAUSE_MS = 4000; // stays at checkpoint for 4s
      const TOTAL_WAIT = ANIMATION_MS + PAUSE_MS;

      // Schedule next checkpoint
      if (stepIndex < RESCUE_STEPS.length - 1) {
        const timeoutId = setTimeout(() => {
          runStep(stepIndex + 1);
        }, TOTAL_WAIT);
        timeouts.push(timeoutId);
      }
    };

    // Start from the first checkpoint
    setProgress(0);
    runStep(0);

    // Cleanup if user leaves the screen or a new order starts
    return () => {
      cancelled = true;
      timeouts.forEach((id) => clearTimeout(id));
    };
  }, [orderSuccess]);

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
    // Basic guards
    if (!safeCart.length) {
      alert('Your cart is empty. Add a rescue meal to continue.');
      return;
    }

    if (!paymentMethod) {
      alert('Please choose a payment method to continue.');
      return;
    }

    // Card demo: show the card UI, but do NOT place an order
    if (paymentMethod === 'card_demo') {
      setShowCardDemo(true);
      alert(
        'Card payment is a demo screen in this prototype. The Pay button will not complete the order.\n\nPlease choose Cash on Delivery to actually place your rescue order.'
      );
      return;
    }

    // Online / UPI demo: also does NOT place an order
    if (paymentMethod === 'online') {
      alert(
        'Online payment is shown for demonstration only.\n\nPlease select Cash on Delivery to actually place the order.'
      );
      return;
    }

    // Only Cash on Delivery actually places the order
    if (paymentMethod !== 'cash_on_delivery') {
      // Safety net: nothing else should try to place an order
      return;
    }

    // At this point we know we can place the order
    setIsPlacingOrder(true);

    // Build payload for backend
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
      paymentMethod, // 'cash_on_delivery'
    };

    try {
      const response = await fetch('/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let message = 'Failed to place order. Please try again.';
        try {
          const errData = await response.json();
          if (errData && errData.error) {
            message = errData.error;
          }
        } catch (e) {
          // ignore JSON parse errors, use default message
        }
        alert(message);
        setIsPlacingOrder(false);
        return;
      }

      const data = await response.json();

      const rescuedMeals = totals.count;
      const youSave = totals.youSave;

      // Show success / progress view
      setOrderSuccess({
        rescuedMeals,
        youSave,
      });

      // Notify parent if needed
      if (typeof onOrderPlaced === 'function') {
        onOrderPlaced({
          order: data.order || null,
          rescuedMeals,
          youSave,
        });
      }

      // Clear cart
      setCart([]);
      setIsPlacingOrder(false);
    } catch (err) {
      console.error('Error placing order:', err);
      alert(
        'A network error occurred while placing your order. Please try again.'
      );
      setIsPlacingOrder(false);
    }
  };

  // ----- UI states -----
  // After successful checkout: full-screen thank-you message (no blank page)
  if (orderSuccess) {
    const activeStep =
      RESCUE_STEPS[Math.min(currentStep, RESCUE_STEPS.length - 1)];

    return (
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-md border border-green-100 p-6 mt-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xl">
            ✓
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Thanks for rescuing a meal!
            </h2>
            <p className="text-sm text-gray-600">
              You&apos;ve rescued{' '}
              <span className="font-semibold text-green-700">
                {orderSuccess.rescuedMeals}
              </span>{' '}
              meals and saved about{' '}
              <span className="font-semibold text-green-700">
                ${orderSuccess.youSave.toFixed(2)}
              </span>
              .
            </p>
          </div>
        </div>

        {/* Progress bar + checkpoints */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-gray-700 uppercase tracking-wide">
              Order progress
            </span>
            <span className="text-gray-500">
              {Math.round(progress)}%
            </span>
          </div>
          {/* The bar */}
          <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden relative">
            <div
              className="h-2.5 bg-green-600 transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
          {/* Checkpoints (dots + labels) */}
          <div className="flex justify-between text-[11px] text-gray-500">
            {RESCUE_STEPS.map((step, index) => {
              const isDone = index < currentStep;
              const isActive = index === currentStep;
              return (
                <div
                  key={step.label}
                  className="flex-1 flex flex-col items-center"
                >
                  <div
                    className={[
                      'w-6 h-6 rounded-full border flex items-center justify-center text-[10px]',
                      isDone
                        ? 'bg-green-600 text-white border-green-600'
                        : isActive
                        ? 'bg-green-100 text-green-700 border-green-600'
                        : 'bg-white text-gray-400 border-gray-300',
                    ].join(' ')}
                  >
                    {isDone ? '✓' : index + 1}
                  </div>
                  <span className="mt-1 text-center leading-tight">
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
          {/* Description for the current checkpoint */}
          <p className="text-xs text-gray-600">
            {activeStep.description}
          </p>
        </div>
        {/* Impact blurb */}
        <div className="text-xs text-gray-500 bg-green-50 border border-green-100 rounded-xl p-3">
          By choosing a rescue meal, you&apos;re helping this restaurant
          reduce food waste and making better use of surplus food that would
          otherwise be thrown away.
        </div>
        <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
          <button
            type="button"
            onClick={onBack}
            className="text-xs font-medium text-green-700 hover:text-green-800"
          >
            Back to restaurants
          </button>
        </div>
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
                    <p className="text-xs text-gray-500">{restaurantName}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Pickup:{' '}
                      {meal.pickupWindow || 'Pickup within today'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {Number.isFinite(original) && original > 0 ? (
                        <>
                          <span className="line-through mr-1">
                            ${original.toFixed(2)}
                          </span>
                          <span className="text-green-700 font-semibold">
                            ${unitPrice.toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <span className="text-green-700 font-semibold">
                          ${unitPrice.toFixed(2)}
                        </span>
                      )}
                    </p>
                    {lineSavings > 0 && (
                      <p className="text-xs text-green-600 mt-1">
                        You save ${lineSavings.toFixed(2)}
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
                        Max: {maxQty} today
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
              ${totals.subtotal.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              You save
            </span>
            <span className="text-sm font-semibold text-green-700">
              ${totals.youSave.toFixed(2)}
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

          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Payment method
            </h3>
            <div className="space-y-2">
              {/* Cash on Delivery */}
              <label className="flex items-center space-x-3 text-sm text-gray-700">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash_on_delivery"
                  checked={paymentMethod === 'cash_on_delivery'}
                  onChange={(e) => {
                    setPaymentMethod(e.target.value);
                    setShowCardDemo(false);
                  }}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                />
                <span>Cash on Delivery</span>
              </label>

              {/* Online demo (NetBanking / UPI) */}
              <label className="flex items-center space-x-3 text-sm text-gray-400">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="online"
                  checked={paymentMethod === 'online'}
                  onChange={(e) => {
                    setPaymentMethod(e.target.value);
                    setShowCardDemo(false);
                  }}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                />
                <span>NetBanking / Online (demo)</span>
              </label>

              {/* Card payment demo */}
              <label className="flex items-center space-x-3 text-sm text-gray-400">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card_demo"
                  checked={paymentMethod === 'card_demo'}
                  onChange={(e) => {
                    setPaymentMethod(e.target.value);
                    setShowCardDemo(true); // show the fake card form
                  }}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                />
                <span>Card payment (demo – pay button disabled)</span>
              </label>
            </div>
          </div>

          {/* Card payment demo UI – does NOT actually charge or place order */}
          {showCardDemo && !orderSuccess && (
            <div className="mt-3 p-3 rounded-xl border border-gray-200 bg-gray-50 space-y-3">
              <p className="text-xs font-semibold text-gray-700">
                Card payment (demo)
              </p>
              <div className="space-y-2">
                <input
                  type="text"
                  className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs focus:outline-none"
                  placeholder="Card number"
                  disabled
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-xs focus:outline-none"
                    placeholder="MM/YY"
                    disabled
                  />
                  <input
                    type="text"
                    className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-xs focus:outline-none"
                    placeholder="CVV"
                    disabled
                  />
                </div>
                <input
                  type="text"
                  className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs focus:outline-none"
                  placeholder="Name on card"
                  disabled
                />
              </div>

              <button
                type="button"
                onClick={() =>
                  alert(
                    'This is a demo card screen. Card payments are disabled in this prototype. Please choose Cash on Delivery to complete your rescue order.'
                  )
                }
                className="mt-2 w-full text-xs font-semibold rounded-lg px-3 py-2 bg-gray-300 text-gray-500 cursor-not-allowed"
              >
                Pay (disabled in demo)
              </button>

              <p className="text-[11px] text-gray-500">
                Card details are intentionally disabled in this rescue meal
                prototype. Only Cash on Delivery actually completes the order.
              </p>
            </div>
          )}

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
