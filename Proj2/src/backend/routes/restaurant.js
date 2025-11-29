// Proj2/src/backend/routes/restaurant.js
// Restaurant-facing API routes for Tiffin Trails.
// These are read-only views built on top of the same CSV/JSON data as the
// customer dashboard, so that restaurant dashboards never desync from the
// customer browsing experience.
//
// Exposes:
//   GET  /restaurant/menu?restaurant=Name
//   GET  /restaurant/overview?restaurant=Name
//   PATCH /restaurant/order-status

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

const RESTAURANT_META_CSV = path.join(
  CSV_DATA_DIR,
  "Restaurant_Metadata.csv"
);
const RESCUE_MEALS_CSV = path.join(CSV_DATA_DIR, "rescue_meals.csv");
const INVENTORY_JSON = path.join(BACKEND_DATA_DIR, "inventory.json");
const ORDERS_JSON = path.join(BACKEND_DATA_DIR, "orders.json");

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
      resolve([]);
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

function saveOrders(orders) {
  try {
    if (!Array.isArray(orders)) {
      return false;
    }
    fs.writeFileSync(ORDERS_JSON, JSON.stringify(orders, null, 2), "utf8");
    return true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error writing orders.json:", err);
    return false;
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
          pickupWindow: row.pickup_window || null,
          maxPerOrder: safeNumber(row.max_per_order, null),
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

// ---------- PATCH /restaurant/order-status ----------
//
// Allows a restaurant dashboard to update the status for a single order.
// This is a lightweight operational endpoint used by the "Today" view.
//

router.patch("/restaurant/order-status", (req, res) => {
  const body = req.body || {};
  const orderId = String(body.orderId || "").trim();
  const statusRaw = String(body.status || "").trim().toUpperCase();

  const allowed = ["PENDING", "READY", "PICKED_UP", "NO_SHOW"];

  if (!orderId || !allowed.includes(statusRaw)) {
    return res.status(400).json({
      success: false,
      error: 'Both "orderId" and a valid "status" are required.',
    });
  }

  const orders = loadOrders();
  const idx = orders.findIndex((order) => String(order.id) === orderId);

  if (idx === -1) {
    return res.status(404).json({
      success: false,
      error: "Order not found.",
    });
  }

  const updated = {
    ...orders[idx],
    status: statusRaw,
  };

  orders[idx] = updated;

  const ok = saveOrders(orders);

  if (!ok) {
    return res.status(500).json({
      success: false,
      error: "Failed to persist updated order status.",
    });
  }

  return res.json({
    success: true,
    order: updated,
  });
});

// ---------- GET /restaurant/overview ----------
//
// Returns high-level metrics + recent orders for a single restaurant.
//

router.get("/restaurant/overview", (req, res) => {
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
      if (!order || !Array.isArray(order.items)) return;

      // Items that belong to this restaurant
      const itemsForRestaurant = order.items.filter((item) => {
        if (!item) return false;
        if (!item.restaurant) return false;
        return (
          String(item.restaurant || "").trim().toLowerCase() ===
          restaurantName.toLowerCase()
        );
      });

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

      // Simple heuristic: assume each rescued meal prevents ~1 lb of waste.
      estimatedWastePreventedLbs += orderMealCount;

      // For recentOrders we normalise meal field to a displayable string
      const itemsForView = itemsForRestaurant.map((item) => {
        const mealName =
          typeof item.meal === "string"
            ? item.meal
            : item.meal && item.meal.name
            ? item.meal.name
            : "Rescue meal";

        return {
          meal: mealName,
          quantity: safeNumber(item.quantity, 0),
          price: safeNumber(item.price, 0),
        };
      });

      recentOrders.push({
        id: order.id,
        timestamp: order.timestamp,
        userEmail: order.userEmail || null,
        status: order.status || "PENDING",
        pickupPreference: order.pickupPreference || null,
        items: itemsForView,
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
