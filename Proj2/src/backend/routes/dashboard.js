// Proj2/src/backend/routes/dashboard.js
// Central dashboard-related API routes for Tiffin Trails.
// This file exposes:
//   GET  /dashboard/restaurants-with-meals
//   GET  /dashboard/community-stats
//   GET  /dashboard/user-impact?email=...
//   GET  /api/restaurant-points
//
// It joins Restaurant_Metadata.csv with rescue_meals.csv to provide
// per-restaurant rescue meal listings plus some simple stats for the
// dashboard UI. It also uses inventory.json to track how many units
// of each rescue meal have already been sold (persistent inventory).

const express = require("express");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const router = express.Router();

// ---------- paths to data ----------

// CSV data lives in Proj2/data
// JSON data for backend lives in Proj2/src/backend/data
const CSV_DATA_DIR = path.join(__dirname, "../../../data");
const BACKEND_DATA_DIR = path.join(__dirname, "../data");

const RESTAURANT_META_CSV = path.join(CSV_DATA_DIR, "Restaurant_Metadata.csv");
const RESCUE_MEALS_CSV = path.join(CSV_DATA_DIR, "rescue_meals.csv");

const INVENTORY_JSON = path.join(BACKEND_DATA_DIR, "inventory.json");
const ORDERS_JSON = path.join(BACKEND_DATA_DIR, "orders.json");
const RESTAURANT_POINTS_JSON = path.join(
  BACKEND_DATA_DIR,
  "restaurant_points.json"
);

// ---------- helpers ----------

function safeNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function slugify(str) {
  return String(str || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function loadCsvRows(csvPath) {
  return new Promise((resolve) => {
    const rows = [];

    if (!fs.existsSync(csvPath)) {
      // eslint-disable-next-line no-console
      console.error(`CSV file not found: ${csvPath}`);
      resolve(rows);
      return;
    }

    const stream = fs.createReadStream(csvPath);

    stream.on("error", (err) => {
      // eslint-disable-next-line no-console
      console.error(`Error opening CSV file ${csvPath}:`, err);
      return resolve([]);
    });

    stream
      .pipe(csv())
      .on("data", (row) => {
        rows.push(row);
      })
      .on("end", () => resolve(rows))
      .on("error", (err) => {
        // eslint-disable-next-line no-console
        console.error(`Error parsing CSV file ${csvPath}:`, err);
        resolve([]);
      });
  });
}

function loadInventory() {
  try {
    if (!fs.existsSync(INVENTORY_JSON)) {
      return {};
    }
    const raw = fs.readFileSync(INVENTORY_JSON, "utf8");
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed;
    }
    return {};
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error reading inventory.json:", err);
    return {};
  }
}

function loadOrders() {
  try {
    if (!fs.existsSync(ORDERS_JSON)) {
      return [];
    }
    const raw = fs.readFileSync(ORDERS_JSON, "utf8");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error reading orders.json:", err);
    return [];
  }
}

function loadRestaurantPoints() {
  try {
    if (!fs.existsSync(RESTAURANT_POINTS_JSON)) {
      return {};
    }
    const raw = fs.readFileSync(RESTAURANT_POINTS_JSON, "utf8");
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed;
    }
    return {};
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error reading restaurant_points.json:", err);
    return {};
  }
}

// ---------- GET /dashboard/restaurants-with-meals ----------
//
// Builds restaurant objects from Restaurant_Metadata.csv,
// then attaches rescue meals from rescue_meals.csv,
// and adjusts availableQuantity using inventory.json (sold counts).
//

