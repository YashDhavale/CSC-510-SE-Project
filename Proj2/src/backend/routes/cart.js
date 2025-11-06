const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const restaurantPointsFile = path.join(__dirname, "../data/restaurant_points.json");
const ordersFile = path.join(__dirname, "../data/orders.json");

// Initialize restaurant points if file doesn't exist
if (!fs.existsSync(restaurantPointsFile)) {
  fs.mkdirSync(path.dirname(restaurantPointsFile), { recursive: true });
  const defaultPoints = {
    "Eastside Deli": 0,
    "Oak Street Bistro": 0,
    "GreenBite Cafe": 0,
    "Triangle BBQ Co.": 0,
    "Village Noodle Bar": 0,
    "Southside Pizza Lab": 0,
    "Hillside Kitchen": 0,
    "Roosevelt Oyster House": 0,
    "Capital City Tacos": 0,
    "UrbanEats": 0
  };
  fs.writeFileSync(restaurantPointsFile, JSON.stringify(defaultPoints, null, 2));
}

// Initialize orders file if it doesn't exist
if (!fs.existsSync(ordersFile)) {
  fs.mkdirSync(path.dirname(ordersFile), { recursive: true });
  fs.writeFileSync(ordersFile, JSON.stringify([], null, 2));
}

// Place order endpoint
router.post("/api/orders", (req, res) => {
  try {
    const { items, totals } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid order data" });
    }

    // Load restaurant points
    let restaurantPoints = {};
    if (fs.existsSync(restaurantPointsFile)) {
      restaurantPoints = JSON.parse(fs.readFileSync(restaurantPointsFile, "utf8"));
    }

    // Calculate points for restaurants with rescue meals
    const pointsEarned = {};
    items.forEach(item => {
      if (item.isRescueMeal && item.restaurant) {
        // Each rescue meal gives 10 points to the restaurant
        const points = item.quantity * 10;
        if (!pointsEarned[item.restaurant]) {
          pointsEarned[item.restaurant] = 0;
        }
        pointsEarned[item.restaurant] += points;
        
        // Update restaurant points
        if (!restaurantPoints[item.restaurant]) {
          restaurantPoints[item.restaurant] = 0;
        }
        restaurantPoints[item.restaurant] += points;
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
      pointsEarned: pointsEarned
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
      message: "Order placed successfully!"
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

