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
// per-restaurant rescue meal listings plus some simple stats for the
// dashboard UI.

const express = require("express");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const router = express.Router();

// ---------- paths ----------

const DATA_DIR = path.join(__dirname, "../data");

const RESTAURANT_META_CSV = path.join(
  DATA_DIR,
  "Restaurant_Metadata.csv"
);
const RESCUE_MEALS_CSV = path.join(DATA_DIR, "rescue_meals.csv");
const ORDERS_JSON = path.join(DATA_DIR, "orders.json");

// ---------- helpers ----------

function loadCsvRows(csvPath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on("data", (row) => {
        rows.push(row);
      })
      .on("end", () => resolve(rows))
      .on("error", (err) => reject(err));
  });
}

function safeNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function loadOrders() {
  try {
    if (!fs.existsSync(ORDERS_JSON)) {
      return [];
    }
    const raw = fs.readFileSync(ORDERS_JSON, "utf8");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error loading orders.json:", err);
    return [];
  }
}

function writeOrders(orders) {
  try {
    fs.writeFileSync(ORDERS_JSON, JSON.stringify(orders, null, 2), "utf8");
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error writing orders.json:", err);
  }
}

// ---------- restaurants-with-meals ----------

router.get("/dashboard/restaurants-with-meals", async (req, res) => {
  try {
    const [metaRows, mealRows] = await Promise.all([
      loadCsvRows(RESTAURANT_META_CSV),
      loadCsvRows(RESCUE_MEALS_CSV),
    ]);

    const byId = new Map();

    metaRows.forEach((row) => {
      const id = row.id || row.ID || row.restaurant_id || row.RestaurantID;
      if (!id) return;

      byId.set(id, {
        id,
        name: row.name || row.restaurant_name || "",
        address: row.address || row.Address || "",
        cuisine: row.cuisine || row.Cuisine || "",
        rating: safeNumber(row.rating, 4.5),
        numReviews: safeNumber(row.numReviews, 0),
        hours: row.hours || row.Hours || "",
        img: row.image || row.Image || row.img || "",
        menus: [],
      });
    });

    mealRows.forEach((row) => {
      const restaurantId =
        row.restaurant_id || row.RestaurantID || row.id || row.ID;
      if (!restaurantId) return;

      const restaurant = byId.get(restaurantId);
      if (!restaurant) return;

      const availableQuantity = safeNumber(row.available_quantity, 0);
      const maxPerOrder = safeNumber(row.max_per_order, availableQuantity);

      const rescuePrice =
        typeof row.rescue_price !== "undefined"
          ? safeNumber(row.rescue_price, 5.0)
          : 5.0;
      const originalPrice =
        typeof row.original_price !== "undefined"
          ? safeNumber(row.original_price, 12.0)
          : 12.0;

      restaurant.menus.push({
        id: row.meal_id || row.id || `${restaurantId}-${row.meal_name || ""}`,
        name: row.meal_name || row.name || "Rescue Meal Box",
        description:
          row.description ||
          "Chef-selected surplus meal from today.",
        pickupWindow: row.pickup_window || "Today, 5–8 PM",
        expiresIn: row.expires_in || "",
        rescuePrice,
        originalPrice,
        availableQuantity,
        maxPerOrder:
          maxPerOrder > 0 ? maxPerOrder : availableQuantity || 1,
        isRescueMeal: true,
      });
    });

    const results = Array.from(byId.values());
    return res.json(results);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error in /dashboard/restaurants-with-meals:", err);
    return res.status(500).json({
      error: "Failed to load restaurants with meals.",
    });
  }
});

// ---------- community-stats ----------

