// Proj2/src/backend/routes/dashboard.js
// Central dashboard-related API routes for Tiffin Trails.
// This file exposes:
//   GET  /dashboard/restaurants-with-meals
//   GET  /dashboard/community-stats
//   GET  /dashboard/user-impact?email=...
//   GET  /api/restaurant-points
//   POST /cart/checkout
//
// It joins Restaurant_Metadata.csv with rescue_meals.csv to provide
// per-restaurant rescue meal inventory, and summarizes community / user
// impact numbers from the persisted orders.json file.

const express = require("express");
const path = require("path");
const fs = require("fs");
const csv = require("csv-parser");

const router = express.Router();

// ---------- Data files ----------

const dataPath = path.join(__dirname, "../../../data");
const restaurantFile = path.join(dataPath, "Restaurant_Metadata.csv");
const rescueMealsFile = path.join(dataPath, "rescue_meals.csv");

// orders.json is used for impact + community + checkout
const ordersFile = path.join(__dirname, "../data", "orders.json");

// ---------- Helpers ----------

/**
 * Read a CSV file into an array of row objects.
 */
function readCsv(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => rows.push(row))
      .on("end", () => resolve(rows))
      .on("error", (err) => reject(err));
  });
}

/**
 * Safely load orders.json; if missing or invalid, return [].
 */
function loadOrders() {
  try {
    if (!fs.existsSync(ordersFile)) {
      return [];
    }
    const raw = fs.readFileSync(ordersFile, "utf8");
    if (!raw.trim()) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    if (parsed && Array.isArray(parsed.orders)) {
      // support old shape { orders: [...] }
      return parsed.orders;
    }
    return [];
  } catch (err) {
    console.error("Error reading orders.json:", err);
    return [];
  }
}

/**
 * Safely write orders.json (overwrite whole file).
 */
function writeOrders(orders) {
  const dir = path.dirname(ordersFile);
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing orders.json:", err);
    throw err;
  }
}

/**
 * Normalize a numeric field from a CSV row.
 */
