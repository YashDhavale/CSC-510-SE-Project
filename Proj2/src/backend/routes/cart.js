// Proj2/src/backend/routes/cart.js
const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const restaurantPointsFile = path.join(__dirname, "../data/restaurant_points.json");
const ordersFile = path.join(__dirname, "../data/orders.json");

// Initialize restaurant points if file doesn't exist
if (!fs.existsSync(restaurantPointsFile)) {
  fs.mkdirSync(path.dirname(restaurantPointsFile), { recursive: true });
  fs.writeFileSync(restaurantPointsFile, JSON.stringify({}, null, 2));
}

// Initialize orders file if it doesn't exist
if (!fs.existsSync(ordersFile)) {
  fs.mkdirSync(path.dirname(ordersFile), { recursive: true });
  fs.writeFileSync(ordersFile, JSON.stringify([], null, 2));
}

// Place order endpoint
router.post("/api/orders", (req, res) => {
  try {
    const { items, totals, userEmail } = req.body || {};

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid order data" });
    }

    // Load restaurant points
    let restaurantPoints = {};
    if (fs.existsSync(restaurantPointsFile)) {
      restaurantPoints = JSON.parse(fs.readFileSync(restaurantPointsFile, "utf8"));
    }

    // Calculate points
    let pointsEarned = {};
    items.forEach((item) => {
      if (item.restaurant) {
        const points = item.isRescueMeal ? 10 : 5;
        if (!restaurantPoints[item.restaurant]) {
          restaurantPoints[item.restaurant] = 0;
        }
        restaurantPoints[item.restaurant] += points;

        if (!pointsEarned[item.restaurant]) {
          pointsEarned[item.restaurant] = 0;
        }
        pointsEarned[item.restaurant] += points;
      }
    });

    // Save updated restaurant points
    fs.writeFileSync(restaurantPointsFile, JSON.stringify(restaurantPoints, null, 2));

    // Create order record
    const order = {
      id: `ORD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      items: items,
      totals: totals,
      pointsEarned: pointsEarned,
      // Link order to the logged-in user (if provided)
      userEmail: typeof userEmail === "string" ? userEmail : null,
    };

    // Load and save orders
    let orders = [];
    if (fs.existsSync(ordersFile)) {
      orders = JSON.parse(fs.readFileSync(ordersFile, "utf8"));
    }
    orders.push(order);
    fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));

    res.json({
      success: true,
      order: order,
      message: "Order placed successfully!",
    });
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get restaurant points
router.get("/api/restaurant-points", (req, res) => {
  try {
    if (fs.existsSync(restaurantPointsFile)) {
      const points = JSON.parse(fs.readFileSync(restaurantPointsFile, "utf8"));
      res.json({ success: true, points });
    } else {
      res.json({ success: true, points: {} });
    }
  } catch (error) {
    console.error("Error reading restaurant points:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get orders
router.get("/api/orders", (req, res) => {
  try {
    if (fs.existsSync(ordersFile)) {
      const orders = JSON.parse(fs.readFileSync(ordersFile, "utf8"));
      res.json({ success: true, orders });
    } else {
      res.json({ success: true, orders: [] });
    }
  } catch (error) {
    console.error("Error reading orders:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
