const express = require("express");
const path = require("path");
const fs = require("fs");
const csv = require("csv-parser");

const router = express.Router();

const dataPath = path.join(__dirname, "../../../data");
const restaurantFile = path.join(dataPath, "Restaurant_Metadata.csv");
const efficiencyFile = path.join(dataPath, "vendor_efficiency_scores.csv");
const deliveryMetricsFile = path.join(dataPath, "vendor_delivery_metrics.csv");
const rescueMealsFile = path.join(dataPath, "rescue_meals.csv");
const feedbackFile = path.join(dataPath, "Customer_Feedback.csv");
const wasteFile = path.join(dataPath, "Raleigh_Food_Waste__1-week_sample_.csv");
const deliveryLogsFile = path.join(dataPath, "Delivery_Logs.csv");
const ordersFile = path.join(__dirname, "../data/orders.json");
const usersFile = path.join(__dirname, "../secrets/users.js");

// Helper function to read CSV
function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  File not found: ${filePath}`);
      return resolve([]);
    }
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => results.push(row))
      .on("end", () => resolve(results))
      .on("error", (err) => reject(err));
  });
}

// Get all restaurants with full details
router.get("/dashboard/restaurants", async (req, res) => {
  try {
    // Read all necessary data files
    const [metadata, efficiency, deliveryMetrics, feedback] = await Promise.all([
      readCSV(restaurantFile),
      readCSV(efficiencyFile),
      readCSV(deliveryMetricsFile),
      readCSV(feedbackFile),
    ]);

    // Calculate ratings and reviews from feedback
    const feedbackMap = {};
    feedback.forEach((f) => {
      const restaurant = f.restaurant;
      if (!feedbackMap[restaurant]) {
        feedbackMap[restaurant] = {
          ratings: [],
          reviews: 0,
        };
      }
      const deliveryRating = parseFloat(f.delivery_rating) || 0;
      const foodRating = parseFloat(f.food_quality_rating) || 0;
      if (deliveryRating > 0 || foodRating > 0) {
        feedbackMap[restaurant].ratings.push((deliveryRating + foodRating) / 2);
        feedbackMap[restaurant].reviews++;
      }
    });

    // Calculate average ratings
    const restaurantRatings = {};
    Object.keys(feedbackMap).forEach((restaurant) => {
      const ratings = feedbackMap[restaurant].ratings;
      if (ratings.length > 0) {
        restaurantRatings[restaurant] = {
          rating: (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1),
          reviews: feedbackMap[restaurant].reviews,
        };
      }
    });

    // Create maps for efficient lookup
    const efficiencyMap = {};
    efficiency.forEach((e) => {
      efficiencyMap[e.restaurant] = e;
    });

    const deliveryMap = {};
    deliveryMetrics.forEach((d) => {
      deliveryMap[d.restaurant] = d;
    });

    // Combine all data
    const restaurants = metadata.map((meta) => {
      const restaurantName = meta.restaurant;
      const efficiencyData = efficiencyMap[restaurantName] || {};
      const deliveryData = deliveryMap[restaurantName] || {};
      const ratingData = restaurantRatings[restaurantName] || { rating: "4.5", reviews: 0 };

      // Calculate sustainability score (based on has_sustainability_program and efficiency)
      const hasSustainability = meta.has_sustainability_program === "True" || meta.has_sustainability_program === true;
      const efficiencyScore = parseFloat(efficiencyData.efficiency_score) || 0;
      const sustainabilityScore = Math.round(
        hasSustainability ? 70 + (efficiencyScore * 0.3) : 50 + (efficiencyScore * 0.3)
      );

      // Calculate waste reduction (simplified - can be enhanced)
      const wasteReduction = hasSustainability ? "+" + Math.round(15 + Math.random() * 20) + "%" : "+" + Math.round(5 + Math.random() * 10) + "%";

      // Calculate weekly waste (from waste data if available)
      const weeklyWasteLbs = (parseFloat(efficiencyData.avg_daily_orders) || 0) * 0.05; // Simplified calculation

      // Calculate carbon saved (simplified)
      const carbonSaved = (weeklyWasteLbs / 100).toFixed(1);

      return {
        id: metadata.indexOf(meta) + 1,
        name: restaurantName,
        cuisine: meta.cuisine,
        location: `Raleigh, Zone-${meta.zip_code.toString().slice(-1)}`,
        rating: parseFloat(ratingData.rating),
        reviews: parseInt(ratingData.reviews) || 0,
        sustainabilityScore: sustainabilityScore,
        avgDeliveryTime: parseFloat(deliveryData.avg_delivery_time) || 20.0,
        onTimeRate: parseFloat(deliveryData.on_time_rate) || 85.0,
        avgDistance: parseFloat(deliveryData.avg_distance) || 5.0,
        efficiencyScore: parseFloat(efficiencyData.efficiency_score) || 75.0,
        weeklyWasteLbs: weeklyWasteLbs.toFixed(1),
        wasteReduction: wasteReduction,
        carbonSaved: carbonSaved,
      };
    });

    res.json(restaurants);
  } catch (error) {
    console.error("❌ Error fetching restaurants:", error);
    res.status(500).json({ error: "Failed to load restaurant data" });
  }
});

// Get rescue meals
router.get("/dashboard/rescue-meals", async (req, res) => {
  try {
    const rescueMeals = await readCSV(rescueMealsFile);
    
    // Transform rescue meals data
    const meals = rescueMeals.map((meal, index) => ({
      id: index + 1,
      name: meal.meal_name,
      originalPrice: parseFloat(meal.original_price) || 0,
      rescuePrice: parseFloat(meal.rescue_price) || 0,
      quantity: parseInt(meal.quantity) || 0,
      expiresIn: meal.expires_in || "2 hours",
      restaurant: meal.restaurant,
    }));

    res.json(meals);
  } catch (error) {
    console.error("❌ Error fetching rescue meals:", error);
    res.status(500).json({ error: "Failed to load rescue meals data" });
  }
});

// Get restaurants with their rescue meals
router.get("/dashboard/restaurants-with-meals", async (req, res) => {
  try {
    // Read all necessary data files
    const [metadata, efficiency, deliveryMetrics, feedback, rescueMeals] = await Promise.all([
      readCSV(restaurantFile),
      readCSV(efficiencyFile),
      readCSV(deliveryMetricsFile),
      readCSV(feedbackFile),
      readCSV(rescueMealsFile),
    ]);

    // Calculate ratings (same as in restaurants endpoint)
    const feedbackMap = {};
    feedback.forEach((f) => {
      const restaurant = f.restaurant;
      if (!feedbackMap[restaurant]) {
        feedbackMap[restaurant] = { ratings: [], reviews: 0 };
      }
      const deliveryRating = parseFloat(f.delivery_rating) || 0;
      const foodRating = parseFloat(f.food_quality_rating) || 0;
      if (deliveryRating > 0 || foodRating > 0) {
        feedbackMap[restaurant].ratings.push((deliveryRating + foodRating) / 2);
        feedbackMap[restaurant].reviews++;
      }
    });

    const restaurantRatings = {};
    Object.keys(feedbackMap).forEach((restaurant) => {
      const ratings = feedbackMap[restaurant].ratings;
      if (ratings.length > 0) {
        restaurantRatings[restaurant] = {
          rating: (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1),
          reviews: feedbackMap[restaurant].reviews,
        };
      }
    });

    // Group rescue meals by restaurant
    const mealsByRestaurant = {};
    rescueMeals.forEach((meal, index) => {
      const restaurant = meal.restaurant;
      if (!mealsByRestaurant[restaurant]) {
        mealsByRestaurant[restaurant] = [];
      }
      mealsByRestaurant[restaurant].push({
        id: index + 1,
        name: meal.meal_name,
        originalPrice: parseFloat(meal.original_price) || 0,
        rescuePrice: parseFloat(meal.rescue_price) || 0,
        quantity: parseInt(meal.quantity) || 0,
        expiresIn: meal.expires_in || "2 hours",
      });
    });

    // Create maps
    const efficiencyMap = {};
    efficiency.forEach((e) => {
      efficiencyMap[e.restaurant] = e;
    });

    const deliveryMap = {};
    deliveryMetrics.forEach((d) => {
      deliveryMap[d.restaurant] = d;
    });

    // Combine all data
    const restaurants = metadata.map((meta) => {
      const restaurantName = meta.restaurant;
      const efficiencyData = efficiencyMap[restaurantName] || {};
      const deliveryData = deliveryMap[restaurantName] || {};
      const ratingData = restaurantRatings[restaurantName] || { rating: "4.5", reviews: 0 };
      const restaurantMeals = mealsByRestaurant[restaurantName] || [];

      const hasSustainability = meta.has_sustainability_program === "True" || meta.has_sustainability_program === true;
      const efficiencyScore = parseFloat(efficiencyData.efficiency_score) || 0;
      const sustainabilityScore = Math.round(
        hasSustainability ? 70 + (efficiencyScore * 0.3) : 50 + (efficiencyScore * 0.3)
      );

      const wasteReduction = hasSustainability ? "+" + Math.round(15 + Math.random() * 20) + "%" : "+" + Math.round(5 + Math.random() * 10) + "%";
      const weeklyWasteLbs = (parseFloat(efficiencyData.avg_daily_orders) || 0) * 0.05;
      const carbonSaved = (weeklyWasteLbs / 100).toFixed(1);

      return {
        id: metadata.indexOf(meta) + 1,
        name: restaurantName,
        cuisine: meta.cuisine,
        location: `Raleigh, Zone-${meta.zip_code.toString().slice(-1)}`,
        rating: parseFloat(ratingData.rating),
        reviews: parseInt(ratingData.reviews) || 0,
        sustainabilityScore: sustainabilityScore,
        avgDeliveryTime: parseFloat(deliveryData.avg_delivery_time) || 20.0,
        onTimeRate: parseFloat(deliveryData.on_time_rate) || 85.0,
        avgDistance: parseFloat(deliveryData.avg_distance) || 5.0,
        efficiencyScore: parseFloat(efficiencyData.efficiency_score) || 75.0,
        weeklyWasteLbs: weeklyWasteLbs.toFixed(1),
        wasteReduction: wasteReduction,
        carbonSaved: carbonSaved,
        rescueMeals: restaurantMeals,
      };
    });

    res.json(restaurants);
  } catch (error) {
    console.error("❌ Error fetching restaurants with meals:", error);
    res.status(500).json({ error: "Failed to load restaurant data" });
  }
});

// Get user impact data
router.get("/dashboard/user-impact", async (req, res) => {
  try {
    let orders = [];
    if (fs.existsSync(ordersFile)) {
      orders = JSON.parse(fs.readFileSync(ordersFile, "utf8"));
    }

    // Calculate user impact from orders
    let mealsOrdered = 0;
    let moneySaved = 0;
    let foodWastePrevented = 0;
    let carbonReduced = 0;
    const restaurantsSupported = new Set();

    orders.forEach((order) => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item) => {
          if (item.isRescueMeal) {
            mealsOrdered += item.quantity || 1;
            const originalPrice = parseFloat(item.originalPrice) || 0;
            const rescuePrice = parseFloat(item.rescuePrice) || 0;
            moneySaved += (originalPrice - rescuePrice) * (item.quantity || 1);
            
            // Estimate waste prevented (each meal prevents ~0.5 lbs of waste)
            foodWastePrevented += (item.quantity || 1) * 0.5;
            
            // Estimate carbon reduced (each meal reduces ~0.4 kg CO2)
            carbonReduced += (item.quantity || 1) * 0.4;
            
            if (item.restaurant) {
              restaurantsSupported.add(item.restaurant);
            }
          }
        });
      }
    });

    // Determine impact level
    let impactLevel = "New Rescuer";
    if (mealsOrdered >= 50) {
      impactLevel = "Sustainability Champion";
    } else if (mealsOrdered >= 25) {
      impactLevel = "Eco Warrior";
    } else if (mealsOrdered >= 10) {
      impactLevel = "Planet Saver";
    }

    res.json({
      mealsOrdered: mealsOrdered,
      moneySaved: moneySaved.toFixed(2),
      foodWastePrevented: foodWastePrevented.toFixed(1),
      carbonReduced: carbonReduced.toFixed(1),
      localRestaurantsSupported: restaurantsSupported.size,
      impactLevel: impactLevel,
    });
  } catch (error) {
    console.error("❌ Error fetching user impact:", error);
    res.status(500).json({ error: "Failed to load user impact data" });
  }
});

// Get community stats
router.get("/dashboard/community-stats", async (req, res) => {
  try {
    const [waste, deliveryLogs] = await Promise.all([
      readCSV(wasteFile),
      readCSV(deliveryLogsFile),
    ]);

    // Calculate total meals rescued from waste data
    let totalMealsRescued = 0;
    waste.forEach((w) => {
      totalMealsRescued += parseInt(w.servings) || 0;
    });

    // Calculate total waste prevented
    let totalWastePrevented = 0;
    waste.forEach((w) => {
      totalWastePrevented += parseFloat(w.quantity_lb) || 0;
    });

    // Count active users (unique couriers + unique restaurants)
    const uniqueRestaurants = new Set();
    const uniqueCouriers = new Set();
    
    deliveryLogs.forEach((log) => {
      if (log.restaurant) uniqueRestaurants.add(log.restaurant);
      if (log.courier_id) uniqueCouriers.add(log.courier_id);
    });

    // Try to get user count from users file
    let activeUsers = 0;
    try {
      if (fs.existsSync(usersFile)) {
        const users = require(usersFile);
        activeUsers = Array.isArray(users) ? users.length : 0;
      }
    } catch (err) {
      // If users file doesn't exist or can't be read, use default
      activeUsers = uniqueCouriers.size + uniqueRestaurants.size;
    }

    // If no users file, estimate from delivery logs
    if (activeUsers === 0) {
      activeUsers = uniqueCouriers.size + uniqueRestaurants.size;
    }

    res.json({
      activeUsers: activeUsers,
      mealsRescued: totalMealsRescued,
      wastePreventedTons: (totalWastePrevented / 2000).toFixed(2),
      restaurantsPartnered: uniqueRestaurants.size,
    });
  } catch (error) {
    console.error("❌ Error fetching community stats:", error);
    res.status(500).json({ error: "Failed to load community stats" });
  }
});

module.exports = router;

