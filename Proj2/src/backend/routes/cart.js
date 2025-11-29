// Proj2/src/backend/routes/cart.js
// Simple checkout route for Tiffin Trails.
// - Accepts the current cart payload from frontend.
// - Appends a new order entry into data/orders.json.
// - Performs a server-side inventory check so that we never
//   oversell beyond the base quantity defined for each rescue meal.

const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const DATA_DIR = path.join(__dirname, "../data");
const ORDERS_PATH = path.join(DATA_DIR, "orders.json");
const INVENTORY_PATH = path.join(DATA_DIR, "inventory.json");

// ---------- helpers ----------

function safeNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function readJsonFileSafe(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) {
      return fallback;
    }
    const raw = fs.readFileSync(filePath, "utf8");
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (parsed === null || typeof parsed !== "object") {
      return fallback;
    }
    return parsed;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`Error reading ${filePath}:`, err);
    return fallback;
  }
}

function writeJsonFileSafe(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`Error writing ${filePath}:`, err);
  }
}

function readOrdersSafe() {
  const data = readJsonFileSafe(ORDERS_PATH, []);
  return Array.isArray(data) ? data : [];
}

function writeOrdersSafe(orders) {
  if (!Array.isArray(orders)) return;
  writeJsonFileSafe(ORDERS_PATH, orders);
}

function readInventorySafe() {
  const data = readJsonFileSafe(INVENTORY_PATH, {});
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return {};
  }
  return data;
}

function writeInventorySafe(inventory) {
  if (!inventory || typeof inventory !== "object" || Array.isArray(inventory)) {
    return;
  }
  writeJsonFileSafe(INVENTORY_PATH, inventory);
}

// ---------- POST /checkout ----------
//
// Expects a body of shape:
// {
//   cart: [{ restaurant, meal, quantity }, ...],
//   userEmail: "user@example.com" | null,
//   totals: { rescueMealCount, subtotal, youSave },
//   pickupPreference: "any" | "lunch" | "dinner" | ...
// }
//
// This route is intentionally tolerant:
// - If req.body 是字串，會先 JSON.parse 一次再處理
// - 如果後端 middleware 沒有正確 parse JSON，也能正常運作
//

router.post("/checkout", (req, res) => {
  try {
    let body = req.body ?? {};

    // Some setups may deliver raw string body even with JSON header.
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch (parseErr) {
        // eslint-disable-next-line no-console
        console.error("Failed to parse JSON body for /checkout:", parseErr);
        body = {};
      }
    }

    if (!body || typeof body !== "object") {
      body = {};
    }

    let cart = [];

    if (Array.isArray(body.cart)) {
      cart = body.cart;
    } else if (Array.isArray(body.items)) {
      // Fallback: some older clients might send `items` instead of `cart`
      cart = body.items;
    } else if (Array.isArray(body)) {
      // Extreme fallback: body itself is the cart
      cart = body;
    }

    if (!cart.length) {
      return res.status(400).json({
        success: false,
        error: "Cart is empty. Please add at least one rescue meal.",
      });
    }

    const userEmail =
      typeof body.userEmail === "string" && body.userEmail.trim()
        ? body.userEmail.trim()
        : null;
    const totals = body.totals || null;
    const pickupPreference =
      typeof body.pickupPreference === "string" && body.pickupPreference.trim()
        ? body.pickupPreference.trim()
        : null;

    // Normalise items
    const items = cart.map((item) => {
      const meal = item.meal || {};
      const quantity = safeNumber(item.quantity, 0);

      const price =
        typeof meal.rescuePrice === "number" && Number.isFinite(meal.rescuePrice)
          ? meal.rescuePrice
          : typeof meal.price === "number" && Number.isFinite(meal.price)
          ? meal.price
          : 0;

      return {
        restaurant: item.restaurant || null,
        meal,
        quantity,
        price,
        isRescueMeal:
          meal && meal.isRescueMeal !== false
            ? true
            : false,
      };
    });

    const nonZeroItems = items.filter((it) => safeNumber(it.quantity, 0) > 0);
    if (!nonZeroItems.length) {
      return res.status(400).json({
        success: false,
        error: "Cart is empty. Please add at least one rescue meal.",
      });
    }

    const inventory = readInventorySafe();

    // ----- inventory validation -----
    const inventoryErrors = [];

    nonZeroItems.forEach((item) => {
      const meal = item.meal || {};
      const mealId = meal.id;
      const qty = safeNumber(item.quantity, 0);

      if (!mealId || qty <= 0) return;

      const baseQty =
        typeof meal.quantity === "number" && Number.isFinite(meal.quantity)
          ? meal.quantity
          : typeof meal.baseQuantity === "number" &&
            Number.isFinite(meal.baseQuantity)
          ? meal.baseQuantity
          : null;

      const existingEntry =
        mealId in inventory && inventory[mealId] && typeof inventory[mealId] === "object"
          ? inventory[mealId]
          : {};
      const soldSoFar =
        typeof existingEntry.sold === "number" && Number.isFinite(existingEntry.sold)
          ? existingEntry.sold
          : 0;

      if (baseQty !== null) {
        const available = baseQty - soldSoFar;
        if (available <= 0 || qty > available) {
          inventoryErrors.push({
            mealId,
            mealName: meal.name || "Rescue meal",
            requested: qty,
            available: available > 0 ? available : 0,
          });
        }
      }
    });

    if (inventoryErrors.length > 0) {
      return res.status(409).json({
        success: false,
        error: "Some items are no longer available in the requested quantity.",
        inventoryErrors,
      });
    }

    // ----- apply inventory change -----
    nonZeroItems.forEach((item) => {
      const meal = item.meal || {};
      const mealId = meal.id;
      const qty = safeNumber(item.quantity, 0);

      if (!mealId || qty <= 0) return;

      const existingEntry =
        mealId in inventory && inventory[mealId] && typeof inventory[mealId] === "object"
          ? inventory[mealId]
          : {};
      const soldSoFar =
        typeof existingEntry.sold === "number" && Number.isFinite(existingEntry.sold)
          ? existingEntry.sold
          : 0;

      inventory[mealId] = {
        ...existingEntry,
        sold: soldSoFar + qty,
      };
    });

    // ----- persist order -----
    const existingOrders = readOrdersSafe();

    const newOrder = {
      id: `order_${Date.now()}`,
      userEmail,
      items: nonZeroItems,
      totals,
      pickupPreference,
      timestamp: new Date().toISOString(),
    };

    existingOrders.push(newOrder);
    writeOrdersSafe(existingOrders);
    writeInventorySafe(inventory);

    return res.json({
      success: true,
      order: newOrder,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error in /checkout:", err);
    return res.status(500).json({
      success: false,
      error: "An unexpected error occurred during checkout.",
    });
  }
});

module.exports = router;