router.get("/dashboard/restaurants-with-meals", async (req, res) => {
  try {
    const [metaRows, mealRows] = await Promise.all([
      loadCsvRows(RESTAURANT_META_CSV),
      loadCsvRows(RESCUE_MEALS_CSV),
    ]);

    const inventory = loadInventory();

    const restaurantsByName = new Map();

    // 1) Build base restaurant objects from metadata CSV
    metaRows.forEach((row) => {
      const name = (row.restaurant || row.name || "").trim();
      if (!name) return;

      const id = slugify(name);
      const cuisine = (row.cuisine || "American").toString();
      const avgOrders = safeNumber(row.avg_daily_orders, 100);

      const rating =
        avgOrders >= 300 ? 4.8 : avgOrders >= 200 ? 4.6 : avgOrders >= 100 ? 4.4 : 4.2;
      const numReviews =
        avgOrders >= 300 ? 420 : avgOrders >= 200 ? 260 : avgOrders >= 100 ? 130 : 40;
      const impactRank =
        avgOrders >= 300 ? "Gold Partner" : avgOrders >= 200 ? "Silver Partner" : "Community Partner";

      const base = {
        id,
        name,
        cuisine,
        distance: safeNumber(row.distance_miles, 1.2),
        rating,
        numReviews,
        impactRank,
        address: row.address || null,
        neighborhood: row.neighborhood || row.zip_code || null,
        hours: row.hours || "Today · 11:00 AM – 8:00 PM",
        menus: [],
      };

      restaurantsByName.set(name, base);
    });

    // 2) Attach rescue meals from rescue_meals.csv
    mealRows.forEach((row) => {
      const restaurantName = (row.restaurant || "").trim();
      if (!restaurantName) return;

      if (!restaurantsByName.has(restaurantName)) {
        restaurantsByName.set(restaurantName, {
          id: slugify(restaurantName),
          name: restaurantName,
          cuisine: "American",
          distance: 1.2,
          rating: 4.4,
          numReviews: 50,
          impactRank: "Community Partner",
          address: null,
          neighborhood: null,
          hours: "Today · 11:00 AM – 8:00 PM",
          menus: [],
        });
      }

      const restaurant = restaurantsByName.get(restaurantName);
      const mealName = row.meal_name || "Rescue Meal";
      const mealId = slugify(`${restaurantName}-${mealName}`);

      const originalPrice = safeNumber(row.original_price, null);
      const rescuePrice = safeNumber(row.rescue_price, null);
      const baseQty = safeNumber(row.quantity, 0);

      const invEntry = inventory[mealId] || {};
      const sold = safeNumber(invEntry.sold, 0);
      const remaining = Math.max(baseQty - sold, 0);

      const availableQuantity = remaining;
      const pickupWindow = row.expires_in || "Pickup within today";

      const maxPerOrder =
        baseQty > 0 ? Math.min(baseQty, 3) : availableQuantity > 0 ? availableQuantity : 1;

      restaurant.menus.push({
        id: mealId,
        name: mealName,
        description: "Chef-selected surplus meal from today's unsold portions.",
        originalPrice,
        rescuePrice,
        pickupWindow,
        quantity: baseQty,
        availableQuantity,
        maxPerOrder,
        isRescueMeal: true,
      });
    });

    const results = Array.from(restaurantsByName.values());
    return res.json(results);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error in /dashboard/restaurants-with-meals:", err);
    return res.status(500).json({
      error: "Failed to load restaurants with meals.",
    });
  }
});

// ---------- GET /dashboard/community-stats ----------
//
// Aggregates community-wide stats from orders.json.
//