function toNumber(value, fallback = null) {
  if (value === undefined || value === null || String(value).trim() === "") {
    return fallback;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

// ---------- Routes ----------

/**
 * GET /dashboard/restaurants-with-meals
 *
 * Returns restaurant metadata joined with rescue meals and inventory.
 */
router.get("/dashboard/restaurants-with-meals", async (req, res) => {
  try {
    const [restaurantRows, mealRows] = await Promise.all([
      readCsv(restaurantFile),
      readCsv(rescueMealsFile),
    ]);

    // Build a map of restaurants keyed by name
    const restaurantMap = new Map();

    restaurantRows.forEach((row) => {
      const name =
        row["Restaurant Name"] || row.restaurant || row.name;

      if (!name) {
        return;
      }

      if (!restaurantMap.has(name)) {
        const rating = toNumber(row["Average Rating"], 4.5);
        const distanceMiles = toNumber(row["Distance (miles)"], null);

        restaurantMap.set(name, {
          id: row["Restaurant ID"] || name,
          name,
          cuisine: row["Cuisine Type"] || row.cuisine || "Cuisine not listed",
          address: row["Address"] || "",
          hours: row["Operating Hours"] || row.hours || "",
          rating,
          distance: distanceMiles,
          menus: [],
        });
      }
    });

    // Attach rescue meals inventory per restaurant
    mealRows.forEach((mealRow) => {
      const restaurantName =
        mealRow["Restaurant Name"] || mealRow["restaurant"];

      if (!restaurantName || !restaurantMap.has(restaurantName)) {
        return;
      }

      const restaurant = restaurantMap.get(restaurantName);

      const mealName =
        mealRow["Meal Name"] || mealRow["meal_name"] || "Rescue Meal";

      const originalPriceRaw =
        mealRow["Original Price"] ||
        mealRow["original_price"] ||
        mealRow["orig_price"];

      const rescuePriceRaw =
        mealRow["Rescue Price"] ||
        mealRow["rescue_price"] ||
        mealRow["discount_price"];

      const quantityRaw =
        mealRow["Available Quantity"] ||
        mealRow["quantity"] ||
        mealRow["qty"];

      const expiresInRaw =
        mealRow["Expires In"] ||
        mealRow["expires_in"] ||
        "";

      const pickupWindowRaw =
        mealRow["Pickup Window"] ||
        mealRow["pickup_window"] ||
        (expiresInRaw ? `Pickup within ${expiresInRaw}` : "");

      const quantity =
        quantityRaw === undefined ||
        quantityRaw === null ||
        String(quantityRaw).trim() === ""
          ? null
          : parseInt(quantityRaw, 10);

      // keep prices as numbers so frontend .toFixed() works
      const originalPrice = toNumber(originalPriceRaw, null);
      const rescuePrice = toNumber(rescuePriceRaw, null);

      const meal = {
        id: `${restaurantName}-${mealName}-${pickupWindowRaw}`,
        name: mealName,
        description: mealRow["Description"] || "",
        originalPrice, // number or null
        rescuePrice,   // number or null
        pickupWindow: pickupWindowRaw || "",
        // friendly string such as "2 hours"
        expiresIn: expiresInRaw || pickupWindowRaw || "",
        isRescueMeal: true,
      };

      if (Number.isFinite(quantity) && quantity >= 0) {
        meal.availableQuantity = quantity;
        meal.quantity = quantity;
        meal.isSoldOut = quantity === 0;
      }

      restaurant.menus.push(meal);
    });

    const result = Array.from(restaurantMap.values());

    res.json(result);
  } catch (err) {
    console.error("❌ Error in /dashboard/restaurants-with-meals:", err);
    res.status(500).json({ error: "Failed to load restaurants with meals" });
  }
});

/**
 * GET /dashboard/community-stats
 *
 * Returns aggregated stats across all orders.
 */
router.get("/dashboard/community-stats", (req, res) => {
  try {
    const orders = loadOrders();

    const activeUsers = new Set();
    let mealsRescued = 0;

    orders.forEach((order) => {
      if (order && order.userEmail) {
        activeUsers.add(order.userEmail);
      }
      if (
        order &&
        order.totals &&
        typeof order.totals.rescueMealCount === "number"
      ) {
        mealsRescued += order.totals.rescueMealCount;
      } else if (order && Array.isArray(order.items)) {
        order.items.forEach((item) => {
          if (item && item.isRescueMeal) {
            const q = toNumber(item.quantity, 1) || 1;
            mealsRescued += q;
          }
        });
      }
    });

    // Simple heuristic: each rescue meal prevents ~2 lbs of waste.
    const wasteLbs = mealsRescued * 2;
    const wasteTons = wasteLbs / 2000;

    res.json({
      activeUsers: activeUsers.size,
      mealsRescued,
      wastePreventedTons: wasteTons.toFixed(2),
    });
  } catch (err) {
    console.error("❌ Error in /dashboard/community-stats:", err);
    res.status(500).json({ error: "Failed to load community stats" });
  }
});

/**
 * GET /dashboard/user-impact?email=...
 *
 * Returns impact metrics for a single user.
 */
router.get("/dashboard/user-impact", (req, res) => {
  try {
    const email = (req.query.email || "").toString().trim().toLowerCase();
    const orders = loadOrders();

    if (!email) {
      return res.json({
        mealsOrdered: 0,
        moneySaved: 0,
        foodWastePrevented: 0,
        carbonReduced: 0,
        localRestaurantsSupported: 0,
      });
    }

    let mealsOrdered = 0;
    let moneySaved = 0;
    let foodWasteLbs = 0;
    const restaurants = new Set();

    orders.forEach((order) => {
      if (!order || (order.userEmail || "").toLowerCase() !== email) {
        return;
      }

      if (Array.isArray(order.items)) {
        order.items.forEach((item) => {
          if (!item || !item.isRescueMeal) {
            return;
          }

          const q = toNumber(item.quantity, 1) || 1;
          mealsOrdered += q;

          const originalPrice = toNumber(item.originalPrice, 0) || 0;
          const paid =
            toNumber(item.price, null) ??
            toNumber(item.rescuePrice, null) ??
            0;

          if (originalPrice > 0 && paid >= 0) {
            moneySaved += (originalPrice - paid) * q;
          }

          if (item.restaurant) {
            restaurants.add(item.restaurant);
          }
        });
      }

      if (
        order.totals &&
        typeof order.totals.rescueMealCount === "number" &&
        order.totals.rescueMealCount > 0
      ) {
        const extra = order.totals.rescueMealCount;
        mealsOrdered = Math.max(mealsOrdered, extra);
      }
    });

    // Approximate environmental impact:
    //   2 lbs of food waste avoided per rescue meal,
    //   4 kg CO2e reduced per rescue meal (illustrative).
    foodWasteLbs = mealsOrdered * 2;
    const carbonReducedKg = mealsOrdered * 4;

    res.json({
      mealsOrdered,
      moneySaved: Number(moneySaved.toFixed(2)),
      foodWastePrevented: Number(foodWasteLbs.toFixed(1)),
      carbonReduced: Number(carbonReducedKg.toFixed(1)),
      localRestaurantsSupported: restaurants.size,
    });
  } catch (err) {
    console.error("❌ Error in /dashboard/user-impact:", err);
    res.status(500).json({ error: "Failed to load user impact" });
  }
});

/**
 * GET /api/restaurant-points
 *
 * Returns a simple leaderboard of restaurants based on rescue
 * activity (number of rescue meals in orders).
 */
router.get("/api/restaurant-points", (req, res) => {
  try {
    const orders = loadOrders();
    const pointsMap = new Map();

    orders.forEach((order) => {
      if (!order || !Array.isArray(order.items)) {
        return;
      }

      order.items.forEach((item) => {
        if (!item || !item.isRescueMeal || !item.restaurant) {
          return;
        }

        const key = item.restaurant;
        const q = toNumber(item.quantity, 1) || 1;
        const prev = pointsMap.get(key) || 0;
        pointsMap.set(key, prev + q);
      });
    });

    const rows = Array.from(pointsMap.entries())
      .map(([name, points]) => ({ name, points }))
      .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));

    res.json(rows);
  } catch (err) {
    console.error("❌ Error in /api/restaurant-points:", err);
    res.status(500).json({ error: "Failed to load restaurant leaderboard" });
  }
});

/**
 * POST /cart/checkout
 *
 * Very simple checkout implementation:
 * - receives { items, userEmail, totals } from the frontend Cart.jsx
 * - appends a new order into orders.json
 * - returns { success: true, order }
 *
 * No extra inventory validation here; the frontend already enforces
 * per-meal limits based on availableQuantity.
 */
router.post("/cart/checkout", (req, res) => {
  try {
    const body = req.body || {};
    const items = Array.isArray(body.items) ? body.items : [];
    const userEmail =
      typeof body.userEmail === "string" ? body.userEmail : null;
    const totals = body.totals || null;

    if (items.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Cart is empty. Please add at least one rescue meal.",
      });
    }

    const existingOrders = loadOrders();

    const newOrder = {
      id: `order_${Date.now()}`,
      userEmail,
      items,
      totals,
      timestamp: new Date().toISOString(),
    };

    existingOrders.push(newOrder);
    writeOrders(existingOrders);

    return res.json({
      success: true,
      order: newOrder,
    });
  } catch (err) {
    console.error("Error in /cart/checkout:", err);
    return res.status(500).json({
      success: false,
      error: "An unexpected error occurred during checkout.",
    });
  }
});

module.exports = router;
