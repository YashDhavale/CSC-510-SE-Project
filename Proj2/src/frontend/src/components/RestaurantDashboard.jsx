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
          <div className="flex items-center space-x-2 text-xs bg-green-50 px-3 py-2 rounded-full text-green-700">
            <Leaf className="w-4 h-4 mr-1" />
            <span>Powered by the same data your customers see</span>
          </div>
        </section>

        {/* Tabs */}
        <section className="flex items-center space-x-4 text-sm">
          <button
            type="button"
            onClick={() => setActiveView('today')}
            className={`pb-1 border-b-2 ${
              activeView === 'today'
                ? 'border-green-600 text-green-700 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setActiveView('menu')}
            className={`pb-1 border-b-2 ${
              activeView === 'menu'
                ? 'border-green-600 text-green-700 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            Menu &amp; inventory
          </button>
        </section>

        {/* Loading state */}
        {loading && (
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-sm text-gray-500">
            Loading restaurant data...
          </section>
        )}

        {!loading && (
          <>
            {activeView === 'today' && (
              <TodayView
                metrics={metrics}
                overview={overview}
                allSoldOut={allSoldOut}
              />
            )}
            {activeView === 'menu' && <MenuView meals={meals} />}

            {/* Inventory alerts */}
            <InventoryAlerts
              lowInventoryMeals={lowInventoryMeals}
              allSoldOut={allSoldOut}
            />
          </>
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
            <Leaf className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {formatCount(metrics.totalMealsRescued)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Additional meals sold through Tiffin Trails
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
              lbs of food kept out of landfill.
            </p>
          </div>
        </div>
        {allSoldOut ? (
          <p className="text-xs text-green-700 bg-green-50 px-3 py-2 rounded-full">
            All listed rescue meals are sold out today — nice work!
          </p>
        ) : (
          <p className="text-xs text-gray-600">
            Consider increasing tomorrow&apos;s rescue meal quantity if you
            consistently sell out.
          </p>
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
          const sold = Number(meal.sold || (base - available));

          const isSoldOut = available <= 0;
          const lowInventory = !isSoldOut && available <= 2;

          return (
            <div
              key={meal.id}
              className="px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between"
            >
              <div className="mb-2 md:mb-0">
                <p className="text-sm font-semibold text-gray-900">
                  {meal.mealName}
                </p>
                <p className="text-xs text-gray-500">
                  {formatCurrency(meal.rescuePrice)}
                  {' '}
                  rescue price
                  {Number.isFinite(meal.originalPrice) &&
                    meal.originalPrice > 0 && (
                      <>
                        {' '}
                        <span className="line-through text-gray-400 text-[11px]">
                          {formatCurrency(meal.originalPrice)}
                        </span>
                      </>
                    )}
                </p>
                {meal.expiresIn && (
                  <p className="text-xs text-gray-500">
                    Pickup window:
                    {' '}
                    {meal.expiresIn}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {available}
                  {' '}
                  remaining
                  {base > 0 && (
                    <>
                      {' '}
                      <span className="text-xs text-gray-500">
                        /
                        {base}
                        {' '}
                        listed
                      </span>
                    </>
                  )}
                </p>
                {sold > 0 && (
                  <p className="text-xs text-gray-500">
                    {sold}
                    {' '}
                    already rescued
                  </p>
                )}
                <div className="mt-1">
                  {isSoldOut ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600">
                      Sold out today
                    </span>
                  ) : lowInventory ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-yellow-50 text-yellow-700">
                      Low inventory — almost gone
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-50 text-green-700">
                      Available
                    </span>
                  )}
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
 * Inventory alerts: highlight low inventory or sold-out state.
 */
function InventoryAlerts({ lowInventoryMeals, allSoldOut }) {
  if (allSoldOut) {
    return (
      <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 flex items-start space-x-2 text-xs text-green-800">
        <Leaf className="w-4 h-4 mt-0.5" />
        <div>
          <p className="font-semibold">All listed rescue meals are sold out.</p>
          <p>
            Consider whether you want to increase tomorrow&apos;s rescue meal
            quantity or add a second time window.
          </p>
        </div>
      </div>
    );
  }

  if (!lowInventoryMeals || lowInventoryMeals.length === 0) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-start space-x-2 text-xs text-gray-700">
        <Clock className="w-4 h-4 mt-0.5 text-gray-500" />
        <div>
          <p className="font-semibold">Inventory looks healthy.</p>
          <p>
            Rescue meals still have available units. Monitor this section as you
            get closer to peak times.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 border border-yellow-100 rounded-xl px-4 py-3 flex items-start space-x-2 text-xs text-yellow-800">
      <AlertTriangle className="w-4 h-4 mt-0.5" />
      <div>
        <p className="font-semibold">Some meals are almost sold out.</p>
        <p>
          Consider pausing standard menu promos on these items or increasing
          tomorrow&apos;s rescue quantity if they consistently sell fast.
        </p>
        {lowInventoryMeals.length > 0 && (
          <ul className="mt-2 list-disc list-inside text-[11px]">
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