router.get("/dashboard/community-stats", (req, res) => {
	try {
		const orders = loadOrders();

		let totalMealsRescued = 0;
		let totalMoneySaved = 0;

		const restaurantSet = new Set();
		const userSet = new Set();

		// Per-user stats
		const userStats = {}; 
		// userStats[email] = { meals, moneySaved, waste, carbon }

		orders.forEach((order) => {
			if (!order || !Array.isArray(order.items)) return;

			const email = order.userEmail;
			if (email) {
				userSet.add(email);
				if (!userStats[email]) {
					userStats[email] = {
						meals: 0,
						moneySaved: 0,
						waste: 0,
						carbon: 0,
					};
				}
			}

			order.items.forEach((item) => {
				if (!item || !item.isRescueMeal) return;

				const qty = safeNumber(item.quantity, 0);
				const price = safeNumber(item.price, 0);
				const original = safeNumber(item.meal?.originalPrice, 0);

				totalMealsRescued += qty;
				totalMoneySaved += qty * Math.max(original - price, 0);

				if (email) {
					userStats[email].meals += qty;
					const saved = qty * Math.max(original - price, 0);
					userStats[email].moneySaved += saved;
					userStats[email].waste += qty * 2.5;
					userStats[email].carbon += qty * 4;
				}

				if (item.restaurant) restaurantSet.add(item.restaurant);
			});
		});

		const foodWastePrevented = totalMealsRescued * 2.5;
		const carbonReduced = totalMealsRescued * 4;

		// Helper function for generating top 3 lists
		const top3 = (metric) =>
			Object.entries(userStats)
				.sort((a, b) => b[1][metric] - a[1][metric])
				.slice(0, 3)
				.map(([email]) => email);

		// Top users for each category
		const topUsers = {
			mealsRescued: top3("meals"),
			wastePrevented: top3("waste"),
			moneySaved: top3("moneySaved"),
			carbonReduced: top3("carbon"),
		};

		return res.json({
			totalMealsRescued,
			totalMoneySaved,
			foodWastePrevented,
			carbonReduced,
			participatingRestaurants: restaurantSet.size,
			activeUsers: userSet.size,
			topUsers, // NEW
		});
	} catch (err) {
		console.error("Error in /dashboard/community-stats:", err);
		return res.status(500).json({
			error: "Failed to compute community stats.",
		});
	}
});



// ---------- GET /dashboard/user-impact ----------
//
// Returns basic impact metrics for a specific user, based on past orders.
//

router.get("/dashboard/user-impact", (req, res) => {
  const email = (req.query.email || "").trim().toLowerCase();

  if (!email) {
    return res.status(400).json({
      error: 'Query parameter "email" is required.',
    });
  }

  try {
    const orders = loadOrders();

    let mealsOrdered = 0;
    let moneySaved = 0;
    let foodWastePrevented = 0;
    let carbonReduced = 0;
    const restaurantsSupported = new Set();

    orders.forEach((order) => {
      if (!order || !Array.isArray(order.items)) return;
      if (!order.userEmail || order.userEmail.toLowerCase() !== email) return;

      order.items.forEach((item) => {
        if (!item || !item.isRescueMeal) return;

        const qty = safeNumber(item.quantity, 0);
        const price = safeNumber(item.price, 0);
        const original = safeNumber(item.meal?.originalPrice, 0);

        mealsOrdered += qty;
        moneySaved += qty * Math.max(original - price, 0);
        foodWastePrevented += qty * 2.5;
        carbonReduced += qty * 4;

        if (item.restaurant) {
          restaurantsSupported.add(item.restaurant);
        }
      });
    });

    let impactLevel = "Getting Started";
    if (mealsOrdered >= 20) {
      impactLevel = "Food Hero";
    } else if (mealsOrdered >= 10) {
      impactLevel = "Food Saver";
    } else if (mealsOrdered >= 5) {
      impactLevel = "Rising Rescuer";
    }

    return res.json({
      mealsOrdered,
      moneySaved,
      foodWastePrevented,
      carbonReduced,
      localRestaurantsSupported: restaurantsSupported.size,
      impactLevel,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error in /dashboard/user-impact:", err);
    return res.status(500).json({
      error: "Failed to compute user impact.",
    });
  }
});

// ---------- GET /api/restaurant-points ----------
//
// Simple leaderboard data per restaurant.
//

router.get("/api/restaurant-points", (req, res) => {
  try {
    const points = loadRestaurantPoints();
    const entries = Object.entries(points).map(([restaurant, score]) => ({
      restaurant,
      score: safeNumber(score, 0),
    }));

    entries.sort((a, b) => b.score - a.score);

    return res.json(entries);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error in /api/restaurant-points:", err);
    return res.status(500).json({
      error: "Failed to load restaurant leaderboard.",
    });
  }
});

module.exports = router;
