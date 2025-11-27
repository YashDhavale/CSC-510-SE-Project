// Proj2/src/frontend/src/components/Dashboard.jsx
import React, { useState, useEffect, useMemo } from 'react';
import Cart from './Cart';
import LeaderboardPanel from './LeaderboardPanel';
import RestaurantDetail from './RestaurantDetail';
import {
  ShoppingCart,
  Heart,
  Leaf,
  TrendingUp,
  Users,
  Star,
  Search,
  MapPin,
  Clock,
  Award,
  Truck,
  Package,
  Menu,
  X,
  Zap,
} from 'lucide-react';

import { restaurants as staticRestaurants } from '../data/staticdata';

// Small helper to summarize rescue inventory for a restaurant
const summarizeRescueInventory = (restaurant) => {
  if (!restaurant || !Array.isArray(restaurant.menus)) {
    return { totalAvailable: null, allSoldOut: false };
  }

  const totalAvailable = restaurant.menus.reduce((sum, meal) => {
    const qty =
      typeof meal.availableQuantity === 'number'
        ? meal.availableQuantity
        : typeof meal.quantity === 'number'
        ? meal.quantity
        : 0;

    if (!Number.isFinite(qty) || qty <= 0) {
      return sum;
    }
    return sum + qty;
  }, 0);

  return {
    totalAvailable,
    allSoldOut: totalAvailable === 0,
  };
};

// helper: default rescue meal when no menus are available
// quantityHint is used as both starting quantity and per-order max for this box.
const createDefaultMealForRestaurant = (restaurant, quantityHint) => {
  const safeQty =
    typeof quantityHint === 'number' && Number.isFinite(quantityHint)
      ? Math.max(1, quantityHint)
      : 1;

  return {
    id: `${restaurant.id || restaurant._id || restaurant.name}-default-rescue`,
    name: 'Rescue Meal Box',
    description: 'Chef-selected surplus meal from today.',
    originalPrice: 12.0,
    rescuePrice: 5.0,
    pickupWindow: 'Today, 5–8 PM',
    isRescueMeal: true,
    // both inventory cap and per-order cap
    availableQuantity: safeQty,
    maxPerOrder: safeQty,
    quantity: safeQty,
  };
};

