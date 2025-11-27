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
    if (!raw.trim()) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    if (parsed && Array.isArray(parsed.orders)) {
      return parsed.orders;
    }
    return [];
  } catch (err) {
    console.error('Error reading orders.json:', err);
    return [];
  }
}

function writeOrdersSafe(orders) {
  try {
    const dir = path.dirname(ORDERS_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(ORDERS_PATH, JSON.stringify(orders, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing orders.json:', err);
    throw err;
  }
}

// POST /cart/checkout
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

    const existingOrders = readOrdersSafe();

    const newOrder = {
      id: `order_${Date.now()}`,
      userEmail,
      items,
      totals,
      timestamp: new Date().toISOString(),
    };

    existingOrders.push(newOrder);
    writeOrdersSafe(existingOrders);

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
