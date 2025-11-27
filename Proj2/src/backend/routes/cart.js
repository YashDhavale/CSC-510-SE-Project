// Proj2/src/backend/routes/cart.js
//
// Cart checkout route with simple inventory guard:
// - Prevents a single cart from ordering more units of a meal
//   than the "availableQuantity" that the UI showed.
// - Does NOT change any UI layout or frontend behavior.
// - Orders are still appended to data/orders.json as before.

const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Path to orders JSON file
const ORDERS_PATH = path.join(__dirname, '..', 'data', 'orders.json');

// Helper to safely read JSON file (returns [] if missing / invalid)
function readJsonFileSafe(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    if (!raw.trim()) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    // if it is an object with "orders" field, use that
    if (parsed && Array.isArray(parsed.orders)) {
      return parsed.orders;
    }
    return [];
  } catch (err) {
    console.error('Error reading JSON file:', filePath, err);
    return [];
  }
}

// Helper to safely write JSON file
function writeJsonFileSafe(filePath, data) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing JSON file:', filePath, err);
    throw err;
  }
}

/**
 * POST /cart/checkout
 *
 * Expected body (frontend can send extra fields; we ignore what we don't need):
 * {
 *   items: [
 *     {
 *       restaurant: "Eastside Deli",
 *       meal: {
 *         id: "eastside-sandwich-box",
 *         name: "Surprise Sandwich Rescue Box",
 *         availableQuantity: 3,
 *         ...otherFields
 *       },
 *       quantity: 2
 *     },
 *     ...
 *   ],
 *   userEmail: "user@example.com",
 *   totals: { ... }      // optional: pricing summary
 * }
 *
 * This route will:
 * - Group items by (restaurant, meal.id/name),
 * - Sum requested quantity per group,
 * - Compare against meal.availableQuantity if it is a finite number,
 * - Reject with 400 if any group exceeds its local availableQuantity.
 * - Otherwise append a new order to orders.json and return { success: true, order }
 */
router.post('/checkout', (req, res) => {
  try {
    const body = req.body || {};
    const items = Array.isArray(body.items) ? body.items : [];
    const userEmail = typeof body.userEmail === 'string' ? body.userEmail : null;
    const totals = body.totals || null;

    if (items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Cart is empty. Please add at least one rescue meal.',
      });
    }

    // Group quantities per (restaurant, meal) and track availableQuantity
    const grouped = new Map();

    for (const item of items) {
      if (!item) continue;

      const restaurantName =
        typeof item.restaurant === 'string' ? item.restaurant : 'Unknown restaurant';
      const meal = item.meal || {};
      const mealId = meal.id || meal._id || meal.name || 'unnamed-meal';

      const key = `${restaurantName}::${mealId}`;

      const requestedQty =
        typeof item.quantity === 'number' && Number.isFinite(item.quantity)
          ? item.quantity
          : 1;

      const availableFromMeal =
        meal && typeof meal.availableQuantity === 'number'
          ? meal.availableQuantity
          : null;

      if (!grouped.has(key)) {
        grouped.set(key, {
          restaurantName,
          mealId,
          mealName: meal.name || 'Rescue Meal',
          requested: 0,
          available: availableFromMeal,
        });
      }

      const agg = grouped.get(key);
      agg.requested += requestedQty;

      // If multiple items share the same meal, we keep the smallest availableQuantity
      if (
        availableFromMeal !== null &&
        (agg.available === null || availableFromMeal < agg.available)
      ) {
        agg.available = availableFromMeal;
      }
    }

    // Check for local "overbooking" against availableQuantity seen in the UI
    const conflicts = [];
    for (const agg of grouped.values()) {
      if (
        agg.available !== null &&
        Number.isFinite(agg.available) &&
        agg.requested > agg.available
      ) {
        conflicts.push({
          restaurant: agg.restaurantName,
          mealId: agg.mealId,
          mealName: agg.mealName,
          requested: agg.requested,
          available: agg.available,
        });
      }
    }

    if (conflicts.length > 0) {
      // Reject checkout: user is trying to buy more than the UI said was left
      const first = conflicts[0];
      const message = `Only ${first.available} of "${first.mealName}" left at ${first.restaurant}. You requested ${first.requested}.`;

      return res.status(400).json({
        success: false,
        error: message,
        conflicts,
      });
    }

    // If we reach this point, the cart respects per-meal availableQuantity
    // Load existing orders, append a new one.
    const existingOrders = readJsonFileSafe(ORDERS_PATH);

    const newOrder = {
      id: `order_${Date.now()}`,
      userEmail,
      items,
      totals,
      timestamp: new Date().toISOString(),
    };

    const updatedOrders = [...existingOrders, newOrder];
    writeJsonFileSafe(ORDERS_PATH, updatedOrders);

    return res.json({
      success: true,
      order: newOrder,
    });
  } catch (err) {
    console.error('Error in /cart/checkout:', err);
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred during checkout.',
    });
  }
});

module.exports = router;
