import React, { useEffect, useMemo, useState } from 'react';
import {
  Leaf,
  TrendingUp,
  Clock,
  Truck,
  AlertTriangle,
  LogOut,
} from 'lucide-react';

const REFRESH_MS = 15000; // auto-refresh restaurant data every 15 seconds

/**
 * Simple helpers for formatting numbers and dates.
 */
function formatCurrency(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return '$0.00';
  }
  return num.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatCount(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return 0;
  }
  return num;
}

function formatDateTime(value) {
  if (!value) return 'Unknown time';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown time';
  }
  return date.toLocaleString();
}

/**
 * RestaurantDashboard
 * A restaurant-facing view that:
 *  - shows high level metrics for a specific restaurant
 *  - lists recent rescue orders
 *  - lets staff update simple order status (pending / ready / picked up / no-show)
 *  - lists rescue meals and remaining inventory
 *  - surfaces simple sustainability insights
 */
export default function RestaurantDashboard({ restaurantName, onLogout }) {
  const [overview, setOverview] = useState(null);
  const [menuData, setMenuData] = useState(null);
  const [activeView, setActiveView] = useState('today');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!restaurantName) {
      setOverview(null);
      setMenuData(null);
      return;
    }

    let isCancelled = false;
    let intervalId = null;

    async function fetchRestaurantData() {
      if (!restaurantName) return;
      try {
        if (!overview && !menuData) {
          // show loading only for the very first fetch
          setLoading(true);
          setError(null);
        }

        const encoded = encodeURIComponent(restaurantName);

        const [overviewRes, menuRes] = await Promise.all([
          fetch(`/restaurant/overview?restaurant=${encoded}`),
          fetch(`/restaurant/menu?restaurant=${encoded}`),
        ]);

        if (!overviewRes.ok || !menuRes.ok) {
          throw new Error('Failed to load restaurant data');
        }

        const overviewJson = await overviewRes.json();
        const menuJson = await menuRes.json();

        if (!isCancelled) {
          setOverview(overviewJson);
          setMenuData(menuJson);
          setError(null);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error loading restaurant dashboard data:', err);
        if (!isCancelled) {
          setError('Unable to load restaurant data at the moment.');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    // initial load
    fetchRestaurantData();

    // periodic refresh to keep orders and inventory near-real-time
    intervalId = setInterval(fetchRestaurantData, REFRESH_MS);

    return () => {
      isCancelled = true;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
    // we intentionally depend only on restaurantName so we do not recreate
    // intervals unnecessarily.
  }, [restaurantName]);

  async function handleOrderStatusChange(orderId, nextStatus) {
    if (!orderId || !nextStatus) {
      return;
    }

    try {
      const res = await fetch('/restaurant/order-status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          status: nextStatus,
        }),
      });

      if (!res.ok) {
        // eslint-disable-next-line no-console
        console.error('Failed to update order status');
        return;
      }

      const data = await res.json();
      const updatedStatus =
        (data && data.order && data.order.status) || nextStatus;

      setOverview((prev) => {
        if (!prev) {
          return prev;
        }

        const updatedOrders = (prev.recentOrders || []).map((order) =>
          order.id === orderId ? { ...order, status: updatedStatus } : order
        );

        return {
          ...prev,
          recentOrders: updatedOrders,
        };
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error updating order status:', err);
    }
  }

  const metrics = overview?.metrics || {
    totalOrders: 0,
    totalMealsRescued: 0,
    totalRevenue: 0,
    estimatedWastePreventedLbs: 0,
  };

  const meals = menuData?.meals || [];

  const allSoldOut =
    meals.length > 0 &&
    meals.every(
      (meal) => Number(meal.availableQuantity || 0) <= 0
    );

  const safeRestaurantName =
    (menuData && menuData.restaurant && menuData.restaurant.name) ||
    restaurantName ||
    'Your restaurant';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Restaurant dashboard</p>
            <h1 className="text-lg font-semibold text-gray-900">
              {safeRestaurantName}
            </h1>
          </div>
          <button
            type="button"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
            onClick={onLogout}
          >
            <LogOut className="w-4 h-4 mr-1" />
            Log out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Top-level summary and tabs */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Today&apos;s rescue impact
            </p>
            <p className="text-xl font-semibold text-gray-900 mt-1">
              {formatCount(metrics.totalMealsRescued)}
              {' '}
              meals rescued
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Estimated
              {' '}
              {formatCurrency(metrics.totalRevenue)}
              {' '}
              in extra revenue and
              {' '}
              {formatCount(metrics.estimatedWastePreventedLbs)}
              {' '}
              lbs of food saved from landfill.
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="inline-flex items-center text-gray-700">
              <Clock className="w-4 h-4 mr-1 text-gray-500" />
              <span>Today&apos;s operations</span>
            </div>
            <div className="inline-flex items-center">
              {allSoldOut ? (
                <>
                  <AlertTriangle className="w-4 h-4 mr-1 text-yellow-500" />
                  <span className="text-yellow-700">
                    All rescue meals sold out
                  </span>
                </>
              ) : (
                <>
                  <Leaf className="w-4 h-4 mr-1 text-green-500" />
                  <span className="text-green-700">
                    Rescue meals still available
                  </span>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Tabs */}
        <section className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-6 text-sm">
            <button
              type="button"
              className={`pb-2 border-b-2 ${
                activeView === 'today'
                  ? 'border-green-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveView('today')}
            >
              Today&apos;s operations
            </button>
            <button
              type="button"
              className={`pb-2 border-b-2 ${
                activeView === 'menu'
                  ? 'border-green-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveView('menu')}
            >
              Menu &amp; inventory
            </button>
          </nav>
        </section>

        {/* Content */}
        {loading && (
          <div className="text-sm text-gray-500">Loading restaurant data...</div>
        )}

        {!loading && (
          <>
            {activeView === 'today' && (
              <TodayView
                metrics={metrics}
                overview={overview}
                allSoldOut={allSoldOut}
                onOrderStatusChange={handleOrderStatusChange}
              />
            )}
            {activeView === 'menu' && <MenuView meals={meals} />}
          </>
        )}
      </main>
    </div>
  );
}

function TodayView({ metrics, overview, allSoldOut, onOrderStatusChange }) {
  const handleStatusChange = onOrderStatusChange || (() => {});
  const recentOrders = overview?.recentOrders || [];

  return (
    <div className="space-y-6">
      {/* metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500">
              Rescue Orders
            </span>
            <Truck className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {formatCount(metrics.totalOrders)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            All orders with at least one rescue meal
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500">
              Meals Rescued
            </span>
            <Leaf className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {formatCount(metrics.totalMealsRescued)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Additional meals sold through Tiffin Trails
          </p>
        </div>

        <div className="bg白 rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500">
              Extra Revenue
            </span>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {formatCurrency(metrics.totalRevenue)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            From surplus that would otherwise go unsold
          </p>
        </div>
      </div>

      {/* recent orders */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">
            Recent Rescue Orders
          </h2>
          <span className="text-xs text-gray-500">
            {recentOrders.length === 0
              ? 'No orders yet'
              : `Showing latest ${recentOrders.length} orders`}
          </span>
        </div>

        {recentOrders.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-500">
            When customers place rescue orders from your restaurant, they will
            appear here with basic details.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="mb-2 sm:mb-0">
                  <p className="text-sm font-medium text-gray-800">
                    Order
                    {' '}
                    {order.id}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDateTime(order.timestamp)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {order.items
                      .map(
                        (item) =>
                          `${item.meal} ×${formatCount(item.quantity)}`
                      )
                      .join(', ')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(
                      order.items.reduce(
                        (sum, item) =>
                          sum + formatCount(item.quantity) * item.price,
                        0
                      )
                    )}
                  </p>
                  {order.userEmail && (
                    <p className="text-xs text-gray-500 mt-1">
                      {order.userEmail}
                    </p>
                  )}
                  <div className="mt-2 flex items-center justify-end space-x-2">
                    <span className="text-xs text-gray-500">Status:</span>
                    <select
                      className="text-xs border border-gray-300 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-green-500"
                      value={order.status || 'PENDING'}
                      onChange={(e) =>
                        handleStatusChange(order.id, e.target.value)
                      }
                    >
                      <option value="PENDING">Pending</option>
                      <option value="READY">Ready</option>
                      <option value="PICKED_UP">Picked up</option>
                      <option value="NO_SHOW">No-show</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* sustainability card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
            <Leaf className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">
              Sustainability impact
            </p>
            <p className="text-xs text-gray-500">
              Estimated
              {' '}
              {formatCount(metrics.estimatedWastePreventedLbs)}
              {' '}
              lbs of food saved from landfill by today&apos;s rescue orders.
            </p>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          {allSoldOut ? (
            <span>
              You&apos;ve sold out of all rescue meals today – consider adding a
              few more portions tomorrow.
            </span>
          ) : (
            <span>
              You still have rescue meals available – keeping them visible helps
              more neighbors rescue surplus food.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function MenuView({ meals }) {
  const lowInventoryMeals = useMemo(
    () =>
      meals.filter(
        (meal) =>
          Number(meal.availableQuantity || 0) > 0 &&
          Number(meal.availableQuantity || 0) <= 3
      ),
    [meals]
  );

  return (
    <div className="space-y-6">
      {/* Alerts */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-yellow-50 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">
              Low inventory alerts
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Keep an eye on portions that are about to sell out so you can
              adjust preparation or listing for tomorrow.
            </p>
          </div>
        </div>
        {lowInventoryMeals.length === 0 ? (
          <p className="mt-3 text-xs text-gray-500">
            No low inventory alerts right now. Nice and stable.
          </p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {lowInventoryMeals.map((meal) => (
              <li
                key={meal.id}
                className="flex items-center justify-between text-gray-800"
              >
                <span>{meal.mealName}</span>
                <span className="text-xs font-medium text-yellow-800 bg-yellow-100 px-2 py-0.5 rounded-full">
                  Remaining:
                  {' '}
                  {formatCount(meal.availableQuantity)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Full menu & inventory */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-800">
            Rescue meals &amp; inventory
          </h2>
          <span className="text-xs text-gray-500">
            {meals.length === 0
              ? 'No rescue meals configured yet'
              : `${meals.length} rescue meals listed`}
          </span>
        </div>

        {meals.length === 0 ? (
          <p className="text-sm text-gray-500">
            You don&apos;t have any rescue meals configured yet. Once you add
            them to the CSV, they will appear here with real-time inventory.
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {meals.map((meal) => (
              <div
                key={meal.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {meal.mealName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {meal.pickupWindow
                      ? `Pickup window: ${meal.pickupWindow}`
                      : 'Pickup window not specified'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {meal.maxPerOrder
                      ? `Max per order: ${meal.maxPerOrder}`
                      : 'No per-order limit'}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <div className="text-sm font-semibold text-gray-900">
                    {meal.rescuePrice != null ? (
                      <>
                        {formatCurrency(meal.rescuePrice)}
                        {meal.originalPrice != null && (
                          <span className="ml-1 text-xs text-gray-500 line-through">
                            {formatCurrency(meal.originalPrice)}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-sm text-gray-500">
                        Price not set
                      </span>
                    )}
                  </div>
                  <div className="text-xs">
                    {meal.status === 'SOLD_OUT' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-red-700 bg-red-50 border border-red-100">
                        Sold out
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-green-700 bg-green-50 border border-green-100">
                        Available:
                        {' '}
                        {formatCount(meal.availableQuantity)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
