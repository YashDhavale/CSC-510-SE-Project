// Proj2/src/backend/routes/restaurant.js
// Restaurant-facing API routes for Tiffin Trails.
// These are read-only views built on top of the same CSV/JSON data as the
// customer dashboard, so that restaurant dashboards never desync from the
// customer browsing experience.
//
// Exposes:
//   GET /restaurant/menu?restaurant=Name
//   GET /restaurant/overview?restaurant=Name

const express = require("express");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const router = express.Router();

// CSV data lives in Proj2/data
// JSON data for backend lives in Proj2/src/backend/data
const CSV_DATA_DIR = path.join(__dirname, "../../../data");
const BACKEND_DATA_DIR = path.join(__dirname, "../data");

const RESTAURANT_META_CSV = path.join(CSV_DATA_DIR, "Restaurant_Metadata.csv");
const RESCUE_MEALS_CSV = path.join(CSV_DATA_DIR, "rescue_meals.csv");
const ORDERS_JSON = path.join(BACKEND_DATA_DIR, "orders.json");
const INVENTORY_JSON = path.join(BACKEND_DATA_DIR, "inventory.json");

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

// ---------- GET /restaurant/menu ----------
//
// Returns the list of rescue meals for a single restaurant, including
// real-time availability based on inventory.json and the base quantity
// defined in rescue_meals.csv.
//

router.get("/restaurant/menu", async (req, res) => {
  const restaurantName = (req.query.restaurant || "").trim();

  if (!restaurantName) {
    return res.status(400).json({
      error: 'Query parameter "restaurant" is required.',
    });
  }

  try {
    const [metaRows, mealRows] = await Promise.all([
      loadCsvRows(RESTAURANT_META_CSV),
      loadCsvRows(RESCUE_MEALS_CSV),
    ]);
    const inventory = loadInventory();

    const matchingMeta = metaRows.find(
      (row) =>
        String(row.restaurant || "").trim().toLowerCase() ===
        restaurantName.toLowerCase()
    );

    const meals = mealRows
      .filter(
        (row) =>
          String(row.restaurant || "").trim().toLowerCase() ===
          restaurantName.toLowerCase()
      )
      .map((row) => {
        const mealName = row.meal_name || "";
        const mealId = slugify(`${restaurantName}-${mealName}`);

        const baseQuantity = safeNumber(row.quantity, 0);
        const invEntry = inventory[mealId] || {};
        const sold = safeNumber(invEntry.sold, 0);
        const availableQuantity = Math.max(baseQuantity - sold, 0);
        const status = availableQuantity > 0 ? "AVAILABLE" : "SOLD_OUT";

        return {
          id: mealId,
          restaurant: restaurantName,
          mealName,
          originalPrice: safeNumber(row.original_price, null),
          rescuePrice: safeNumber(row.rescue_price, null),
          baseQuantity,
          sold,
          availableQuantity,
          status,
          expiresIn: row.expires_in || null,
        };
      });

    return res.json({
      restaurant: matchingMeta
        ? {
            name: matchingMeta.restaurant,
            cuisine: matchingMeta.cuisine || null,
            capacity: safeNumber(matchingMeta.capacity, null),
            seatingType: matchingMeta.seating_type || null,
            zipCode: matchingMeta.zip_code || null,
          }
        : {
            name: restaurantName,
          },
      meals,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error in /restaurant/menu:", err);
    return res.status(500).json({
      error: "Failed to load restaurant menu.",
    });
  }
});

// ---------- GET /restaurant/overview ----------
//
// Aggregates per-restaurant metrics and recent orders.
//

router.get("/restaurant/overview", async (req, res) => {
  const restaurantName = (req.query.restaurant || "").trim();

  if (!restaurantName) {
    return res.status(400).json({
      error: 'Query parameter "restaurant" is required.',
    });
  }

  try {
    const orders = loadOrders();

    let totalOrders = 0;
    let totalMealsRescued = 0;
    let totalRevenue = 0;
    let estimatedWastePreventedLbs = 0;

    const recentOrders = [];

    orders.forEach((order) => {
      if (!order || !Array.isArray(order.items)) {
        return;
      }

      const itemsForRestaurant = order.items.filter(
        (item) =>
          item &&
          String(item.restaurant || "").trim().toLowerCase() ===
            restaurantName.toLowerCase() &&
          item.isRescueMeal !== false
      );

      if (itemsForRestaurant.length === 0) {
        return;
      }

      totalOrders += 1;

      let orderMealCount = 0;
      let orderRevenue = 0;

      itemsForRestaurant.forEach((item) => {
        const qty = safeNumber(item.quantity, 0);
        const price = safeNumber(item.price, 0);
        orderMealCount += qty;
        orderRevenue += qty * price;
      });

      totalMealsRescued += orderMealCount;
      totalRevenue += orderRevenue;
      // Same heuristic as community stats: ~2.5 lbs per meal
      estimatedWastePreventedLbs += orderMealCount * 2.5;

      recentOrders.push({
        id: order.id,
        timestamp: order.timestamp,
        userEmail: order.userEmail || null,
        items: itemsForRestaurant.map((item) => ({
          meal: item.meal,
          quantity: safeNumber(item.quantity, 0),
          price: safeNumber(item.price, 0),
        })),
      });
    });

    // Sort by timestamp desc and keep latest 10
    recentOrders.sort((a, b) => {
      const ta = Date.parse(a.timestamp || "") || 0;
      const tb = Date.parse(b.timestamp || "") || 0;
      return tb - ta;
    });

    const limitedRecentOrders = recentOrders.slice(0, 10);

    return res.json({
      restaurant: restaurantName,
      metrics: {
        totalOrders,
        totalMealsRescued,
        totalRevenue,
        estimatedWastePreventedLbs,
      },
      recentOrders: limitedRecentOrders,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error in /restaurant/overview:", err);
    return res.status(500).json({
      error: "Failed to compute restaurant overview.",
    });
  }
});

module.exports = router;
