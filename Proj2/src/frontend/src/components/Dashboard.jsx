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
    return { totalAvailable: null, allSoldOut: false, lowInventory: false };
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

  const lowInventory =
    typeof totalAvailable === 'number' &&
    Number.isFinite(totalAvailable) &&
    totalAvailable > 0 &&
    totalAvailable <= 5;

  return {
    totalAvailable,
    allSoldOut: totalAvailable === 0,
    lowInventory,
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
        setShowCartToast(false);
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('Error fetching restaurants:', err);
        setRestaurants(staticRestaurants);
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
      setUserImpact((prev) => ({
        ...prev,
        mealsOrdered: 0,
        moneySaved: 0,
        foodWastePrevented: 0,
        carbonReduced: 0,
        localRestaurantsSupported: 0,
        impactLevel: 'New Rescuer',
      }));
      setUserOrders([]);
      setOrdersError(null);
      return;
    }

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
        console.error('Error fetching user impact:', err);
      });

    fetch(`/dashboard/orders?email=${emailParam}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to load orders');
        }
        return res.json();
      })
      .then((data) => {
        const filtered = Array.isArray(data)
          ? data.filter((o) => o && o.userEmail === user.email)
          : [];
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

        const qty = Number(item.quantity) || 0;
        if (!Number.isFinite(qty) || qty <= 0) {
          return;
        }

        const prev = counts.get(item.restaurant) || 0;
        counts.set(item.restaurant, prev + qty);
      });
    });

    return counts;
  }, [userOrders]);

  const cuisineTypes = useMemo(() => {
    const set = new Set(['all']);
    restaurants.forEach((r) => {
      if (r.cuisine) {
        set.add(r.cuisine);
      }
    });
    return Array.from(set);
  }, [restaurants]);

  const filteredRestaurants = useMemo(() => {
    let list = Array.isArray(restaurants) ? restaurants : [];

    const query = (searchQuery || '').trim().toLowerCase();
    if (query) {
      list = list.filter((r) => {
        const name = (r.name || '').toLowerCase();
        const cuisine = (r.cuisine || '').toLowerCase();
        return name.includes(query) || cuisine.includes(query);
      });
    }

    if (filterCuisine !== 'all') {
      list = list.filter((r) => r.cuisine === filterCuisine);
    }

    return list;
  }, [restaurants, searchQuery, filterCuisine]);

  const [selectedRestaurantDetail, setSelectedRestaurantDetail] =
    useState(null);

  const handleOpenRestaurantDetail = (restaurant) => {
    setSelectedRestaurantDetail(restaurant);
    setCurrentView('detail');
  };

  const handleAddToCart = (restaurant, meal) => {
    if (!restaurant || !meal) return;

    setCart((prevCart) => {
      const existing = Array.isArray(prevCart) ? [...prevCart] : [];
      const mealId =
        meal.id ||
        `${restaurant.name}-${meal.name || ''}-${meal.pickupWindow || ''}`;

      const existingIndex = existing.findIndex((item) => {
        if (!item || item.restaurant !== restaurant.name || !item.meal) {
          return false;
        }
        const existingMealId =
          item.meal.id ||
          `${item.restaurant}-${item.meal.name || ''}-${
            item.meal.pickupWindow || ''
          }`;
        return existingMealId === mealId;
      });

      const getMaxQty = () => {
        const inventoryCap =
          typeof meal.availableQuantity === 'number' &&
          Number.isFinite(meal.availableQuantity)
            ? meal.availableQuantity
            : typeof meal.quantity === 'number' &&
              Number.isFinite(meal.quantity)
            ? meal.quantity
            : Infinity;

        const perOrderCap =
          typeof meal.maxPerOrder === 'number' &&
          Number.isFinite(meal.maxPerOrder)
            ? meal.maxPerOrder
            : Infinity;

        if (inventoryCap === Infinity && perOrderCap === Infinity) {
          return Infinity;
        }
        return Math.min(inventoryCap, perOrderCap);
      };

      const maxQty = getMaxQty();

      if (existingIndex === -1) {
        existing.push({
          restaurant: restaurant.name,
          meal,
          quantity: maxQty === Infinity ? 1 : Math.min(1, maxQty),
        });
      } else {
        const entry = existing[existingIndex];
        const currentQty = Number(entry.quantity) || 1;
        const nextQty = maxQty === Infinity ? currentQty + 1 : currentQty + 1;

        if (maxQty !== Infinity && nextQty > maxQty) {
          entry.quantity = maxQty;
        } else {
          entry.quantity = nextQty;
        }
      }

      return existing;
    });

    setShowCartToast(true);
    setTimeout(() => setShowCartToast(false), 2000);
  };

  const handleRescueAgain = () => {
    if (!Array.isArray(userOrders) || userOrders.length === 0) {
      return;
    }

    const lastOrder = userOrders[0];
    if (!lastOrder || !Array.isArray(lastOrder.items)) {
      return;
    }

    const rebuiltCart = [];

    lastOrder.items.forEach((item) => {
      if (!item || !item.meal || !item.restaurant) {
        return;
      }

      const qty = Number(item.quantity) || 0;
      if (!Number.isFinite(qty) || qty <= 0) {
        return;
      }

      rebuiltCart.push({
        restaurant: item.restaurant,
        meal: item.meal,
        quantity: qty,
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

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    if (typeof onLogout === 'function') {
      onLogout();
    }
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const renderImpactLevelBadge = () => {
    const level = userImpact.impactLevel || 'New Rescuer';

    let bg = 'bg-gray-100';
    let text = 'text-gray-800';

    if (level === 'Impact Hero') {
      bg = 'bg-yellow-100';
      text = 'text-yellow-800';
    } else if (level === 'Rescue Champion') {
      bg = 'bg-purple-100';
      text = 'text-purple-800';
    } else if (level === 'Rising Rescuer') {
      bg = 'bg-green-100';
      text = 'text-green-800';
    }

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}
      >
        <Zap className="w-3 h-3 mr-1" />
        {level}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* top nav */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Truck className="w-6 h-6 text-green-600" />
            <span className="text-lg font-bold text-gray-900">
              Tiffin Trails
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-6">
            <button
              type="button"
              onClick={() => handleNavClick('browse')}
              className={`text-sm font-medium ${
                currentView === 'browse'
                  ? 'text-green-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Browse
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
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-xs text-gray-500">Signed in as</p>
                <p className="text-sm font-semibold text-gray-900">
                  {user?.name || user?.email || 'Guest Rescuer'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleLogoutClick}
                className="text-xs font-medium text-red-500 hover:text-red-600"
              >
                Log out
              </button>
            </div>
          </nav>

          {/* mobile nav toggle */}
          <button
            type="button"
            className="md:hidden flex items-center text-gray-600 hover:text-gray-900"
            onClick={() => setShowMobileMenu((prev) => !prev)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* mobile dropdown nav */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <nav className="px-4 py-3 space-y-2">
              <button
                type="button"
                onClick={() => handleNavClick('browse')}
                className={`block w-full text-left text-sm py-1 ${
                  currentView === 'browse'
                    ? 'text-green-600'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Browse
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('impact')}
                className={`block w-full text-left text-sm py-1 ${
                  currentView === 'impact'
                    ? 'text-green-600'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                My Impact
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('community')}
                className={`block w-full text-left text-sm py-1 ${
                  currentView === 'community'
                    ? 'text-green-600'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Community
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('leaderboard')}
                className={`block w-full text-left text-sm py-1 ${
                  currentView === 'leaderboard'
                    ? 'text-green-600'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Leaderboard
              </button>
              <button
                type="button"
                onClick={() => setCurrentView('cart')}
                className="flex items-center text-sm text-gray-700 hover:text-gray-900"
              >
                <ShoppingCart className="w-4 h-4 mr-1" />
                Cart
                {cart.length > 0 && (
                  <span className="ml-1 bg-green-600 text-white text-xs rounded-full px-2 py-0.5">
                    {cart.length}
                  </span>
                )}
              </button>
              <div className="pt-2 border-t border-gray-100 mt-2 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Signed in as</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {user?.name || user?.email || 'Guest Rescuer'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleLogoutClick}
                  className="text-xs font-medium text-red-500 hover:text-red-600"
                >
                  Log out
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* main content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Browse view */}
        {currentView === 'browse' && !selectedRestaurantDetail && (
          <div className="space-y-6">
            {/* hero + quick stats */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <h2 className="text-xl font-bold mb-2">
                    Rescue surplus meals from local kitchens
                  </h2>
                  <p className="text-sm text-green-100">
                    Pick up chef-made meals at a fraction of the price while
                    reducing food waste in your neighborhood.
                  </p>
                </div>
                {/* stats row：放大數字＋半透明卡片 */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white/10 rounded-lg px-3 py-2 flex items-center">
                    <Leaf className="w-5 h-5 text-green-100 mr-2" />
                    <div>
                      <p className="text-3xl font-bold leading-tight">
                        {communityStats.mealsRescued || 0}+
                      </p>
                      <p className="text-[11px] text-green-50 uppercase tracking-wide">
                        meals rescued this week
                      </p>
                    </div>
                  </div>
                  <div className="bg-white/10 rounded-lg px-3 py-2 flex items-center">
                    <Users className="w-5 h-5 text-green-100 mr-2" />
                    <div>
                      <p className="text-3xl font-bold leading-tight">
                        {communityStats.activeUsers || 0}
                      </p>
                      <p className="text-[11px] text-green-50 uppercase tracking-wide">
                        neighbors already rescuing
                      </p>
                    </div>
                  </div>
                  <div className="bg-white/10 rounded-lg px-3 py-2 flex items-center">
                    <TrendingUp className="w-5 h-5 text-green-100 mr-2" />
                    <div>
                      <p className="text-3xl font-bold leading-tight">
                        {communityStats.wastePreventedTons || 0}
                      </p>
                      <p className="text-[11px] text-green-50 uppercase tracking-wide">
                        tons of food waste prevented
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-green-50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-800">
                    Your Impact Snapshot
                  </h3>
                  {renderImpactLevelBadge()}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Meals rescued</span>
                    <span className="font-semibold text-gray-900">
                      {userImpact.mealsOrdered || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Money saved</span>
                    <span className="font-semibold text-gray-900">
                      ${userImpact.moneySaved || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Food waste prevented</span>
                    <span className="font-semibold text-gray-900">
                      {userImpact.foodWastePrevented || 0} lbs
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Carbon reduced</span>
                    <span className="font-semibold text-gray-900">
                      {userImpact.carbonReduced || 0} kg
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRescueAgain}
                  className="mt-3 w-full inline-flex items-center justify-center px-3 py-2 rounded-lg bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100"
                >
                  Rescue Again from Last Order
                </button>
              </div>
            </section>

            {/* search + filters */}
            <section className="bg-gray-50 rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
                <div className="flex items-center w-full md:w-1/2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                  <Search className="w-4 h-4 text-gray-400 mr-2" />
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
              </div>
            </section>

            {/* restaurant cards */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800">
                  Restaurants with rescue meals
                </h3>
                <p className="text-xs text-gray-500">
                  Showing {filteredRestaurants.length} partners
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredRestaurants.map((restaurant) => {
                  const restaurantId = restaurant.id || restaurant.name;

                  const inventorySummary =
                    summarizeRescueInventory(restaurant);
                  const {
                    totalAvailable,
                    allSoldOut,
                    lowInventory,
                  } = inventorySummary;

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
                            <div className="flex items-center space-x-2">
                              <h4 className="text-sm font-semibold text-gray-900">
                                {restaurant.name}
                              </h4>
                              {favorites.has(restaurantId) && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-pink-50 text-pink-600 text-[11px] font-medium">
                                  <Heart className="w-3 h-3 mr-1" />
                                  Favorite
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {restaurant.cuisine || 'Rescue-friendly cuisine'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleFavorite(restaurantId)}
                            className="text-gray-400 hover:text-pink-500"
                            aria-label="Toggle favorite"
                          >
                            <Heart
                              className={`w-4 h-4 ${
                                favorites.has(restaurantId)
                                  ? 'fill-pink-500 text-pink-500'
                                  : ''
                              }`}
                            />
                          </button>
                        </div>

                        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center space-x-3">
                            <span className="flex items-center">
                              <Star className="w-4 h-4 text-yellow-400 mr-1" />
                              {restaurant.rating || 4.5}{' '}
                              <span className="text-gray-400">
                                ({restaurant.numReviews || 120})
                              </span>
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
                        </div>

                        <div className="mt-3 text-xs text-gray-600">
                          {Array.isArray(restaurant.menus) &&
                          restaurant.menus.length > 0 ? (
                            (() => {
                              const rescueCount = restaurant.menus.length;
                              const hasMenus = rescueCount > 0;
                              if (!hasMenus) {
                                return (
                                  <span>
                                    No rescue meals listed yet. Check back
                                    later today.
                                  </span>
                                );
                              }
                              return (
                                <span>
                                  {rescueCount}{' '}
                                  {rescueCount === 1
                                    ? 'rescue meal listed'
                                    : 'rescue meals listed'}
                                  {allSoldOut && ' (sold out today)'}
                                  {!allSoldOut &&
                                    lowInventory &&
                                    ' • Almost gone today'}
                                </span>
                              );
                            })()
                          ) : (
                            <span>
                              No rescue meals listed yet. Check back later
                              today.
                            </span>
                          )}
                        </div>

                        <div className="mt-2 text-[11px] text-gray-500">
                          {typeof totalAvailable === 'number' &&
                          Number.isFinite(totalAvailable) ? (
                            <span>
                              Approx.{' '}
                              <span className="font-semibold">
                                {totalAvailable}
                              </span>{' '}
                              boxes still available today.
                            </span>
                          ) : (
                            <span>
                              This partner lists rescue boxes each afternoon.
                            </span>
                          )}
                        </div>

                        {userRescueCount > 0 && (
                          <p className="mt-1 text-[11px] text-green-700">
                            You&apos;ve rescued{' '}
                            <span className="font-semibold">
                              {userRescueCount}
                            </span>{' '}
                            meals from this restaurant.
                          </p>
                        )}

                        {userRescueCount === 0 && (
                          <p className="mt-1 text-[11px] text-gray-400">
                            Be the first to rescue here.
                          </p>
                        )}
                      </div>

                      <div className="ml-4 flex flex-col justify-between items-end">
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
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* Restaurant detail view */}
        {currentView === 'detail' && selectedRestaurantDetail && (
          <RestaurantDetail
            restaurant={selectedRestaurantDetail}
            cart={cart}
            onBack={() => {
              setCurrentView('browse');
              setSelectedRestaurantDetail(null);
            }}
            onAddToCart={handleAddToCart}
          />
        )}

        {/* My Impact view */}
        {currentView === 'impact' && (
          <section className="space-y-6">
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Your Impact
                  </h2>
                  <p className="text-xs text-gray-500">
                    See how your rescues add up over time.
                  </p>
                </div>
                {renderImpactLevelBadge()}
              </div>

              {ordersError && (
                <p className="mb-4 text-xs text-red-500">
                  {ordersError}
                </p>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  How your rescues help
                </h2>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li>
                    <span className="font-semibold text-gray-800">
                      Every rescued box
                    </span>{' '}
                    helps a local restaurant recoup costs on surplus food.
                  </li>
                  <li>
                    <span className="font-semibold text-gray-800">
                      Prevent food waste
                    </span>{' '}
                    by giving meals a second chance instead of heading to
                    landfill.
                  </li>
                  <li>
                    <span className="font-semibold text-gray-800">
                      Reduce emissions
                    </span>{' '}
                    from food production and disposal by rescuing what&apos;s
                    already been cooked.
                  </li>
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* Community view */}
        {currentView === 'community' && (
          <section className="space-y-6">
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Community
              </h2>
              <p className="text-sm text-gray-600">
                Community features are coming soon in this prototype.
              </p>
            </div>
          </section>
        )}

        {/* Leaderboard view */}
        {currentView === 'leaderboard' && (
          <LeaderboardPanel communityStats={communityStats} />
        )}

        {/* Cart view */}
        {currentView === 'cart' && (
          <Cart
            cart={cart}
            setCart={setCart}
            onBack={() => setCurrentView('browse')}
            onOrderPlaced={(order) => {
              setOrdersError(null);

              // eslint-disable-next-line no-console
              console.log('Order placed:', order);

              // If backend did not return an order object, do nothing special.
              // Cart will still show the local thank-you screen.
              if (!order) {
                return;
              }

              // refresh user impact if we know user email
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
              }

              // update userOrders list with this new order (if email matches)
              if (user && user.email && order.userEmail === user.email) {
                setUserOrders((prev) => {
                  const prevList = Array.isArray(prev) ? [...prev] : [];
                  const updated = [order, ...prevList];
                  updated.sort((a, b) => {
                    const at = new Date(a?.timestamp || 0).getTime();
                    const bt = new Date(b?.timestamp || 0).getTime();
                    return bt - at;
                  });
                  return updated;
                });
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

              // Update in-memory restaurant inventory so Browse / detail views
              // reflect the latest remaining rescue boxes after this order.
              if (Array.isArray(order.items) && order.items.length > 0) {
                setRestaurants((prevRestaurants) => {
                  if (!Array.isArray(prevRestaurants) || prevRestaurants.length === 0) {
                    return prevRestaurants;
                  }

                  const nextRestaurants = prevRestaurants.map((rest) => {
                    if (!rest || rest.name == null) {
                      return rest;
                    }

                    if (!Array.isArray(rest.menus) || rest.menus.length === 0) {
                      return rest;
                    }

                    const updatedMenus = rest.menus.map((meal) => ({ ...meal }));
                    let changed = false;

                    order.items.forEach((item) => {
                      if (
                        !item ||
                        !item.meal ||
                        typeof item.quantity === 'undefined' ||
                        item.restaurant !== rest.name
                      ) {
                        return;
                      }

                      const qty = Number(item.quantity) || 0;
                      if (qty <= 0) {
                        return;
                      }

                      const orderedMealId =
                        item.meal.id ||
                        `${rest.name}-${item.meal.name || ''}-${
                          item.meal.pickupWindow || ''
                        }`;

                      updatedMenus.forEach((m) => {
                        const candidateId =
                          m.id ||
                          `${rest.name}-${m.name || ''}-${m.pickupWindow || ''}`;

                        if (candidateId !== orderedMealId) {
                          return;
                        }

                        const currentAvail =
                          typeof m.availableQuantity === 'number' &&
                          Number.isFinite(m.availableQuantity)
                            ? m.availableQuantity
                            : typeof m.quantity === 'number' &&
                              Number.isFinite(m.quantity)
                            ? m.quantity
                            : null;

                        if (currentAvail === null) {
                          return;
                        }

                        const nextAvail = Math.max(0, currentAvail - qty);

                        if (
                          typeof m.availableQuantity === 'number' &&
                          Number.isFinite(m.availableQuantity)
                        ) {
                          m.availableQuantity = nextAvail;
                        } else if (
                          typeof m.quantity === 'number' &&
                          Number.isFinite(m.quantity)
                        ) {
                          m.quantity = nextAvail;
                        }

                        changed = true;
                      });
                    });

                    if (!changed) {
                      return rest;
                    }

                    return {
                      ...rest,
                      menus: updatedMenus,
                    };
                  });

                  return nextRestaurants;
                });
              }

              // NOTE: do NOT change currentView here.
              // Cart will stay mounted and show the thank-you screen.
            }}
            user={user}
          />
        )}

        {showCartToast && (
          <div className="fixed bottom-6 right-6 z-50">
            <div className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
              <ShoppingCart className="w-4 h-4" />
              <span className="text-sm">Added to cart</span>
            </div>
          </div>
        )}
      </main>

      {/* logout confirmation modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">
                Confirm logout
              </h2>
              <button
                type="button"
                onClick={cancelLogout}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to log out of Tiffin Trails?
            </p>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={cancelLogout}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="px-3 py-1.5 text-xs rounded-lg bg-red-500 text-white hover:bg-red-600"
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
