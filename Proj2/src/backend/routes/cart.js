// Proj2/src/backend/routes/cart.js
// Simple checkout route for Tiffin Trails.
// - Accepts the current cart payload from frontend.
// - Appends a new order entry into data/orders.json.
// - Does NOT do extra inventory validation (the frontend already
//   enforces per-meal limits based on availableQuantity).

const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const ORDERS_PATH = path.join(__dirname, '../data', 'orders.json');

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

function writeOrdersSafe(orders) {
  try {
    fs.writeFileSync(ORDERS_PATH, JSON.stringify(orders, null, 2), 'utf8');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error writing orders.json:', err);
  }
}

// POST /cart/checkout
router.post('/checkout', (req, res) => {
  try {
    const body = req.body || {};
    const items = Array.isArray(body.items) ? body.items : [];
    const userEmail = typeof body.userEmail === 'string' ? body.userEmail : null;
    const totals = body.totals || null;
    const pickupPreference = typeof body.pickupPreference === 'string' ? body.pickupPreference : null;

    if (items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Cart is empty. Please add at least one rescue meal.',
      });
    }

    const existingOrders = readOrdersSafe();

    const newOrder = {
      id: `order_${Date.now()}`,
      userEmail,
      items,
      totals,
      pickupPreference,
      timestamp: new Date().toISOString(),
    };

    existingOrders.push(newOrder);
    writeOrdersSafe(existingOrders);

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