router.get("/dashboard/community-stats", (req, res) => {
  try {
    const orders = loadOrders();

    let activeUsersSet = new Set();
    let totalMealsRescued = 0;
    let totalWastePreventedLbs = 0;

    orders.forEach((order) => {
      if (!order || !Array.isArray(order.items)) return;

      if (order.userEmail) {
        activeUsersSet.add(order.userEmail);
      }

      order.items.forEach((item) => {
        const qty = safeNumber(item.quantity, 0);
        totalMealsRescued += qty;
        totalWastePreventedLbs += qty * 2.5;
      });
    });

    const mealsRescued = totalMealsRescued;
    const wastePreventedTons = totalWastePreventedLbs / 2000;

    return res.json({
      activeUsers: activeUsersSet.size,
      mealsRescued,
      wastePreventedTons: Number(wastePreventedTons.toFixed(2)),
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error in /dashboard/community-stats:", err);
    return res.status(500).json({
      error: "Failed to load community stats.",
    });
  }
});

// ---------- user-impact ----------

router.get("/dashboard/user-impact", (req, res) => {
  try {
    const email = req.query.email;
    if (!email) {
      return res.status(400).json({
        error: "Missing email parameter.",
      });
    }

    const orders = loadOrders().filter(
      (o) => o && o.userEmail === email
    );

    let mealsOrdered = 0;
    let moneySaved = 0;
    let foodWastePrevented = 0;
    let carbonReduced = 0;
    const restaurantSet = new Set();

    orders.forEach((order) => {
      if (!order || !Array.isArray(order.items)) return;

      order.items.forEach((item) => {
        const qty = safeNumber(item.quantity, 0);
        mealsOrdered += qty;
        restaurantSet.add(item.restaurant || "Unknown");

        const pricePaid = safeNumber(item.price, 0) * qty;
        const original =
          safeNumber(item.originalPrice, pricePaid) * qty;
        moneySaved += Math.max(original - pricePaid, 0);

        foodWastePrevented += qty * 2.5;
        carbonReduced += qty * 2.0;
      });
    });

    let impactLevel = "New Rescuer";
    if (mealsOrdered >= 20) impactLevel = "Impact Hero";
    else if (mealsOrdered >= 10) impactLevel = "Rescue Champion";
    else if (mealsOrdered >= 5) impactLevel = "Rising Rescuer";

    return res.json({
      mealsOrdered,
      moneySaved: Number(moneySaved.toFixed(2)),
      foodWastePrevented: Number(foodWastePrevented.toFixed(1)),
      carbonReduced: Number(carbonReduced.toFixed(1)),
      localRestaurantsSupported: restaurantSet.size,
      impactLevel,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error in /dashboard/user-impact:", err);
    return res.status(500).json({
      error: "Failed to load user impact.",
    });
  }
});

// ---------- restaurant-points (simple lat/lng demo) ----------

router.get("/api/restaurant-points", (req, res) => {
  try {
    const metaRows = fs.existsSync(RESTAURANT_META_CSV)
      ? fs.readFileSync(RESTAURANT_META_CSV, "utf8")
      : "";

    if (!metaRows) {
      return res.json([]);
    }

    const points = [];
    fs.createReadStream(RESTAURANT_META_CSV)
      .pipe(csv())
      .on("data", (row) => {
        const lat = safeNumber(row.lat, null);
        const lng = safeNumber(row.lng, null);
        if (lat === null || lng === null) return;

        points.push({
          id: row.id || row.ID || row.restaurant_id || row.RestaurantID,
          name: row.name || row.restaurant_name || "",
          lat,
          lng,
        });
      })
      .on("end", () => res.json(points))
      .on("error", (err) => {
        // eslint-disable-next-line no-console
        console.error("Error reading Restaurant_Metadata.csv:", err);
        res.status(500).json({
          error: "Failed to load restaurant points.",
        });
      });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error in /api/restaurant-points:", err);
    return res.status(500).json({
      error: "Failed to load restaurant points.",
    });
  }
});

// ---------- cart checkout (mirror of routes/cart.js) ----------

router.post("/cart/checkout", (req, res) => {
  try {
    const body = req.body || {};
    const items = Array.isArray(body.items) ? body.items : [];
    const userEmail =
      typeof body.userEmail === "string" ? body.userEmail : null;
    const totals = body.totals || null;
    const pickupPreference =
      typeof body.pickupPreference === "string" ? body.pickupPreference : null;

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
      pickupPreference,
      timestamp: new Date().toISOString(),
    };

    existingOrders.push(newOrder);
    writeOrders(existingOrders);

    return res.json({
      success: true,
      order: newOrder,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error in /cart/checkout dashboard route:", err);
    return res.status(500).json({
      success: false,
      error: "An unexpected error occurred during checkout.",
    });
  }
});

module.exports = router;
