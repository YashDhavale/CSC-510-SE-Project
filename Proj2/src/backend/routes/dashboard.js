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

// ---------- paths ----------
//
// CSV data for restaurants / meals lives in Proj2/data.
// JSON data for backend (orders, inventory, points) lives in Proj2/src/backend/data.

// __dirname = Proj2/src/backend/routes
// ../../../data => Proj2/data
const CSV_DATA_DIR = path.join(__dirname, "../../../data");
const BACKEND_DATA_DIR = path.join(__dirname, "../data");

const RESTAURANT_META_CSV = path.join(CSV_DATA_DIR, "Restaurant_Metadata.csv");
const RESCUE_MEALS_CSV = path.join(CSV_DATA_DIR, "rescue_meals.csv");
const ORDERS_JSON = path.join(BACKEND_DATA_DIR, "orders.json");
const INVENTORY_JSON = path.join(BACKEND_DATA_DIR, "inventory.json");
const RESTAURANT_POINTS_JSON = path.join(
  BACKEND_DATA_DIR,
  "restaurant_points.json"
);

// ---------- helpers: generic ----------

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
  // Robust CSV loader:
  // - If file missing, resolves to [].
  // - Any stream error resolves to [] instead of crashing the server.
  return new Promise((resolve) => {
    try {
      if (!fs.existsSync(csvPath)) {
        // eslint-disable-next-line no-console
        console.warn(`CSV file not found, returning []: ${csvPath}`);
        return resolve([]);
      }

      const rows = [];
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
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`Unexpected error in loadCsvRows(${csvPath}):`, err);
      resolve([]);
    }
  });
}

function loadOrders() {
  try {
    if (!fs.existsSync(ORDERS_JSON)) {
      return [];
    }
    const raw = fs.readFileSync(ORDERS_JSON, "utf8");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
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
    console.error("Error loading inventory.json:", err);
    return {};
  }
}

function writeInventory(inventory) {
  try {
    fs.writeFileSync(
      INVENTORY_JSON,
      JSON.stringify(inventory, null, 2),
      "utf8"
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error writing inventory.json:", err);
  }
}

// ---------- GET /dashboard/restaurants-with-meals ----------
//
// Builds restaurant objects from Restaurant_Metadata.csv,
// then attaches rescue meals from rescue_meals.csv,
// and adjusts availableQuantity using inventory.json (sold counts).

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
        avgOrders >= 300 ? 240 : avgOrders >= 200 ? 180 : avgOrders >= 100 ? 120 : 60;

      const zip = row.zip_code || "";
      const address = zip ? `Raleigh, NC ${zip}` : "Raleigh, NC";
      const hours = "Today · 11:00 AM – 8:00 PM";

      restaurantsByName.set(name, {
        id,
        name,
        cuisine,
        rating,
        numReviews,
        address,
        hours,
        menus: [],
      });
    });

    // 2) Attach rescue meals from rescue_meals.csv
    mealRows.forEach((row) => {
      const restaurantName = (row.restaurant || "").trim();
      if (!restaurantName) return;

      const restaurant = restaurantsByName.get(restaurantName);
      if (!restaurant) return;

      const mealName = row.meal_name || row.name || "Rescue Meal Box";
      const baseQty = safeNumber(row.quantity, 0);

      const mealId = slugify(`${restaurantName}-${mealName}`);

      const invEntry = inventory[mealId];
      const soldCount =
        invEntry && typeof invEntry.sold === "number" ? invEntry.sold : 0;

      const availableRaw = baseQty - soldCount;
      const availableQuantity = availableRaw > 0 ? availableRaw : 0;

      const originalPrice = safeNumber(row.original_price, 12.0);
      const rescuePrice = safeNumber(row.rescue_price, 6.0);

      const pickupWindow = row.expires_in
        ? `Pickup within ${row.expires_in}`
        : "Today, 5–8 PM";

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
// Aggregates community-level stats from orders.json.

router.get("/dashboard/community-stats", (req, res) => {
  try {
    const orders = loadOrders();

    const activeUsersSet = new Set();
    let totalMealsRescued = 0;
    let totalWastePreventedLbs = 0;

    orders.forEach((order) => {
      if (!order || !Array.isArray(order.items)) return;

      if (order.userEmail) {
        activeUsersSet.add(order.userEmail);
      }

      order.items.forEach((item) => {
        if (!item || item.isRescueMeal === false) return;
        const qty = safeNumber(item.quantity, 0);
        totalMealsRescued += qty;
        totalWastePreventedLbs += qty * 2.5; // simple heuristic
      });
    });

    const wastePreventedTons = totalWastePreventedLbs / 2000;

    return res.json({
      activeUsers: activeUsersSet.size,
      mealsRescued: totalMealsRescued,
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

// ---------- GET /dashboard/user-impact ----------
//
// Returns per-user impact summary, used by the "My Impact" panel in the dashboard.

router.get("/dashboard/user-impact", (req, res) => {
  try {
    const emailRaw = (req.query.email || "").toString();
    const email = emailRaw.toLowerCase().trim();

    if (!email) {
      return res.status(400).json({
        error: "Missing email parameter.",
      });
    }

    const allOrders = loadOrders();

    const orders = allOrders.filter((o) => {
      if (!o || !o.userEmail) return false;
      return o.userEmail.toString().toLowerCase().trim() === email;
    });

    let mealsOrdered = 0;
    let moneySaved = 0;
    let foodWastePrevented = 0;
    let carbonReduced = 0;
    const restaurantSet = new Set();

    orders.forEach((order) => {
      const items = Array.isArray(order.items) ? order.items : [];

      items.forEach((item) => {
        if (!item || item.isRescueMeal === false) return;

        const qty = safeNumber(item.quantity, 0);
        mealsOrdered += qty;

        const restaurantName =
          item.restaurant ||
          (item.meal &&
            item.meal.restaurant &&
            item.meal.restaurant.name) ||
          "Unknown";
        restaurantSet.add(restaurantName);
      });

      if (order.totals && typeof order.totals.totalSavings !== "undefined") {
        moneySaved += safeNumber(order.totals.totalSavings, 0);
      }
    });

    foodWastePrevented = mealsOrdered * 2.5;
    carbonReduced = mealsOrdered * 2.0;

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

// ---------- GET /api/restaurant-points (leaderboard) ----------
//
// Simple wrapper around backend/data/restaurant_points.json.
// Frontend LeaderboardPanel supports:
//   - Object map: { "Eastside Deli": 60, ... }
//   - Array: [{ name: "Eastside Deli", points: 60 }, ...]
// We return the object map here.

router.get("/api/restaurant-points", (req, res) => {
  try {
    if (!fs.existsSync(RESTAURANT_POINTS_JSON)) {
      return res.json({});
    }

    const raw = fs.readFileSync(RESTAURANT_POINTS_JSON, "utf8");
    if (!raw) {
      return res.json({});
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return res.json({});
    }

    return res.json(parsed);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error in /api/restaurant-points:", err);
    return res.status(500).json({
      error: "Failed to load restaurant points.",
    });
  }
});

module.exports = router;
