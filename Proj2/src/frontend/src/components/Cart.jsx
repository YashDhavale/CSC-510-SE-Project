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

const Cart = ({ cart, setCart, onBack, onOrderPlaced, user }) => {
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [lastOrderTotals, setLastOrderTotals] = useState(null);

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

    const total = subtotal;

    return {
      subtotal: Number(subtotal.toFixed(2)),
      totalSavings: Number(totalSavings.toFixed(2)),
      total: Number(total.toFixed(2)),
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
          restaurant: item.restaurant,
          meal: item.meal.name,
          price: item.meal.rescuePrice || item.meal.originalPrice,
          quantity: item.quantity,
          isRescueMeal: !!(item.meal.rescuePrice && item.meal.originalPrice),
        })),
        totals,
        // keep shape compatible if backend wants email later
        userEmail: user && user.email ? user.email : undefined,
      };

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

      // 成功：記住這次的統計數字，顯示感謝畫面
      setLastOrderTotals(totals);
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
  const displayTotals = lastOrderTotals || totals;

  // —— 下單成功畫面 —— //
  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Thank you for rescuing food!
          </h2>
          <p className="text-gray-600 mb-6">
            Your order was placed successfully. By choosing rescue meals, you&apos;re
            helping local restaurants and keeping perfectly good food out of
            landfills.
          </p>

          {displayTotals.rescueMealCount > 0 && (
            <div className="bg-green-50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-center space-x-2 text-green-700">
                <Award className="w-5 h-5" />
                <span className="font-semibold">
                  You just rescued {displayTotals.rescueMealCount}{' '}
                  rescue meal
                  {displayTotals.rescueMealCount > 1 ? 's' : ''}!
                </span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                Estimated savings: ${displayTotals.totalSavings.toFixed(2)} and
                less food waste going to the trash.
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

  // —— 空購物車畫面（還沒下單或成功後已離開感謝畫面才會看到） —— //
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
              Your cart is empty. Browse restaurants to rescue meals!
            </p>
            <button
              type="button"
              onClick={onBack}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold"
            >
              Browse Restaurants
            </button>
          </div>
        </div>
      </div>
    );
  }

  // —— 一般購物車畫面 —— //
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart items */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl shadow-lg p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Your Cart</h2>
                <p className="text-sm text-gray-500">
                  Review your rescued meals before checking out
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">RESCUE MEALS</p>
                <p className="text-lg font-bold text-green-600">
                  {totals.rescueMealCount}
                </p>
                <p className="text-xs text-gray-500 mt-2">YOU SAVE</p>
                <p className="text-lg font-bold text-blue-600">
                  ${totals.totalSavings.toFixed(2)}
                </p>
              </div>
            </div>

            {cart.map((item, index) => (
              <div
                key={`${item.restaurant}-${item.meal.name}-${index}`}
                className="bg-white rounded-xl shadow p-4 flex items-start"
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
                  {item.meal.description && (
                    <p className="mt-2 text-sm text-gray-600">
                      {item.meal.description}
                    </p>
                  )}
                </div>
                <div className="ml-4 flex flex-col items-end space-y-2">
                  <div className="flex items-center space-x-2">
                    {item.meal.originalPrice && (
                      <span className="text-xs text-gray-400 line-through">
                        ${item.meal.originalPrice.toFixed(2)}
                      </span>
                    )}
                    <span className="text-lg font-semibold text-gray-900">
                      $
                      {(item.meal.rescuePrice || item.meal.originalPrice).toFixed(
                        2
                      )}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(index, -1)}
                      className="p-1 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(index, 1)}
                      className="p-1 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
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
            ))}
          </div>

          {/* Order summary */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Order Summary
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-900">
                    ${totals.subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">You Save</span>
                  <span className="font-medium text-green-600">
                    ${totals.totalSavings.toFixed(2)}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex items-center justify-between">
                  <span className="text-gray-800 font-semibold">Total</span>
                  <span className="text-xl font-bold text-gray-900">
                    ${totals.total.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder}
                className="w-full bg-green-600 text-white py-3 rounded-lg mt-6 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPlacingOrder
                  ? 'Placing Order...'
                  : 'Place Order & Rescue Food'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
