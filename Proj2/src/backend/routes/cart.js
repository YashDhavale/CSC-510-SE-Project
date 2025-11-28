// Proj2/src/backend/routes/cart.js
// Simple checkout route for Tiffin Trails.
// - Accepts the current cart payload from frontend.
// - Appends a new order entry into data/orders.json.
// - Performs a server-side inventory check so that we never
//   oversell beyond the base quantity defined for each rescue meal.

const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const ORDERS_PATH = path.join(__dirname, '../data', 'orders.json');
const INVENTORY_PATH = path.join(__dirname, '../data', 'inventory.json');

function readOrdersSafe() {
  try {
    if (!fs.existsSync(ORDERS_PATH)) {
      return [];
    }
    const raw = fs.readFileSync(ORDERS_PATH, 'utf8');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error reading orders.json:', err);
    return [];
  }
}

function readInventorySafe() {
  try {
    if (!fs.existsSync(INVENTORY_PATH)) {
      return {};
    }
    const raw = fs.readFileSync(INVENTORY_PATH, 'utf8');
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed;
    }
    return {};
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error reading inventory.json:', err);
    return {};
  }
}

function writeInventorySafe(inventory) {
  try {
    fs.writeFileSync(
      INVENTORY_PATH,
      JSON.stringify(inventory, null, 2),
      'utf8'
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error writing inventory.json:', err);
  }
}

function writeOrdersSafe(orders) {
  try {
    fs.writeFileSync(ORDERS_PATH, JSON.stringify(orders, null, 2), 'utf8');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error writing orders.json:', err);
  }
}

// POST /checkout
router.post('/checkout', (req, res) => {
  try {
    const body = req.body || {};
    const items = Array.isArray(body.items) ? body.items : [];
    const userEmail = typeof body.userEmail === 'string' ? body.userEmail : null;
    const totals = body.totals || null;
    const pickupPreference =
      typeof body.pickupPreference === 'string' ? body.pickupPreference : null;

    if (items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Cart is empty. Please add at least one rescue meal.',
      });
    }

    // Load current inventory snapshot
    const inventory = readInventorySafe();

    // Normalize quantities once so both validation and persistence use the same values
    const normalizedItems = items.map((item) => {
      const quantity = Number(item.quantity) || 0;
      return {
        ...item,
        quantity,
      };
    });

    // Server-side guard: ensure requested quantity does not exceed remaining inventory.
    // We use the meal.quantity field (base quantity for the day) minus the
    // existing inventory.sold count to compute remaining availability.
    const inventoryErrors = [];

    normalizedItems.forEach((item) => {
      const meal = item.meal || {};
      const mealId = meal.id;
      const quantity = Number(item.quantity) || 0;

      if (!mealId || quantity <= 0) {
        return;
      }

      const baseQty =
        typeof meal.quantity === 'number' && Number.isFinite(meal.quantity)
          ? meal.quantity
          : null;

      const existingEntry =
        inventory && Object.prototype.hasOwnProperty.call(inventory, mealId)
          ? inventory[mealId]
          : {};
      const soldSoFar =
        existingEntry && typeof existingEntry.sold === 'number'
          ? existingEntry.sold
          : 0;

      if (baseQty !== null) {
        const available = baseQty - soldSoFar;
        if (available <= 0 || quantity > available) {
          inventoryErrors.push({
            mealId,
            mealName: meal.name || 'Rescue meal',
            requested: quantity,
            available: available > 0 ? available : 0,
          });
        }
      }
    });

    if (inventoryErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error:
          'One or more rescue meals are no longer available in the requested quantity.',
        inventoryErrors,
      });
    }

    // At this point the requested quantities are valid, so we can safely
    // increment the sold counters in inventory.json.
    normalizedItems.forEach((item) => {
      const meal = item.meal || {};
      const mealId = meal.id;
      const quantity = Number(item.quantity) || 0;

      if (!mealId || quantity <= 0) {
        return;
      }

      const existingEntry =
        inventory && Object.prototype.hasOwnProperty.call(inventory, mealId)
          ? inventory[mealId]
          : {};
      const soldSoFar =
        existingEntry && typeof existingEntry.sold === 'number'
          ? existingEntry.sold
          : 0;

      inventory[mealId] = {
        ...existingEntry,
        sold: soldSoFar + quantity,
      };
    });

    const existingOrders = readOrdersSafe();

    const newOrder = {
      id: `order_${Date.now()}`,
      userEmail,
      items: normalizedItems,
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
    console.error('Error in /cart/checkout:', err);
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred during checkout.',
    });
  }
});

module.exports = router;
