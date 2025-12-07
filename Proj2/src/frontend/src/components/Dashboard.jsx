import React, { useState, useEffect, useMemo } from 'react';
import Cart from './Cart';
import LeaderboardPanel from './LeaderboardPanel';
import RestaurantDetail from './RestaurantDetail';
import Podium from './Podium';
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
  Store,
  CircleDollarSign,
  Cloud
} from 'lucide-react';

import { restaurants as staticRestaurants } from '../data/staticdata';

/**
 * Render a small impact level badge using the user's current impact level.
 * This is a pure function so it can be reused in multiple places.
 */
function renderImpactLevelBadge(userImpact) {
  if (!userImpact) {
    return null;
  }

  const level = userImpact.impactLevel || 'New Rescuer';
  const meals = Number(userImpact.mealsOrdered || 0);

  let badgeClasses = 'border-gray-200 text-gray-700 bg-gray-50';
  if (meals >= 20) {
    badgeClasses = 'border-yellow-300 text-yellow-800 bg-yellow-50';
  } else if (meals >= 5) {
    badgeClasses = 'border-green-300 text-green-800 bg-green-50';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${badgeClasses}`}
    >
      <Award className="w-3 h-3 mr-1" />
      <span>{level}</span>
    </span>
  );
}

// Small helper to summarize rescue inventory for a restaurant
const summarizeRescueInventory = (restaurant) => {
  if (!restaurant || !Array.isArray(restaurant.menus)) {
    return { totalAvailable: null, allSoldOut: false, lowInventory: false };
  }

  const totalAvailable = restaurant.menus.reduce((sum, meal) => {
    const qty =
      typeof meal.availableQuantity === 'number'
        ? meal.availableQuantity
        : meal.quantityAvailable || 0;
    return sum + (qty > 0 ? qty : 0);
  }, 0);

  const allSoldOut = totalAvailable === 0;
  const lowInventory = !allSoldOut && totalAvailable <= 5;

  return { totalAvailable, allSoldOut, lowInventory };
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
  const [lastAddedInfo, setLastAddedInfo] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);


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
    totalMealsRescued: 0,
    foodWastePrevented: 0,
    totalMoneySaved: 0,
    carbonReduced: 0,
    participatingRestaurants: 0,
    topUsers: {
      mealsRescued: ['', '', ''],
      wastePrevented: ['', '', ''],
      carbonReduced: ['', '', ''],
      moneySaved: ['', '', ''],
    }
  });
  const [userOrders, setUserOrders] = useState([]);
  const [ordersError, setOrdersError] = useState(null);

  // Lightweight derived community weekly goal based on current stats
  const communityGoal = useMemo(() => {
    const meals = Number(communityStats.totalMealsRescued || 0);
    const safeMeals = Number.isFinite(meals) && meals > 0 ? meals : 0;

    const target =
      safeMeals > 0 ? Math.max(10, Math.ceil(safeMeals * 1.5)) : 10;

    const progress = Math.min(safeMeals, target);

    console.log(communityStats);

    return { target, progress };
  }, [communityStats]);

  // Fetch restaurants + community stats (with static fallback)
  useEffect(() => {
    fetch('/dashboard/restaurants-with-meals')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setRestaurants(data);
        } else {
          setRestaurants(staticRestaurants);
        }
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('Error fetching restaurants:', err);
        setRestaurants(staticRestaurants);
      });

    fetch('/dashboard/community-stats')
      .then((res) => res.json())
      .then((data) => {
        setCommunityStats((prev) => ({
          ...prev,
          ...data,
        }));
        console.log(data);
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('Error fetching community stats:', err);
      });
  }, []);

  // Fetch user impact + order history if we have a user
  useEffect(() => {
    if (!user || !user.email) return;

    const emailParam = encodeURIComponent(user.email);
    const storageKey = `tiffin_trails_orders_${user.email}`;

    // 1) Load cached orders from localStorage first (per user), keep up to 5
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = window.localStorage.getItem(storageKey);
        if (raw) {
          const cached = JSON.parse(raw);
          if (Array.isArray(cached) && cached.length > 0) {
            const sortedCached = [...cached].sort(
              (a, b) =>
                new Date(b.createdAt || b.date) -
                new Date(a.createdAt || a.date)
            );
            const limitedCached = sortedCached.slice(0, 5);
            setUserOrders(limitedCached);
          }
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error reading cached orders from localStorage:', err);
      }
    }

    // 2) Always refresh impact numbers from backend
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

    // 3) Try to fetch orders from backend; only override cache if server returns non-empty
    fetch(`/dashboard/orders?email=${emailParam}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch orders: ${res.status}`);
        }
        return res.json();
      })
      .then((orders) => {
        const sorted = Array.isArray(orders)
          ? [...orders].sort(
            (a, b) =>
              new Date(b.createdAt || b.date) -
              new Date(a.createdAt || a.date)
          )
          : [];

        if (sorted.length > 0) {
          const limited = sorted.slice(0, 5);
          setUserOrders(limited);

          if (typeof window !== 'undefined' && window.localStorage) {
            try {
              window.localStorage.setItem(storageKey, JSON.stringify(limited));
            } catch (err) {
              // eslint-disable-next-line no-console
              console.error('Error writing orders to localStorage:', err);
            }
          }
        }

        setOrdersError(null);
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('Error fetching user orders:', err);
        setOrdersError('We could not load your order history right now.');
      });
  }, [user]);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    onLogout();
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const handleNavClick = (view) => {
    setCurrentView(view);
    setShowMobileMenu(false);
  };

  // Add to cart in the data shape expected by Cart.jsx: { restaurant, meal, quantity }
  const handleAddToCart = (restaurant, meal) => {
    if (!restaurant || !meal || meal.isSoldOut) return;

    // Normalize inventory info onto meal so Cart's getMaxQuantityForItem works
    let mealForCart = { ...meal };
    if (
      typeof mealForCart.availableQuantity !== 'number' &&
      typeof meal.quantityAvailable === 'number'
    ) {
      mealForCart.availableQuantity = meal.quantityAvailable;
    }
    if (
      typeof mealForCart.quantity !== 'number' &&
      typeof mealForCart.availableQuantity === 'number'
    ) {
      mealForCart.quantity = mealForCart.availableQuantity;
    }

    const available =
      typeof mealForCart.availableQuantity === 'number'
        ? mealForCart.availableQuantity
        : typeof mealForCart.quantity === 'number'
          ? mealForCart.quantity
          : Infinity;

    const perOrderCap =
      typeof mealForCart.maxPerOrder === 'number' &&
        Number.isFinite(mealForCart.maxPerOrder)
        ? mealForCart.maxPerOrder
        : Infinity;

    const maxQty =
      available === Infinity && perOrderCap === Infinity
        ? Infinity
        : Math.min(available, perOrderCap);

    setCart((prev) => {
      const current = Array.isArray(prev) ? [...prev] : [];

      const idx = current.findIndex(
        (item) =>
          item.restaurant === restaurant.name &&
          item.meal &&
          (item.meal.id === mealForCart.id ||
            item.meal.name === mealForCart.name)
      );

      // new line item
      if (idx === -1) {
        if (maxQty === 0) {
          return current;
        }
        const newItem = {
          restaurant: restaurant.name,
          meal: mealForCart,
          quantity: 1,
        };
        const next = [...current, newItem];

        setLastAddedInfo({
          name: mealForCart.name || 'Rescue meal',
          quantity: 1,
        });

        return next;
      }

      // existing line, just bump quantity
      const existing = current[idx];
      const existingQty = Number(existing.quantity) || 0;
      let nextQty = existingQty + 1;

      if (maxQty !== Infinity && nextQty > maxQty) {
        nextQty = maxQty;
      }

      current[idx] = {
        ...existing,
        quantity: nextQty,
      };

      setLastAddedInfo({
        name: mealForCart.name || 'Rescue meal',
        quantity: nextQty,
      });

      return current;
    });

    setShowCartToast(true);
    // stay on browse; do not auto-switch to cart
  };

  const handleFavoriteToggle = (restaurantId) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(restaurantId)) {
        next.delete(restaurantId);
      } else {
        next.add(restaurantId);
      }
      return next;
    });
  };

  const handleRescueAgain = () => {
    if (!userOrders || userOrders.length === 0) return;

    const lastOrder = userOrders[0];
    if (!lastOrder || !Array.isArray(lastOrder.items)) return;

    const rebuiltCart = [];

    lastOrder.items.forEach((item) => {
      const restaurant = restaurants.find((r) => r.id === item.restaurantId);
      const meal = restaurant?.menus?.find((m) => m.id === item.mealId);

      if (!restaurant || !meal) return;

      rebuiltCart.push({
        restaurant: restaurant.name,
        meal: { ...meal },
        quantity: item.quantity || 1,
      });
    });

    if (rebuiltCart.length === 0) return;

    setCart(rebuiltCart);
    setCurrentView('cart');
  };

  // *** FIXED: align with Cart.jsx onOrderPlaced({ order, rescuedMeals, youSave }) ***
  const handleOrderPlacedFromCart = (result) => {
    // result is the object from Cart: { order, rescuedMeals, youSave }
    const orderFromServer = result && result.order ? result.order : null;

    if (!orderFromServer) {
      // If we do not get a structured order, just clear any previous error
      setOrdersError(null);
      return;
    }

    const nowIso = new Date().toISOString();

    const serverItems = Array.isArray(orderFromServer.items)
      ? orderFromServer.items
      : [];

    // Build a client-friendly order object for recent orders list
    const items = serverItems.map((item) => ({
      restaurantName:
        item.restaurant || item.meal?.restaurantName || 'Rescue partner',
      name: item.meal?.name || 'Rescue meal',
      quantity: item.quantity || 1,
    }));

    const totalFromItems = serverItems.reduce((sum, item) => {
      const unit = Number(item.price) || 0;
      const qty = Number(item.quantity) || 0;
      return sum + unit * qty;
    }, 0);

    const clientOrder = {
      id:
        orderFromServer.id ||
        orderFromServer._id ||
        orderFromServer.orderId ||
        `local-${Date.now()}`,
      createdAt: orderFromServer.createdAt || orderFromServer.date || nowIso,
      date: orderFromServer.createdAt || orderFromServer.date || nowIso,
      items,
      totalPrice:
        orderFromServer.totalPrice ||
        orderFromServer.total ||
        totalFromItems ||
        0,
      points: orderFromServer.points || 0,
    };

    // Update userOrders list and localStorage cache (up to 5 recent)
    setUserOrders((prev) => {
      const base = Array.isArray(prev) ? prev : [];
      const next = [clientOrder, ...base];
      const limited = next.slice(0, 5);

      if (
        user &&
        user.email &&
        typeof window !== 'undefined' &&
        window.localStorage
      ) {
        try {
          const storageKey = `tiffin_trails_orders_${user.email}`;
          window.localStorage.setItem(storageKey, JSON.stringify(limited));
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error(
            'Error writing orders to localStorage after checkout:',
            err
          );
        }
      }

      return limited;
    });

    // Clear error banner on successful local order
    setOrdersError(null);

    // Sync front-end restaurant inventory by subtracting ordered quantities
    if (serverItems.length > 0) {
      setRestaurants((prev) => {
        if (!Array.isArray(prev) || prev.length === 0) {
          return prev;
        }

        const updated = prev.map((restaurant) => {
          if (!Array.isArray(restaurant.menus)) {
            return restaurant;
          }

          const updatedMenus = restaurant.menus.map((meal) => {
            if (!meal || !meal.id) {
              return meal;
            }

            const totalOrderedForMeal = serverItems.reduce((sum, item) => {
              if (!item || !item.meal || item.meal.id !== meal.id) {
                return sum;
              }
              const q = Number(item.quantity) || 0;
              return sum + q;
            }, 0);

            if (totalOrderedForMeal <= 0) {
              return meal;
            }

            const currentAvailable =
              typeof meal.availableQuantity === 'number' &&
                Number.isFinite(meal.availableQuantity)
                ? meal.availableQuantity
                : typeof meal.quantity === 'number' &&
                  Number.isFinite(meal.quantity)
                  ? meal.quantity
                  : null;

            if (currentAvailable === null) {
              return meal;
            }

            const nextAvailable = Math.max(
              0,
              currentAvailable - totalOrderedForMeal
            );

            return {
              ...meal,
              availableQuantity: nextAvailable,
            };
          });

          return {
            ...restaurant,
            menus: updatedMenus,
          };
        });

        return updated;
      });
    }

    // Refresh impact numbers from backend (non-blocking, UI stays the same)
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
          console.error('Error refreshing user impact after order:', err);
        });
    }
  };

  const filteredRestaurants = useMemo(() => {
    const term = searchQuery.toLowerCase().trim();

    // First apply search + cuisine filters
    const filtered = restaurants
      .filter((restaurant) => {
        const matchesCuisine =
          filterCuisine === 'all' ||
          (restaurant.cuisine &&
            restaurant.cuisine.toLowerCase() === filterCuisine.toLowerCase());
        if (!matchesCuisine) return false;

        if (!term) return true;

        const nameMatch = restaurant.name?.toLowerCase().includes(term);
        const cuisineMatch = restaurant.cuisine?.toLowerCase().includes(term);
        const neighborhoodMatch = restaurant.neighborhood
          ?.toLowerCase()
          .includes(term);

        return nameMatch || cuisineMatch || neighborhoodMatch;
      })
      .map((restaurant) => {
        // Compute inventory summary once, reuse for sorting and UI
        const inventorySummary = summarizeRescueInventory(restaurant);
        return {
          ...restaurant,
          inventorySummary,
        };
      });

    const scored = filtered
      .map((r) => {
        const inv = r.inventorySummary || {};
        const totalAvailable = Number(
          inv.totalAvailable != null ? inv.totalAvailable : 0
        );
        const hasRescue = totalAvailable > 0 ? 1 : 0;
        const isFav = favorites.has(r.id) ? 1 : 0;

        const score = isFav * 100 + hasRescue * 10;

        return {
          ...r,
          _score: score,
        };
      })
      .sort((a, b) => {
        if (a._score !== b._score) {
          return b._score - a._score;
        }
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
      });

    return scored;
  }, [restaurants, searchQuery, filterCuisine, favorites]);

  const restaurantLookup = useMemo(() => {
    const map = new Map();
    restaurants.forEach((r) => {
      map.set(r.id, r);
    });
    return map;
  }, [restaurants]);

  const rescuedMealsByRestaurant = useMemo(() => {
    const tally = new Map();
    if (!Array.isArray(userOrders)) return tally;

    userOrders.forEach((order) => {
      if (!Array.isArray(order.items)) return;
      order.items.forEach((item) => {
        const nameKey =
          item.restaurantName || restaurantLookup.get(item.restaurantId)?.name;
        if (!nameKey) return;
        const prev = tally.get(nameKey) || 0;
        tally.set(nameKey, prev + (item.quantity || 1));
      });
    });

    return tally;
  }, [userOrders, restaurantLookup]);

  const statsCards = [
    {
      label: 'Meals Rescued',
      value: userImpact.mealsOrdered || 0,
      icon: Leaf,
      detail: 'from Raleigh kitchens this month',
    },
    {
      label: 'Food Waste Prevented',
      value: `${userImpact.foodWastePrevented || 0} lbs`,
      icon: Package,
      detail: 'of surplus food saved from landfill',
    },
    {
      label: 'Your Lifetime Impact',
      value: `${userImpact.carbonReduced || 0} kg CO₂e`,
      icon: TrendingUp,
      detail: 'estimated emissions prevented by your rescues',
    },
  ];

  const handleInventoryDemoUpdate = (updatedRestaurants) => {
    setRestaurants(updatedRestaurants);
  };

  const closeCartToast = () => {
    setShowCartToast(false);
  };

  const toastMessage = lastAddedInfo
    ? `Added ${lastAddedInfo.name} (x${lastAddedInfo.quantity}) to cart. You can review items before placing your rescue.`
    : 'Added to cart. You can review items before placing your rescue.';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* top navigation */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-100">
              <Leaf className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Tiffin Trails
              </h1>
              <p className="text-xs text-gray-500">
                Save Food. Save money. Save Planet.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            {/* desktop nav */}
            <nav className="hidden md:flex items-center space-x-4">
              <button
                type="button"
                onClick={() => handleNavClick('browse')}
                className={`text-sm font-medium ${currentView === 'browse'
                  ? 'text-green-600'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Browse
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('impact')}
                className={`text-sm font-medium ${currentView === 'impact'
                  ? 'text-green-600'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                My Impact
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('community')}
                className={`text-sm font-medium ${currentView === 'community'
                  ? 'text-green-600'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Community
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('leaderboard')}
                className={`text-sm font-medium ${currentView === 'leaderboard'
                  ? 'text-green-600'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Leaderboard
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('cart')}
                className={`relative flex items-center text-sm font-medium ${currentView === 'cart'
                  ? 'text-green-600'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <ShoppingCart className="w-5 h-5 mr-1" />
                Cart
                {cart.length > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center text-xs font-semibold bg-green-600 text-white rounded-full w-5 h-5">
                    {cart.length}
                  </span>
                )}
              </button>
            </nav>

            {/* user + logout */}
            <div className="hidden md:flex items-center space-x-3">
              <div className="text-right">
                <div className="text-xs text-gray-500">Signed in as</div>
                <div className="text-sm font-medium text-gray-900">
                  {user?.name || 'Guest Rescuer'}
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogoutClick}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Log out
              </button>
            </div>

            {/* mobile nav toggle */}
            <button
              type="button"
              className="md:hidden flex items-center text-gray-600 hover:text-gray-900"
              onClick={() => setShowMobileMenu((prev) => !prev)}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* mobile dropdown nav */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <nav className="px-4 py-3 space-y-2">
              <button
                type="button"
                onClick={() => handleNavClick('browse')}
                className={`block w-full text-left text-sm py-1 ${currentView === 'browse'
                  ? 'text-green-600'
                  : 'text-gray-700 hover:text-gray-900'
                  }`}
              >
                Browse
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('impact')}
                className={`block w-full text-left text-sm py-1 ${currentView === 'impact'
                  ? 'text-green-600'
                  : 'text-gray-700 hover:text-gray-900'
                  }`}
              >
                My Impact
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('community')}
                className={`block w-full text-left text-sm py-1 ${currentView === 'community'
                  ? 'text-green-600'
                  : 'text-gray-700 hover:text-gray-900'
                  }`}
              >
                Community
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('leaderboard')}
                className={`block w-full text-left text-sm py-1 ${currentView === 'leaderboard'
                  ? 'text-green-600'
                  : 'text-gray-700 hover:text-gray-900'
                  }`}
              >
                Leaderboard
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('cart')}
                className={`block w-full text-left text-sm py-1 ${currentView === 'cart'
                  ? 'text-green-600'
                  : 'text-gray-700 hover:text-gray-900'
                  }`}
              >
                Cart
              </button>
              <button
                type="button"
                onClick={handleLogoutClick}
                className="block w-full text-left text-sm py-1 text-red-600 hover:text-red-700"
              >
                Log out
              </button>
            </nav>
          </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* top hero & quick stats always visible on browse view */}
        {currentView === 'browse' && (
          <section className="mb-6 space-y-4">
            {/* hero + quick stats */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <h2 className="text-xl font-bold mb-2">
                    Rescue surplus meals from local kitchens
                  </h2>
                  <p className="text-sm text-green-100">
                    Pick up chef-made meals at a fraction of the price while
                    reducing food waste in your neighborhood.
                  </p>
                </div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white/10 rounded-lg px-3 py-2 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-green-100">
                        Meals you&apos;ve rescued
                      </p>
                      <p className="text-xl font-semibold">
                        {userImpact.mealsOrdered || 0}
                      </p>
                    </div>
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-700/60">
                      <Leaf className="w-4 h-4 text-green-100" />
                    </div>
                  </div>
                  <div className="bg-white/10 rounded-lg px-3 py-2 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-green-100">
                        Local partners
                      </p>
                      <p className="text-xl font-semibold">
                        {userImpact.localRestaurantsSupported || 0}
                      </p>
                    </div>
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-700/60">
                      <Users className="w-4 h-4 text-green-100" />
                    </div>
                  </div>
                  <div className="bg-white/10 rounded-lg px-3 py-2 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-green-100">
                        Impact level
                      </p>
                      <p className="text-xl font-semibold">
                        {userImpact.impactLevel}
                      </p>
                    </div>
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-700/60">
                      <Star className="w-4 h-4 text-yellow-300" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-green-50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-800">
                    Your Impact Snapshot
                  </h3>
                  {renderImpactLevelBadge(userImpact)}
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
                      {userImpact.carbonReduced || 0} kg CO₂e
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* search & filters row */}
            <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex-1 flex items-center bg-white rounded-lg shadow-sm border border-gray-200 px-3 py-2">
                <Search className="w-4 h-4 text-gray-400 mr-2" />
                <input
                  type="text"
                  placeholder="Search by restaurant, cuisine, or neighborhood..."
                  className="w-full border-none outline-none text-sm text-gray-800 placeholder-gray-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-xs text-gray-600">Cuisine</label>
                <select
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-800"
                  value={filterCuisine}
                  onChange={(e) => setFilterCuisine(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="Indian">Indian</option>
                  <option value="Indian Fusion">Indian Fusion</option>
                  <option value="American">American</option>
                  <option value="Mexican">Mexican</option>
                  <option value="Italian">Italian</option>
                  <option value="Mediterranean">Mediterranean</option>
                  <option value="Asian">Asian</option>
                </select>
              </div>
            </section>
          </section>
        )}

        {/* browse view */}
        {currentView === 'browse' && (
          <section className="space-y-4">
            <header className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900 mr-2">
                Available tonight near you
              </h2>
              <p className="text-xs text-gray-500">
                Real-time availability from Raleigh partners
              </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRestaurants.map((restaurant) => {
                const restaurantId = restaurant.id;
                const isFavorite = favorites.has(restaurantId);

                const userRescueCount =
                  rescuedMealsByRestaurant.get(restaurant.name) || 0;

                return (
                  <div
                    key={restaurantId}
                    className="bg-white rounded-xl shadow hover:shadow-md transition p-4 flex cursor-pointer"
                    onClick={() => {
                      setSelectedRestaurant(restaurant);
                      setCurrentView('restaurant-detail');
                    }}
                  >
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-base font-semibold text-gray-900">
                              {restaurant.name}
                            </h3>
                            {userRescueCount > 0 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                                <Zap className="w-3 h-3 mr-1" />
                                Rescued {userRescueCount}x
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                            <span>{restaurant.cuisine}</span>
                            <span>•</span>
                            <span className="inline-flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {restaurant.neighborhood || 'Raleigh'}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleFavoriteToggle(restaurant.id)}
                          className="p-1 rounded-full hover:bg-gray-100"
                        >
                          <Heart
                            className={`w-5 h-5 ${isFavorite ? 'text-red-500' : 'text-gray-400'
                              }`}
                            fill={isFavorite ? 'currentColor' : 'none'}
                          />
                        </button>
                      </div>

                      <div className="mt-3 flex items-center space-x-3 text-xs text-gray-600">
                        <span className="inline-flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          Pickup{' '}
                          {restaurant.pickupWindow ||
                            restaurant.menus?.[0]?.pickupWindow ||
                            '5–7pm'}
                        </span>
                        <span className="inline-flex items-center">
                          <Truck className="w-3 h-3 mr-1" />
                          {restaurant.pickupLocation || 'Curbside pickup'}
                        </span>
                      </div>

                      <div className="mt-3">
                        <p className="text-xs font-medium text-gray-700 mb-1">
                          Tonight&apos;s rescue boxes
                        </p>
                        <div className="space-y-2">
                          {Array.isArray(restaurant.menus) &&
                            restaurant.menus.length > 0 ? (
                            restaurant.menus.map((meal) => {
                              const available =
                                typeof meal.availableQuantity === 'number'
                                  ? meal.availableQuantity
                                  : meal.quantityAvailable || 0;
                              const isSoldOut =
                                available <= 0 || meal.isSoldOut;
                              const unitPrice =
                                meal.price ?? meal.rescuePrice ?? 5;

                              return (
                                <div
                                  key={meal.id}
                                  className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                                >
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {meal.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {meal.description ||
                                        'Chef-selected surplus portions from tonight.'}
                                    </p>
                                    <div className="mt-1 flex items-center space-x-2 text-xs text-gray-500">
                                      <span>
                                        ${unitPrice.toFixed(2)} rescue price
                                      </span>
                                      {available > 0 && (
                                        <>
                                          <span>•</span>
                                          <span>{available} left</span>
                                        </>
                                      )}
                                      {isSoldOut && (
                                        <>
                                          <span>•</span>
                                          <span className="text-red-500 font-semibold">
                                            Sold out
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end space-y-1">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        !isSoldOut &&
                                        handleAddToCart(restaurant, {
                                          ...meal,
                                          isSoldOut,
                                        })
                                      }
                                      disabled={isSoldOut}
                                      className={`px-3 py-1 text-xs font-medium rounded-full border ${isSoldOut
                                        ? 'border-gray-300 text-gray-400 cursor-not-allowed bg-gray-100'
                                        : 'border-green-600 text-green-700 hover:bg-green-50'
                                        }`}
                                    >
                                      {isSoldOut
                                        ? 'Sold Out'
                                        : 'Add to cart'}
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-xs text-gray-500">
                              No rescue boxes listed yet — check back later
                              tonight.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
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
                    {typeof userImpact.localRestaurantsSupported === 'number' && (
                      <>
                        {' '}
                        You&apos;ve supported{' '}
                        <span className="font-semibold text-gray-700">
                          {userImpact.localRestaurantsSupported}
                        </span>{' '}
                        local restaurants so far.
                      </>
                    )}
                  </p>
                </div>
                {renderImpactLevelBadge(userImpact)}
              </div>

              {ordersError && (
                <div className="mb-4 rounded-lg bg-red-50 border border-red-100 p-3 text-xs text-red-700">
                  {ordersError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {statsCards.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={stat.label}
                      className="bg-gradient-to-br from-green-50 via-white to-sky-50 rounded-xl shadow-sm border border-green-100 p-4 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-gray-700">
                          {stat.label}
                        </p>
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                          <Icon className="w-4 h-4 text-green-700" />
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mb-1">
                        {stat.value}
                      </p>
                      <p className="text-xs text-gray-500">{stat.detail}</p>
                    </div>
                  );
                })}
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
                    You&apos;re reducing the amount of perfectly good food that
                    might otherwise end up in landfills, which also cuts down on
                    greenhouse gas emissions from decomposition.
                  </li>
                  <li>
                    By choosing rescue meals, you&apos;re also supporting more
                    affordable access to prepared food in your community.
                  </li>
                  <li>
                    Over time, regular rescuers like you create enough demand
                    that restaurants can plan more sustainable inventory and
                    portioning.
                  </li>
                </ul>
              </div>

              {userOrders && userOrders.length > 0 && (
                <div className="mt-8">
                  <div className="flex items中心 justify-between mb-4">
                    <h3 className="text-base font-semibold text-gray-900">
                      Your recent rescues
                    </h3>
                    <button
                      type="button"
                      onClick={handleRescueAgain}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full bg-green-600 text-white hover:bg-green-700"
                    >
                      <ShoppingCart className="w-4 h-4 mr-1" />
                      Rescue Again
                    </button>
                  </div>
                  <div className="space-y-3">
                    {userOrders.slice(0, 5).map((order) => (
                      <div
                        key={order.id}
                        className="bg-gray-50 rounded-lg px-4 py-3 flex justify-between items-center"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {order.items
                              ?.map((item) => item.restaurantName)
                              .filter(Boolean)
                              .join(', ') || 'Rescue order'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(
                              order.createdAt || order.date
                            ).toLocaleString()}{' '}
                            •{' '}
                            {order.items
                              ?.map((item) => item.name)
                              .filter(Boolean)
                              .join(', ')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">
                            ${order.totalPrice || order.total || 0}
                          </p>
                          <p className="text-xs text-gray-500">
                            {order.points || 0} pts earned
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                See how neighbors are rescuing surplus food together in Raleigh.
              </p>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-lg px-4 py-3 flex items-center">
                  <Leaf className="w-5 h-5 text-green-600 mr-3" />
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {communityStats.totalMealsRescued || 0}
                    </p>
                    <p className="text-xs text-gray-600">
                      meals rescued this week
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg px-4 py-3 flex items-center">
                  <Users className="w-5 h-5 text-blue-600 mr-3" />
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {communityStats.activeUsers || 0}
                    </p>
                    <p className="text-xs text-gray-600">
                      neighbors already rescuing
                    </p>
                  </div>
                </div>

                <div className="bg-amber-50 rounded-lg px-4 py-3 flex items-center">
                  <Store className="w-5 h-5 text-amber-600 mr-3" />
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {communityStats.participatingRestaurants || 0}
                    </p>
                    <p className="text-xs text-gray-600">
                      restaurants providing meals
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-lg px-4 py-3 flex items-center">
                  <TrendingUp className="w-5 h-5 text-green-600 mr-3" />
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {communityStats.foodWastePrevented || 0}
                    </p>
                    <p className="text-xs text-gray-600">
                      pounds of food waste prevented
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg px-4 py-3 flex items-center">
                  <Cloud className="w-5 h-5 text-blue-600 mr-3" />
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {communityStats.carbonReduced || 0}
                    </p>
                    <p className="text-xs text-gray-600">
                      total carbon reduction
                    </p>
                  </div>
                </div>

                <div className="bg-amber-50 rounded-lg px-4 py-3 flex items-center">
                  <CircleDollarSign className="w-5 h-5 text-amber-600 mr-3" />
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {communityStats.totalMoneySaved || 0}
                    </p>
                    <p className="text-xs text-gray-600">
                      dollars saved
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
                  This week&apos;s community challenge
                </p>
                <p className="text-sm text-gray-600">
                  Help the community rescue{' '}
                  <span className="font-semibold">
                    {communityGoal.target}
                  </span>{' '}
                  meals this week. We&apos;re currently at{' '}
                  <span className="font-semibold">
                    {communityGoal.progress}
                  </span>
                  .
                </p>
                <div className="mt-2 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-green-500"
                    style={{
                      width: `${Math.min(
                        100,
                        (communityGoal.progress / (communityGoal.target || 1)) *
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Community Podiums
              </h2>
              <p className="text-sm text-gray-600">
                See who&apos;s rescued, reduced, and saved the most.
              </p>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 md:grid-rows-2 gap-4">
                <div className="bg-gray-50 rounded-lg px-4 py-3 flex flex-col items-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Meals Rescued
                  </h3>
                  <Podium medalists={communityStats.topUsers.mealsRescued}></Podium>
                </div>
                <div className="bg-gray-50 rounded-lg px-4 py-3 flex flex-col items-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Waste Reduced
                  </h3>
                  <Podium medalists={communityStats.topUsers.wastePrevented}></Podium>
                </div>
                <div className="bg-gray-50 rounded-lg px-4 py-3 flex flex-col items-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Carbon Reduced
                  </h3>
                  <Podium medalists={communityStats.topUsers.carbonReduced}></Podium>
                </div>
                <div className="bg-gray-50 rounded-lg px-4 py-3 flex flex-col items-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Money Saved
                  </h3>
                  <Podium medalists={communityStats.topUsers.moneySaved}></Podium>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Leaderboard view */}
        {currentView === 'leaderboard' && (
          <LeaderboardPanel communityStats={communityStats} />
        )}

        {/* cart view */}
        {currentView === 'cart' && (
          <section className="space-y-4">
            <Cart
              cart={cart}
              setCart={setCart}
              onBack={() => setCurrentView('browse')}
              onOrderPlaced={handleOrderPlacedFromCart}
              user={user}
            />
          </section>
        )}

        {/* restaurant detail view */}
        {currentView === 'restaurant-detail' && (
          <section className="space-y-4">
            <RestaurantDetail
              restaurant={selectedRestaurant}
              onAddToCart={handleAddToCart}
              cart={cart}
              onBack={() => setCurrentView('browse')}
              onInventoryDemoUpdate={handleInventoryDemoUpdate}
            />

          </section>
        )}
      </main>

      {/* toast for add-to-cart */}
      {showCartToast && (
        <div className="fixed bottom-4 right-4 z-40">
          <div className="bg-gray-900 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-3">
            <ShoppingCart className="w-4 h-4 text-green-300" />
            <span className="text-sm">{toastMessage}</span>
            <button
              type="button"
              onClick={closeCartToast}
              className="text-gray-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* logout confirmation modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-sm w-full mx-4 p-5">
            <div className="flex items-start mb-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 mr-3">
                <X className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  Log out?
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  You&apos;ll be signed out of your Tiffin Trails session. You
                  can log in again anytime to continue rescuing meals.
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-3">
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