const Dashboard = ({ user, onLogout }) => {
  const [currentView, setCurrentView] = useState('browse');
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCuisine, setFilterCuisine] = useState('all');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [favorites, setFavorites] = useState(new Set());
  const [showCartToast, setShowCartToast] = useState(false);

  const [selectedRestaurantDetail, setSelectedRestaurantDetail] =
    useState(null);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [restaurants, setRestaurants] = useState([]);
  const [userImpact, setUserImpact] = useState({
    mealsOrdered: 0,
    moneySaved: 0,
    foodWastePrevented: 0,
    carbonReduced: 0,
    localRestaurantsSupported: 0,
    impactLevel: 'New Rescuer',
  });
  const [communityStats, setCommunityStats] = useState({
    activeUsers: 0,
    mealsRescued: 0,
    wastePreventedTons: 0,
  });
  const [loading, setLoading] = useState(true);

  const [userOrders, setUserOrders] = useState([]);
  const [ordersError, setOrdersError] = useState(null);

  // Fetch restaurants + community stats (with static fallback)
  useEffect(() => {
    fetch('/dashboard/restaurants-with-meals')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setRestaurants(data);
        } else {
          // eslint-disable-next-line no-console
          console.warn(
            'restaurants-with-meals returned empty, falling back to static data'
          );
          setRestaurants(staticRestaurants);
        }
        setLoading(false);
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('Error fetching restaurants:', err);
        setRestaurants(staticRestaurants);
        setLoading(false);
      });

    fetch('/dashboard/community-stats')
      .then((res) => res.json())
      .then((data) => setCommunityStats(data))
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('Error fetching community stats:', err);
      });
  }, []);

  // Fetch user-specific impact + order history
  useEffect(() => {
    if (!user || !user.email) {
      setUserImpact({
        mealsOrdered: 0,
        moneySaved: 0,
        foodWastePrevented: 0,
        carbonReduced: 0,
        localRestaurantsSupported: 0,
        impactLevel: 'New Rescuer',
      });
      setUserOrders([]);
      setOrdersError(null);
      return;
    }

    const emailParam = encodeURIComponent(user.email);

    // Impact for this specific user
    fetch(`/dashboard/user-impact?email=${emailParam}`)
      .then((res) => res.json())
      .then((data) => {
        setUserImpact((prev) => ({
          ...prev,
          ...data,
        }));
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('Error fetching user impact:', err);
      });

    // Order history – we filter by userEmail on the frontend
    fetch('/api/orders')
      .then((res) => res.json())
      .then((data) => {
        // backend may return: [ ... ]  or  { orders: [...] }  or  { success: true, orders: [...] }
        let ordersList = [];

        if (Array.isArray(data)) {
          ordersList = data;
        } else if (data && Array.isArray(data.orders)) {
          ordersList = data.orders;
        } else {
          setUserOrders([]);
          setOrdersError('Unable to load orders.');
          return;
        }

        const filtered = ordersList
          .filter(
            (order) =>
              typeof order.userEmail === 'string' &&
              order.userEmail === user.email
          )
          .sort((a, b) => {
            const at = new Date(a.timestamp || 0).getTime();
            const bt = new Date(b.timestamp || 0).getTime();
            return bt - at;
          });

        setUserOrders(filtered);
        setOrdersError(null);
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('Error fetching orders:', err);
        setUserOrders([]);
        setOrdersError('Unable to load your orders right now.');
      });
  }, [user]);

  // Personalized: how many meals has this user rescued at each restaurant?
  const rescuedMealsByRestaurant = useMemo(() => {
    const counts = new Map();

    if (!Array.isArray(userOrders)) {
      return counts;
    }

    userOrders.forEach((order) => {
      if (!order || !Array.isArray(order.items)) {
        return;
      }

      order.items.forEach((item) => {
        if (!item || !item.restaurant) {
          return;
        }

        const restaurantName = item.restaurant;
        const qty =
          typeof item.quantity === 'number'
            ? item.quantity
            : Number(item.quantity) || 1;

        const prev = counts.get(restaurantName) || 0;
        counts.set(restaurantName, prev + qty);
      });
    });

    return counts;
  }, [userOrders]);

  // Cuisine filters
  const cuisineTypes = [
    'all',
    ...new Set(restaurants.map((r) => r.cuisine).filter(Boolean)),
  ];

  const filteredRestaurants = restaurants.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.cuisine || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCuisine =
      filterCuisine === 'all' || r.cuisine === filterCuisine;

    return matchesSearch && matchesCuisine;
  });

  // Add-to-cart with merging and inventory-aware max quantity
  const addToCart = (restaurant, meal) => {
    // identify this meal
    const mealId =
      meal.id ||
      `${restaurant.name}-${meal.name || ''}-${meal.pickupWindow || ''}`;

    // inventory cap
    const inventoryCap =
      typeof meal.availableQuantity === 'number' &&
      Number.isFinite(meal.availableQuantity)
        ? meal.availableQuantity
        : typeof meal.quantity === 'number' && Number.isFinite(meal.quantity)
        ? meal.quantity
        : Infinity;

    // per-order cap
    const perOrderCap =
      typeof meal.maxPerOrder === 'number' && Number.isFinite(meal.maxPerOrder)
        ? meal.maxPerOrder
        : Infinity;

    const maxQty =
      inventoryCap === Infinity && perOrderCap === Infinity
        ? Infinity
        : Math.min(inventoryCap, perOrderCap);

    if (maxQty !== Infinity && maxQty <= 0) {
      // no stock / no per-order allowance
      return;
    }

    // look at current cart snapshot，決定還能不能再加 1
    let currentQty = 0;
    if (Array.isArray(cart)) {
      const existing = cart.find((item) => {
        if (!item || item.restaurant !== restaurant.name || !item.meal) {
          return false;
        }
        const existingMealId =
          item.meal.id ||
          `${restaurant.name}-${item.meal.name || ''}-${
            item.meal.pickupWindow || ''
          }`;
        return existingMealId === mealId;
      });

      if (existing) {
        currentQty = Number(existing.quantity) || 0;
      }
    }

    if (maxQty !== Infinity && currentQty >= maxQty) {
      // 已經到上限：RestaurantDetail 會把按鈕鎖住，這裡就什麼都不做、不跳 toast
      return;
    }

    // 確定可以加 1 份，更新 cart，同時保險再 clamp 一次不要超出 maxQty
    setCart((prev) => {
      const prevCart = Array.isArray(prev) ? [...prev] : [];

      const existingIndex = prevCart.findIndex((item) => {
        if (!item || item.restaurant !== restaurant.name || !item.meal) {
          return false;
        }
        const existingMealId =
          item.meal.id ||
          `${restaurant.name}-${item.meal.name || ''}-${
            item.meal.pickupWindow || ''
          }`;
        return existingMealId === mealId;
      });

      if (existingIndex === -1) {
        prevCart.push({
          restaurant: restaurant.name,
          meal,
          quantity: 1,
        });
      } else {
        const existing = prevCart[existingIndex];
        const q = Number(existing.quantity) || 0;
        const next = q + 1;
        const clamped =
          maxQty === Infinity ? next : Math.min(next, maxQty);

        prevCart[existingIndex] = {
          ...existing,
          quantity: clamped,
        };
      }

      return prevCart;
    });

    // 只有真的成功加進 cart 才會走到這裡，所以可以直接跳 toast
    setShowCartToast(true);
    setTimeout(() => {
      setShowCartToast(false);
    }, 1000);
  };

  // Account-aware "Rescue Again":
  // For each restaurant in the past order, we create a new default rescue box
  // with quantity equal to the total rescued meals from that restaurant.
  const handleRescueAgain = (order) => {
    if (
      !order ||
      !order.items ||
      !Array.isArray(order.items) ||
      restaurants.length === 0
    ) {
      return;
    }

    const quantityByRestaurant = new Map();

    order.items.forEach((orderItem) => {
      if (!orderItem || !orderItem.restaurant) {
        return;
      }
      const restaurantName = orderItem.restaurant;
      const quantity =
        orderItem.quantity && orderItem.quantity > 0
          ? orderItem.quantity
          : 1;
      const prev = quantityByRestaurant.get(restaurantName) || 0;
      quantityByRestaurant.set(restaurantName, prev + quantity);
    });

    const rebuiltCart = [];

    quantityByRestaurant.forEach((qty, restaurantName) => {
      const restaurant = restaurants.find((r) => r.name === restaurantName);
      if (!restaurant) {
        return;
      }

      // default rescue box with per-order cap = previous quantity
      const meal = createDefaultMealForRestaurant(restaurant, qty);

      rebuiltCart.push({
        restaurant: restaurant.name,
        quantity: meal.quantity,
        meal,
      });
    });

    if (rebuiltCart.length === 0) {
      return;
    }

    setCart(rebuiltCart);
    setCurrentView('cart');
  };

  const toggleFavorite = (restaurantId) => {
    const newFavorites = new Set(favorites);

    if (newFavorites.has(restaurantId)) {
      newFavorites.delete(restaurantId);
    } else {
      newFavorites.add(restaurantId);
    }

    setFavorites(newFavorites);
  };

  const handleNavClick = (view) => {
    setCurrentView(view);
    setShowMobileMenu(false);
    if (view === 'browse') {
      setSelectedRestaurantDetail(null);
    }
  };

  const handleOpenRestaurantDetail = (restaurant) => {
    setSelectedRestaurantDetail(restaurant);
    setCurrentView('restaurantDetail');
  };

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    onLogout();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block bg-green-100 text-green-600 rounded-full px-3 py-1 mb-4">
            <span className="text-xs font-medium">Loading your dashboard...</span>
          </div>
          <p className="text-gray-600">
            Fetching restaurants and impact data, please wait.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <header className="bg-green-50 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 text-green-600 rounded-full p-2">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Tiffin Trails</h1>
              <p className="text-xs text-green-700">
                Save Food. Save Money. Save Planet.
              </p>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-6">
            <button
              type="button"
              onClick={() => handleNavClick('browse')}
              className={`text-sm font-medium ${
                currentView === 'browse' || currentView === 'restaurantDetail'
                  ? 'text-green-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Browse Meals
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('impact')}
              className={`text-sm font-medium ${
                currentView === 'impact'
                  ? 'text-green-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              My Impact
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('community')}
              className={`text-sm font-medium ${
                currentView === 'community'
                  ? 'text-green-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Community
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('leaderboard')}
              className={`text-sm font-medium ${
                currentView === 'leaderboard'
                  ? 'text-green-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Leaderboard
            </button>
            <button
              type="button"
              onClick={() => setCurrentView('cart')}
              className="relative flex items-center text-gray-600 hover:text-gray-900"
            >
              <ShoppingCart className="w-5 h-5" />
              {cart.length > 0 && (
                <span className="ml-1 bg-green-600 text-white text-xs rounded-full px-2 py-0.5">
                  {cart.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="text-sm font-medium text-red-500 hover:text-red-600"
            >
              Logout
            </button>
          </nav>

          <button
            type="button"
            className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {showMobileMenu && (
          <div className="md:hidden bg-white border-t border-gray-100">
            <div className="px-4 py-3 space-y-2">
              <button
                type="button"
                onClick={() => handleNavClick('browse')}
                className="w-full text-left text-sm py-2"
              >
                Browse Meals
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('impact')}
                className="w-full text-left text-sm py-2"
              >
                My Impact
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('community')}
                className="w-full text-left text-sm py-2"
              >
                Community
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('leaderboard')}
                className="w-full text-left text-sm py-2"
              >
                Leaderboard
              </button>
              <button
                type="button"
                onClick={() => setCurrentView('cart')}
                className="w-full text-left text-sm py-2 flex items-center"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Cart
                {cart.length > 0 && (
                  <span className="ml-2 bg-green-600 text-white text-xs rounded-full px-2 py-0.5">
                    {cart.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMobileMenu(false);
                  setShowLogoutConfirm(true);
                }}
                className="w-full text-left text-sm py-2 text-red-500"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </header>

      {/* main content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {(currentView === 'browse' || currentView === 'restaurantDetail') && (
          <>
            {currentView === 'browse' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* left column: search + restaurant cards */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white rounded-xl shadow p-4 flex items-center space-x-3">
                    <div className="bg-green-100 text-green-600 rounded-full p-2">
                      <Search className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search by restaurant or cuisine..."
                      className="flex-1 border-none focus:ring-0 text-sm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-wrap items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setFilterCuisine('all')}
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${
                        filterCuisine === 'all'
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-white text-gray-600 border-gray-200'
                      } mb-2`}
                    >
                      All Cuisines
                    </button>
                    {cuisineTypes
                      .filter((c) => c !== 'all')
                      .map((cuisine) => (
                        <button
                          type="button"
                          key={cuisine}
                          onClick={() => setFilterCuisine(cuisine)}
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${
                            filterCuisine === cuisine
                              ? 'bg-green-600 text-white border-green-600'
                              : 'bg-white text-gray-600 border-gray-200'
                          } mb-2`}
                        >
                          {cuisine}
                        </button>
                      ))}
                  </div>

                  <div className="space-y-4">
                    {filteredRestaurants.map((restaurant) => {
                      const restaurantId =
                        restaurant.id || restaurant._id || restaurant.name;
                      const hasMenus =
                        Array.isArray(restaurant.menus) &&
                        restaurant.menus.length > 0;
                      const rescueCount = hasMenus
                        ? restaurant.menus.length
                        : 0;

                      const inventorySummary =
                        summarizeRescueInventory(restaurant);
                      const { totalAvailable, allSoldOut } = inventorySummary;

                      const userRescueCount =
                        rescuedMealsByRestaurant.get(restaurant.name) || 0;

                      return (
                        <div
                          key={restaurantId}
                          className="bg-white rounded-xl shadow hover:shadow-md transition p-4 flex"
                        >
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h2 className="text-lg font-semibold text-gray-800">
                                  {restaurant.name}
                                </h2>
                                <p className="text-xs text-gray-500">
                                  {restaurant.cuisine || 'Cuisine not listed'} •{' '}
                                  {restaurant.distance
                                    ? `${restaurant.distance} mi away`
                                    : 'Distance not available'}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => toggleFavorite(restaurantId)}
                                className="text-gray-400 hover:text-red-500"
                              >
                                <Heart
                                  className={`w-5 h-5 ${
                                    favorites.has(restaurantId)
                                      ? 'fill-red-500 text-red-500'
                                      : ''
                                  }`}
                                />
                              </button>
                            </div>

                            <div className="mt-3 flex items-center text-xs text-gray-500 space-x-4">
                              <span className="flex items-center">
                                <Star className="w-4 h-4 text-yellow-400 mr-1" />
                                {restaurant.rating || 4.5}
                              </span>
                              <span className="flex items-center">
                                <MapPin className="w-4 h-4 mr-1" />
                                {restaurant.address || 'Address not available'}
                              </span>
                              <span className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                {restaurant.hours || 'Hours not listed'}
                              </span>
                            </div>

                            <div className="mt-3 text-xs text-gray-600">
                              {hasMenus ? (
                                <span>
                                  {rescueCount}{' '}
                                  {rescueCount === 1
                                    ? 'rescue meal listed'
                                    : 'rescue meals listed'}
                                  {allSoldOut && ' (sold out today)'}
                                </span>
                              ) : (
                                <span>
                                  Rescue meals not listed yet – you can still
                                  reserve a surprise box.
                                </span>
                              )}
                              {typeof totalAvailable === 'number' &&
                                totalAvailable > 0 &&
                                !allSoldOut && (
                                  <p className="mt-1 text-[11px] text-gray-500">
                                    {totalAvailable}{' '}
                                    {totalAvailable === 1
                                      ? 'box left today across all meals.'
                                      : 'boxes left today across all meals.'}
                                  </p>
                                )}
                              {allSoldOut && (
                                <p className="mt-1 text-[11px] text-red-500">
                                  Sold out for today
                                </p>
                              )}
                              {userRescueCount > 0 ? (
                                <p className="mt-1 text-[11px] text-gray-500">
                                  You have rescued {userRescueCount}{' '}
                                  {userRescueCount === 1 ? 'meal' : 'meals'} here.
                                </p>
                              ) : (
                                <p className="mt-1 text-[11px] text-gray-400">
                                  Be the first to rescue here.
                                </p>
                              )}
                            </div>

                            <div className="mt-4">
                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenRestaurantDetail(restaurant)
                                }
                                className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-green-600 text-white hover:bg-green-700"
                              >
                                View Rescue Meals
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* right column: quick stats */}
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold">
                        Today&apos;s Rescue Snapshot
                      </h3>
                      <Zap className="w-5 h-5" />
                    </div>
                    <p className="text-sm text-green-100 mb-2">
                      Raleigh residents are rescuing meals and cutting food
                      waste.
                    </p>
                    <div className="grid grid-cols-3 gap-3 mt-2">
                      <div>
                        <p className="text-xs uppercase text-green-100">
                          Active
                        </p>
                        <p className="text-lg font-bold">
                          {Number(
                            communityStats.activeUsers || 0
                          ).toLocaleString()}
                        </p>
                        <p className="text-[10px] text-green-100">
                          neighbors this week
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-green-100">
                          Meals
                        </p>
                        <p className="text-lg font-bold">
                          {Number(
                            communityStats.mealsRescued || 0
                          ).toLocaleString()}
                        </p>
                        <p className="text-[10px] text-green-100">
                          rescued from landfill
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-green-100">
                          Waste
                        </p>
                        <p className="text-lg font-bold">
                          {communityStats.wastePreventedTons || 0}
                        </p>
                        <p className="text-[10px] text-green-100">
                          tons prevented
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow p-5">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">
                      Your Progress
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Meals Rescued</span>
                        <span className="font-semibold text-gray-900">
                          {userImpact.mealsOrdered || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Money Saved</span>
                        <span className="font-semibold text-gray-900">
                          ${userImpact.moneySaved || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">
                          Food Waste Prevented
                        </span>
                        <span className="font-semibold text-gray-900">
                          {userImpact.foodWastePrevented || 0} lbs
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Carbon Reduced</span>
                        <span className="font-semibold text-gray-900">
                          {userImpact.carbonReduced || 0} kg
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentView === 'restaurantDetail' && selectedRestaurantDetail && (
              <RestaurantDetail
                restaurant={selectedRestaurantDetail}
                cart={cart}
                onBack={() => handleNavClick('browse')}
                onAddToCart={addToCart}
              />
            )}
          </>
        )}

        {currentView === 'impact' && (
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl p-8 mb-8">
              <h1 className="text-3xl font-bold mb-2">
                Your Environmental Impact
              </h1>
              <p className="text-lg">Track the difference you are making!</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <Package className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <p className="text-gray-600 mb-2">Meals Rescued</p>
                <p className="text-4xl font-bold text-green-600">
                  {userImpact.mealsOrdered || 0}
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <Leaf className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <p className="text-gray-600 mb-2">Waste Prevented</p>
                <p className="text-4xl font-bold text-blue-600">
                  {userImpact.foodWastePrevented || 0} lbs
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <TrendingUp className="w-12 h-12 text-purple-600 mx-auto mb-3" />
                <p className="text-gray-600 mb-2">Carbon Reduced</p>
                <p className="text-4xl font-bold text-purple-600">
                  {userImpact.carbonReduced || 0} kg
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <Award className="w-12 h-12 text-orange-500 mx-auto mb-3" />
                <p className="text-gray-600 mb-2">Money Saved</p>
                <p className="text-4xl font-bold text-orange-600">
                  ${userImpact.moneySaved || 0}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8 mt-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Your Recent Orders
              </h2>

              {!user || !user.email ? (
                <p className="text-gray-600">
                  Log in to see your order history.
                </p>
              ) : userOrders.length === 0 ? (
                <p className="text-gray-600">
                  You have not placed any orders yet. Rescue a meal to see it
                  appear here.
                </p>
              ) : (
                <div className="space-y-4">
                  {userOrders.slice(0, 5).map((order) => (
                    <div
                      key={order.id}
                      className="flex flex-col md:flex-row md:items-center md:justify-between border border-gray-100 rounded-lg p-4"
                    >
                      <div className="mb-2 md:mb-0">
                        <p className="font-semibold text-gray-800">
                          {order.items &&
                          order.items[0] &&
                          order.items[0].restaurant
                            ? order.items[0].restaurant
                            : 'Tiffin Trails order'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {order.timestamp
                            ? new Date(order.timestamp).toLocaleString()
                            : 'Time not available'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {order.totals && order.totals.total
                            ? `Total: $${order.totals.total}`
                            : null}
                        </p>
                        {order.totals && order.totals.rescueMealCount ? (
                          <p className="text-sm text-green-600">
                            {order.totals.rescueMealCount} rescue meal
                            {order.totals.rescueMealCount > 1 ? 's' : ''}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex items-center space-x-3">
                        {ordersError && (
                          <span className="text-xs text-red-500">
                            {ordersError}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRescueAgain(order)}
                          className="inline-flex items-center px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition"
                        >
                          <span className="mr-2">Rescue Again</span>
                          <ShoppingCart className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === 'leaderboard' && (
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Top Restaurants
            </h3>
            <LeaderboardPanel />
          </div>
        )}

        {currentView === 'community' && (
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl p-8 mb-8">
              <h1 className="text-3xl font-bold mb-2">Community Impact</h1>
              <p className="text-lg">
                Together we are making a difference!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <Users className="w-12 h-12 text-purple-600 mx-auto mb-3" />
                <p className="text-gray-600 mb-2">Active Users</p>
                <p className="text-5xl font-bold text-purple-600">
                  {Number(communityStats.activeUsers || 0).toLocaleString()}
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <Package className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <p className="text-gray-600 mb-2">Meals Rescued</p>
                <p className="text-5xl font-bold text-green-600">
                  {Number(communityStats.mealsRescued || 0).toLocaleString()}
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <Leaf className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <p className="text-gray-600 mb-2">Waste Prevented</p>
                <p className="text-5xl font-bold text-blue-600">
                  {communityStats.wastePreventedTons || 0} tons
                </p>
              </div>
            </div>
          </div>
        )}

        {currentView === 'cart' && (
          <Cart
            cart={cart}
            setCart={setCart}
            onBack={() => setCurrentView('browse')}
            onOrderPlaced={(order) => {
              // new order definitely exists -> clear any stale order error
              setOrdersError(null);

              // eslint-disable-next-line no-console
              console.log('Order placed:', order);

              // refresh user impact
              if (user && user.email) {
                const emailParam = encodeURIComponent(user.email);
                fetch(`/dashboard/user-impact?email=${emailParam}`)
                  .then((res) => res.json())
                  .then((data) => {
                    setUserImpact((prev) => ({
                      ...prev,
                      ...data,
                    }));
                  })
                  .catch((err) => {
                    // eslint-disable-next-line no-console
                    console.error(
                      'Error refreshing user impact after order:',
                      err
                    );
                  });

                // update userOrders list with this new order
                if (order && order.userEmail === user.email) {
                  setUserOrders((prev) => {
                    const prevList = Array.isArray(prev) ? [...prev] : [];
                    const updated = [order, ...prevList];
                    updated.sort((a, b) => {
                      const at = new Date(a.timestamp || 0).getTime();
                      const bt = new Date(b.timestamp || 0).getTime();
                      return bt - at;
                    });
                    return updated;
                  });
                }
              }

              // refresh community stats
              fetch('/dashboard/community-stats')
                .then((res) => res.json())
                .then((data) => {
                  setCommunityStats(data);
                })
                .catch((err) => {
                  // eslint-disable-next-line no-console
                  console.error(
                    'Error refreshing community stats after order:',
                    err
                  );
                });

              setCurrentView('impact');
            }}
            user={user}
          />
        )}

        {showCartToast && (
          <div className="fixed bottom-6 right-6 z-50">
            <div className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
              <ShoppingCart className="w-4 h-4" />
              <span className="text-sm font-medium">Added to cart</span>
            </div>
          </div>
        )}
      </main>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Confirm Logout
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to log out? Any items in your cart will not
              be saved.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="px-4 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
