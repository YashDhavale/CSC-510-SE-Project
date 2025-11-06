import React, { useState } from 'react';
import { ShoppingCart, CheckCircle, X, Plus, Minus, Trash2, ArrowLeft, Award } from 'lucide-react';

const Cart = ({ cart, setCart, onBack, restaurants, onOrderPlaced }) => {
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Calculate totals
  const calculateTotals = () => {
    let subtotal = 0;
    let totalSavings = 0;
    let rescueMealCount = 0;

    cart.forEach(item => {
      const price = item.meal.rescuePrice || item.meal.originalPrice;
      subtotal += price * item.quantity;
      
      // Check if it's a rescue meal
      if (item.meal.rescuePrice && item.meal.originalPrice) {
        totalSavings += (item.meal.originalPrice - item.meal.rescuePrice) * item.quantity;
        rescueMealCount += item.quantity;
      }
    });

    return {
      subtotal: subtotal.toFixed(2),
      totalSavings: totalSavings.toFixed(2),
      total: subtotal.toFixed(2),
      rescueMealCount
    };
  };

  const updateQuantity = (index, change) => {
    const newCart = [...cart];
    newCart[index].quantity = Math.max(1, newCart[index].quantity + change);
    setCart(newCart);
  };

  const removeItem = (index) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
  };

  const handlePlaceOrder = async () => {
    setIsPlacingOrder(true);
    
    try {
      // Prepare order data
      const orderData = {
        items: cart.map(item => ({
          restaurant: item.restaurant,
          meal: item.meal.name,
          price: item.meal.rescuePrice || item.meal.originalPrice,
          quantity: item.quantity,
          isRescueMeal: !!(item.meal.rescuePrice && item.meal.originalPrice)
        })),
        totals: calculateTotals()
      };

      // Call backend API to place order
      const response = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        const result = await response.json();
        setOrderPlaced(true);
        
        // Clear cart after successful order
        setTimeout(() => {
          setCart([]);
          if (onOrderPlaced) {
            onOrderPlaced(result);
          }
        }, 2000);
      } else {
        console.error('Failed to place order');
        alert('Failed to place order. Please try again.');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Error placing order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const totals = calculateTotals();

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Order Placed Successfully!</h2>
          <p className="text-gray-600 mb-6">Thank you for your order. You'll receive a confirmation shortly.</p>
          {totals.rescueMealCount > 0 && (
            <div className="bg-green-50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-center space-x-2 text-green-700">
                <Award className="w-5 h-5" />
                <span className="font-semibold">You've helped reduce food waste!</span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                {totals.rescueMealCount} rescue meal{totals.rescueMealCount > 1 ? 's' : ''} saved
              </p>
            </div>
          )}
          <button
            onClick={onBack}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <button
            onClick={onBack}
            className="mb-6 flex items-center space-x-2 text-green-600 hover:text-green-700"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Browse</span>
          </button>
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <ShoppingCart className="w-24 h-24 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Start adding items to your cart!</p>
            <button
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <button
          onClick={onBack}
          className="mb-6 flex items-center space-x-2 text-green-600 hover:text-green-700"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Browse</span>
        </button>

        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl p-8 mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Cart</h1>
          <p className="text-lg">Review your order before placing it</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items Table */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">Order Items</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Restaurant</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {cart.map((item, index) => {
                      const isRescueMeal = item.meal.rescuePrice && item.meal.originalPrice;
                      const price = item.meal.rescuePrice || item.meal.originalPrice;
                      const itemTotal = price * item.quantity;

                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{item.meal.name}</div>
                              {isRescueMeal && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 mt-1">
                                  Rescue Meal
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{item.restaurant}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {isRescueMeal ? (
                                <div>
                                  <span className="text-gray-400 line-through">${item.meal.originalPrice}</span>
                                  <span className="ml-2 text-green-600 font-bold">${item.meal.rescuePrice}</span>
                                </div>
                              ) : (
                                <span>${price}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => updateQuantity(index, -1)}
                                className="p-1 rounded hover:bg-gray-200"
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(index, 1)}
                                className="p-1 rounded hover:bg-gray-200"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">${itemTotal.toFixed(2)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => removeItem(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>${totals.subtotal}</span>
                </div>
                {totals.totalSavings > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>You Saved</span>
                    <span className="font-bold">${totals.totalSavings}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-bold text-gray-800">
                  <span>Total</span>
                  <span>${totals.total}</span>
                </div>
              </div>

              {totals.rescueMealCount > 0 && (
                <div className="bg-green-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-2 text-green-700 mb-1">
                    <Award className="w-5 h-5" />
                    <span className="font-semibold">Impact Points</span>
                  </div>
                  <p className="text-sm text-green-600">
                    {totals.rescueMealCount} rescue meal{totals.rescueMealCount > 1 ? 's' : ''} will earn restaurant points!
                  </p>
                </div>
              )}

              <button
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;

