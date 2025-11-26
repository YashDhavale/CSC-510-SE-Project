// Proj2/src/frontend/src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
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

// Fallback static data when backend returns empty
import { restaurants as staticRestaurants } from '../data/staticdata';

const Dashboard = ({ user, onLogout }) => {
  const [currentView, setCurrentView] = useState('browse');
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCuisine, setFilterCuisine] = useState('all');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [favorites, setFavorites] = useState(new Set());
  const [showCartToast, setShowCartToast] = useState(false);

  // which restaurant is opened in detail view
  const [selectedRestaurantDetail, setSelectedRestaurantDetail] =
    useState(null);

  // logout confirmation modal
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // State for API data
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

  // helper: default rescue meal when no menus are available
  const createDefaultMealForRestaurant = (restaurant) => {
    return {
      id: `${restaurant.id || restaurant._id || restaurant.name}-default-rescue`,
      name: 'Rescue Meal Box',
      description: 'Chef-selected surplus meal from today.',
      originalPrice: 12.0,
      rescuePrice: 5.0,
      pickupWindow: 'Today, 5–8 PM',
    };
  };

  // Fetch restaurants + community stats (with static fallback)
  useEffect(() => {
    fetch('/dashboard/restaurants-with-meals')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setRestaurants(data);
        } else {
          console.warn(
            'restaurants-with-meals returned empty, falling back to static data'
          );
          setRestaurants(staticRestaurants);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching restaurants:', err);
        setRestaurants(staticRestaurants);
        setLoading(false);
      });

    fetch('/dashboard/community-stats')
      .then((res) => res.json())
      .then((data) => setCommunityStats(data))
      .catch((err) => console.error('Error fetching community stats:', err));
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
        console.error('Error fetching user impact:', err);
      });

    // Order history – we filter by userEmail on the frontend
    fetch('/api/orders')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success && Array.isArray(data.orders)) {
          const filtered = data.orders
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
        } else {
          setUserOrders([]);
          setOrdersError('Unable to load orders.');
        }
      })
      .catch((err) => {
        console.error('Error fetching orders:', err);
        setOrdersError('Unable to load your orders right now.');
      });
  }, [user]);

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

  const addToCart = (restaurant, meal) => {
    setCart((prev) => [...prev, { restaurant: restaurant.name, meal, quantity: 1 }]);

    // short toast
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

    // Group quantities by restaurant name
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

      const meal = createDefaultMealForRestaurant(restaurant);
      rebuiltCart.push({
        restaurant: restaurant.name,
        meal,
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
              onClick={() => setShowLogoutConfirm(true)}
              className="text-sm font-medium text-red-500 hover:text-red-600"
            >
              Logout
            </button>
          </nav>

          <button
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
                onClick={() => handleNavClick('browse')}
                className="w-full text-left text-sm py-2"
              >
                Browse Meals
              </button>
              <button
                onClick={() => handleNavClick('impact')}
                className="w-full text-left text-sm py-2"
              >
                My Impact
              </button>
              <button
                onClick={() => handleNavClick('community')}
                className="w-full text-left text-sm py-2"
              >
                Community
              </button>
              <button
                onClick={() => handleNavClick('leaderboard')}
                className="w-full text-left text-sm py-2"
              >
                Leaderboard
              </button>
              <button
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

                            {/* rescue meals count / message */}
                            <div className="mt-3 text-xs text-gray-600">
                              {hasMenus ? (
                                <span>
                                  {rescueCount}{' '}
                                  {rescueCount === 1
                                    ? 'rescue meal available'
                                    : 'rescue meals available'}
                                </span>
                              ) : (
                                <span>
                                  Rescue meals not listed yet – you can still
                                  reserve a surprise box.
                                </span>
                              )}
                            </div>

                            {/* action button: always go to restaurant detail */}
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

            {/* account-aware recent orders + "Rescue Again" */}
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
            onOrderPlaced={(result) => {
              // hook for future analytics if needed
              console.log('Order placed:', result);
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

      {/* Logout confirmation modal */}
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
