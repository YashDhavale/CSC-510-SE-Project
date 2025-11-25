import React, { useState } from 'react';
import {
  ShoppingCart,
  CheckCircle,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  Award,
} from 'lucide-react';

const Cart = ({ cart, setCart, onBack, restaurants, onOrderPlaced }) => {
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Calculate subtotal, savings, and rescued meals
  const calculateTotals = () => {
    let subtotal = 0;
    let totalSavings = 0;
    let rescueMealCount = 0;

    cart.forEach((item) => {
      const price = item.meal.rescuePrice || item.meal.originalPrice;
      const original = item.meal.originalPrice;

      subtotal += price * item.quantity;

      if (item.meal.rescuePrice && original) {
        rescueMealCount += item.quantity;
        totalSavings += (original - price) * item.quantity;
      }
    });

    return {
      subtotal: Number(subtotal.toFixed(2)),
      totalSavings: Number(totalSavings.toFixed(2)),
      total: Number(subtotal.toFixed(2)),
      rescueMealCount,
    };
  };

  const handleQuantityChange = (index, delta) => {
    setCart((prevCart) => {
      const updated = [...prevCart];
      const newQty = updated[index].quantity + delta;
      if (newQty <= 0) {
        updated.splice(index, 1);
      } else {
        updated[index] = { ...updated[index], quantity: newQty };
      }
      return updated;
    });
  };

  const handleRemoveItem = (index) => {
    setCart((prevCart) => prevCart.filter((_, i) => i !== index));
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      alert('Your cart is empty.');
      return;
    }

    setIsPlacingOrder(true);

    try {
      const totals = calculateTotals();

      const orderData = {
        items: cart.map((item) => ({
          restaurant: item.restaurant, // Dashboard passes restaurant.name as a string
          meal: item.meal.name,
          price: item.meal.rescuePrice || item.meal.originalPrice,
          quantity: item.quantity,
          // Match backend expectation in cart.js (isRescueMeal)
          isRescueMeal: !!(item.meal.rescuePrice && item.meal.originalPrice),
        })),
        totals,
      };

      // Use relative URL so CRA proxy forwards to backend (port 5000)
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        console.error('Failed to place order, HTTP error:', response.status);
        alert('Failed to place order. Please try again.');
        return;
      }

      const data = await response.json();

      if (!data.success) {
        console.error('Order not successful:', data);
        alert(data.message || 'Error placing order. Please try again.');
        return;
      }

      setOrderPlaced(true);
      setCart([]);

      if (onOrderPlaced) {
        onOrderPlaced(data);
      }
    } catch (err) {
      console.error('Error placing order:', err);
      alert('Error placing order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const totals = calculateTotals();

  // Success screen after order placement
  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Order Placed Successfully!
          </h2>
          <p className="text-gray-600 mb-6">
            Thank you for your order. You will receive a confirmation shortly.
          </p>
          {totals.rescueMealCount > 0 && (
            <div className="bg-green-50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-center space-x-2 text-green-700">
                <Award className="w-5 h-5" />
                <span className="font-semibold">
                  You have helped reduce food waste!
                </span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                {totals.rescueMealCount} rescue meal
                {totals.rescueMealCount > 1 ? 's' : ''} saved
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={onBack}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  // Empty cart view
  if (!orderPlaced && cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <button
            type="button"
            onClick={onBack}
            className="mb-6 flex items-center space-x-2 text-green-600 hover:text-green-700"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Browse</span>
          </button>
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Your cart is empty
            </h2>
            <p className="text-gray-600 mb-4">
              Browse partner restaurants to rescue surplus meals and save money.
            </p>
            <button
              type="button"
              onClick={onBack}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold"
            >
              Start Browsing
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main cart view
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <button
          type="button"
          onClick={onBack}
          className="mb-6 flex items-center space-x-2 text-green-600 hover:text-green-700"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Browse</span>
        </button>

        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 rounded-full p-3">
                <ShoppingCart className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Your Cart</h2>
                <p className="text-gray-500">
                  Review your rescued meals before checkout.
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Cart items */}
            <div className="md:col-span-2 space-y-4">
              {cart.map((item, index) => (
                <div
                  key={`${item.restaurant}-${item.meal.name}-${index}`}
                  className="flex items-start justify-between border rounded-lg p-4"
                >
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">{item.restaurant}</p>
                    <h3 className="font-semibold text-gray-800">
                      {item.meal.name}
                    </h3>
                    {item.meal.rescuePrice && (
                      <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                        Rescue meal
                      </span>
                    )}
                    <p className="mt-2 text-sm text-gray-600">
                      {item.meal.description}
                    </p>
                  </div>
                  <div className="ml-4 flex flex-col items-end space-y-2">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(index, -1)}
                        className="p-1 rounded hover:bg-gray-200"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(index, 1)}
                        className="p-1 rounded hover:bg-gray-200"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="font-semibold text-gray-800">
                      $
                      {(
                        (item.meal.rescuePrice || item.meal.originalPrice) *
                        item.quantity
                      ).toFixed(2)}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="text-red-600 hover:text-red-800 text-sm inline-flex items-center space-x-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order summary */}
            <div className="bg-gray-50 rounded-lg p-4 md:p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Order Summary
              </h3>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Savings from rescue meals</span>
                  <span className="text-green-600">
                    -${totals.totalSavings.toFixed(2)}
                  </span>
                </div>
                <div className="border-t border-gray-200 my-2" />
                <div className="flex justify-between font-semibold text-base">
                  <span>Total</span>
                  <span>${totals.total.toFixed(2)}</span>
                </div>
              </div>

              {totals.rescueMealCount > 0 && (
                <div className="bg-green-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-2 text-green-700 mb-1">
                    <Award className="w-5 h-5" />
                    <span className="font-semibold">Impact Points</span>
                  </div>
                  <p className="text-sm text-green-600">
                    {totals.rescueMealCount} rescue meal
                    {totals.rescueMealCount > 1 ? 's' : ''} will earn restaurant
                    points.
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
              </button>
            </div>
          </div>

          {/* Optional: partner restaurants strip at bottom, using existing styles */}
          {Array.isArray(restaurants) && restaurants.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-8 mt-10">
              <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">
                Our Partner Restaurants
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                {restaurants.map((r, index) => (
                  <div key={index} className="text-center">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-full w-16 h-16 mx-auto mb-2 flex items-center justify-center">
                      <span className="text-2xl" role="img" aria-label="store">
                        🏪
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-800">
                      {r.name}
                    </p>
                    <p className="text-xs text-gray-500">{r.cuisine}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cart;
