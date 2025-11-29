import React, { useEffect, useMemo, useState } from 'react';
import {
  Leaf,
  TrendingUp,
  Clock,
  Truck,
  AlertTriangle,
  LogOut,
} from 'lucide-react';

/**
 * Simple helpers for formatting numbers and dates.
 */
function formatCurrency(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return '$0.00';
  }
  return `$${num.toFixed(2)}`;
}

function formatCount(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return '0';
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return String(num);
}

function formatDateTime(isoString) {
  if (!isoString) {
    return 'Unknown time';
  }
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return isoString;
  }
  return date.toLocaleString();
}

/**
 * RestaurantDashboard
 * A read-only, restaurant-facing view that:
 *  - shows high level metrics for a specific restaurant
 *  - lists recent rescue orders
 *  - lists rescue meals and remaining inventory
 *  - surfaces simple sustainability insights
 *
 * It never mutates inventory, so customer flows remain stable.
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

    async function fetchRestaurantData() {
      setLoading(true);
      setError(null);

      try {
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
        }
      } catch (err) {
        if (!isCancelled) {
          // eslint-disable-next-line no-console
          console.error('Error loading restaurant dashboard data:', err);
          setError('Unable to load restaurant data at the moment.');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    fetchRestaurantData();

    return () => {
      isCancelled = true;
    };
  }, [restaurantName]);

  const metrics = overview?.metrics || {
    totalOrders: 0,
    totalMealsRescued: 0,
    totalRevenue: 0,
    estimatedWastePreventedLbs: 0,
  };

  const meals = menuData?.meals || [];

  const lowInventoryMeals = useMemo(
    () =>
      meals.filter(
        (meal) =>
          Number(meal.availableQuantity || 0) > 0 &&
          Number(meal.availableQuantity || 0) <= 2
      ),
    [meals]
  );

  const allSoldOut =
    meals.length > 0 &&
    meals.every((meal) => Number(meal.availableQuantity || 0) <= 0);

  const safeRestaurantName = restaurantName || 'Your Restaurant';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* local header, similar styling to customer dashboard */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-100">
              <Leaf className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Tiffin Trails – Restaurant Console
              </h1>
              <p className="text-xs text-gray-500">
                Monitoring rescue meals and impact for
                {' '}
                <span className="font-semibold">{safeRestaurantName}</span>
                .
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center text-xs font-medium text-gray-600 hover:text-gray-900"
          >
            <LogOut className="w-4 h-4 mr-1" />
            Logout
          </button>
        </div>
      </header>

      {/* main content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {!restaurantName && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 mb-4 text-sm text-yellow-800">
            No restaurant is associated with this account. Please contact the
            team to link a restaurant name.
          </div>
        )}

        {/* view switcher */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => setActiveView('today')}
              className={`text-sm font-medium ${
                activeView === 'today'
                  ? 'text-green-600 border-b-2 border-green-600 pb-1'
                  : 'text-gray-600 hover:text-gray-900 pb-1'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setActiveView('menu')}
              className={`text-sm font-medium ${
                activeView === 'menu'
                  ? 'text-green-600 border-b-2 border-green-600 pb-1'
                  : 'text-gray-600 hover:text-gray-900 pb-1'
              }`}
            >
              Menu &amp; Inventory
            </button>
            <button
              type="button"
              onClick={() => setActiveView('insights')}
              className={`text-sm font-medium ${
                activeView === 'insights'
                  ? 'text-green-600 border-b-2 border-green-600 pb-1'
                  : 'text-gray-600 hover:text-gray-900 pb-1'
              }`}
            >
              Insights
            </button>
          </div>

          {loading && (
            <span className="text-xs text-gray-500 animate-pulse">
              Loading latest data…
            </span>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
            <div>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* views */}
        {activeView === 'today' && (
          <TodayView metrics={metrics} overview={overview} allSoldOut={allSoldOut} />
        )}

        {activeView === 'menu' && <MenuView meals={meals} />}

        {activeView === 'insights' && (
          <InsightsView metrics={metrics} lowInventoryMeals={lowInventoryMeals} />
        )}
      </main>
    </div>
  );
}

/**
 * Today view: high level metrics and recent orders.
 */
function TodayView({ metrics, overview, allSoldOut }) {
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
            Orders that included rescue meals
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500">
              Meals Rescued
            </span>
            <Clock className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {formatCount(metrics.totalMealsRescued)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Portions saved from surplus
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
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
            From selling rescue meals instead of wasting them
          </p>
        </div>
      </div>

      {/* stock status alert */}
      {allSoldOut && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
          <div>
            <p className="text-sm text-yellow-800 font-medium">
              All rescue meals are currently sold out.
            </p>
            <p className="text-xs text-yellow-800 mt-1">
              Consider planning a new rescue batch so customers can keep
              rescuing food from your restaurant.
            </p>
          </div>
        </div>
      )}

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
                          sum +
                          Number(item.price || 0) *
                            Number(item.quantity || 0),
                        0
                      )
                    )}
                  </p>
                  {order.userEmail && (
                    <p className="text-xs text-gray-500 mt-1">
                      Customer:
                      {' '}
                      {order.userEmail}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Menu & Inventory view: per-meal status with remaining quantity.
 */
function MenuView({ meals }) {
  if (!meals || meals.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-6 text-sm text-gray-500">
        No rescue meals are configured for this restaurant in the current
        dataset.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-800">
          Rescue Meals &amp; Inventory
        </h2>
        <p className="text-xs text-gray-500">
          Data is read-only and based on the same inventory used by customers.
        </p>
      </div>

      <div className="divide-y divide-gray-100">
        {meals.map((meal) => {
          const available = Number(meal.availableQuantity || 0);
          const base = Number(meal.baseQuantity || 0);
          const sold = Number(meal.sold || 0);
          const soldOut = available <= 0;
          const low = available > 0 && available <= 2;

          return (
            <div
              key={meal.id}
              className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="mb-2 sm:mb-0">
                <p className="text-sm font-semibold text-gray-900">
                  {meal.mealName}
                </p>
                <p className="text-xs text-gray-500">
                  {meal.expiresIn ? `Expires in ${meal.expiresIn}` : 'Expires soon'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Base quantity:
                  {' '}
                  {formatCount(base)}
                  {' '}
                  · Sold:
                  {' '}
                  {formatCount(sold)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {formatCurrency(meal.rescuePrice)}
                </p>
                <p className="text-xs text-gray-500">
                  Original:
                  {' '}
                  {formatCurrency(meal.originalPrice)}
                </p>

                <div className="mt-1 inline-flex items-center text-xs">
                  <span
                    className={`px-2 py-0.5 rounded-full font-medium ${
                      soldOut
                        ? 'bg-gray-100 text-gray-600'
                        : low
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {soldOut
                      ? 'Sold out'
                      : `Available: ${formatCount(available)}`}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Insights view: simple stats + low inventory signals.
 */
function InsightsView({ metrics, lowInventoryMeals }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h2 className="text-sm font-semibold text-gray-800 mb-3">
          Sustainability Impact
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Total rescue orders</p>
            <p className="text-xl font-semibold text-gray-900">
              {formatCount(metrics.totalOrders)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Meals rescued</p>
            <p className="text-xl font-semibold text-gray-900">
              {formatCount(metrics.totalMealsRescued)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Waste prevented</p>
            <p className="text-xl font-semibold text-gray-900">
              {formatCount(metrics.estimatedWastePreventedLbs)}
              {' '}
              lbs
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h2 className="text-sm font-semibold text-gray-800 mb-3">
          Low Inventory Alerts
        </h2>
        {(!lowInventoryMeals || lowInventoryMeals.length === 0) && (
          <p className="text-sm text-gray-500">
            No rescue meals are currently in the low-stock range (≤ 2 units).
          </p>
        )}

        {lowInventoryMeals && lowInventoryMeals.length > 0 && (
          <ul className="space-y-2">
            {lowInventoryMeals.map((meal) => (
              <li
                key={meal.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-gray-800">{meal.mealName}</span>
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
    </div>
  );
}
