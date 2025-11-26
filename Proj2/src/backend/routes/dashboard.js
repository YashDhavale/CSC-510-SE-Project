// Proj2/src/backend/routes/dashboard.js
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

// Helper: read CSV into array
function readCsv(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (err) => reject(err));
  });
}

// Get restaurants with their meals (for browse view)
router.get("/dashboard/restaurants-with-meals", async (req, res) => {
  try {
    const restaurants = await readCsv(restaurantFile);
    const rescueMeals = await readCsv(rescueMealsFile);

    const restaurantMap = new Map();

    restaurants.forEach((row) => {
      const name = row["Restaurant Name"];
      if (!name) return;

      if (!restaurantMap.has(name)) {
        restaurantMap.set(name, {
          id: row["Restaurant ID"] || name,
          name,
          cuisine: row["Cuisine Type"] || "Unknown",
          address: row["Address"] || "",
          hours: row["Operating Hours"] || "",
          rating: parseFloat(row["Average Rating"] || "4.5"),
          distance: row["Distance (miles)"]
            ? parseFloat(row["Distance (miles)"])
            : null,
          menus: [],
        });
      }
    });

    rescueMeals.forEach((mealRow) => {
      const restaurantName = mealRow["Restaurant Name"];
      if (!restaurantName || !restaurantMap.has(restaurantName)) {
        return;
      }

      const restaurant = restaurantMap.get(restaurantName);

      const meal = {
        id: `${restaurantName}-${mealRow["Meal Name"]}-${mealRow["Pickup Window"]}`,
        name: mealRow["Meal Name"] || "Rescue Meal",
        description: mealRow["Description"] || "",
        originalPrice: parseFloat(mealRow["Original Price"] || "0").toFixed(2),
        rescuePrice: parseFloat(mealRow["Rescue Price"] || "0").toFixed(2),
        pickupWindow: mealRow["Pickup Window"] || "",
        expiresIn: mealRow["Pickup Window"] || "",
        isRescueMeal: true,
      };

      restaurant.menus.push(meal);
    });

    res.json(Array.from(restaurantMap.values()));
  } catch (error) {
    console.error("❌ Error fetching restaurants with meals:", error);
    res.status(500).json({ error: "Failed to load restaurant data" });
  }
});

// Get vendor efficiency (for analytics)
router.get("/dashboard/vendor-efficiency", async (req, res) => {
  try {
    const efficiency = await readCsv(efficiencyFile);
    res.json(efficiency);
  } catch (error) {
    console.error("❌ Error fetching vendor efficiency:", error);
    res.status(500).json({ error: "Failed to load vendor efficiency" });
  }
});

// Get delivery metrics (for analytics)
router.get("/dashboard/delivery-metrics", async (req, res) => {
  try {
    const metrics = await readCsv(deliveryMetricsFile);
    res.json(metrics);
  } catch (error) {
    console.error("❌ Error fetching delivery metrics:", error);
    res.status(500).json({ error: "Failed to load delivery metrics" });
  }
});

// Get rescue meals (raw)
router.get("/dashboard/rescue-meals", async (req, res) => {
  try {
    const meals = await readCsv(rescueMealsFile);
    res.json(meals);
  } catch (error) {
    console.error("❌ Error fetching rescue meals:", error);
    res.status(500).json({ error: "Failed to load rescue meals" });
  }
});

// Get feedback (for sentiment / UX)
router.get("/dashboard/customer-feedback", async (req, res) => {
  try {
    const feedback = await readCsv(feedbackFile);
    res.json(feedback);
  } catch (error) {
    console.error("❌ Error fetching feedback:", error);
    res.status(500).json({ error: "Failed to load feedback" });
  }
});

// Get food waste sample
router.get("/dashboard/food-waste", async (req, res) => {
  try {
    const waste = await readCsv(wasteFile);
    res.json(waste);
  } catch (error) {
    console.error("❌ Error fetching food waste:", error);
    res.status(500).json({ error: "Failed to load food waste data" });
  }
});

// Get delivery logs
router.get("/dashboard/delivery-logs", async (req, res) => {
  try {
    const logs = await readCsv(deliveryLogsFile);
    res.json(logs);
  } catch (error) {
    console.error("❌ Error fetching delivery logs:", error);
    res.status(500).json({ error: "Failed to load delivery logs" });
  }
});

// Get user impact data (now user-specific via email)
router.get("/dashboard/user-impact", async (req, res) => {
  try {
    let orders = [];
    if (fs.existsSync(ordersFile)) {
      orders = JSON.parse(fs.readFileSync(ordersFile, "utf8"));
    }

    const { email, userEmail } = req.query || {};
    const targetEmail = (email || userEmail || "").toLowerCase();

    if (targetEmail) {
      orders = orders.filter(
        (order) =>
          typeof order.userEmail === "string" &&
          order.userEmail.toLowerCase() === targetEmail
      );
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
            const pricePaid =
              parseFloat(item.price || item.rescuePrice || 0) || 0;
            const saved = Math.max(originalPrice - pricePaid, 0);

            moneySaved += saved * (item.quantity || 1);

            const wasteSaved = 1.0 * (item.quantity || 1);
            foodWastePrevented += wasteSaved;

            const carbonPerMealKg = 3;
            carbonReduced += carbonPerMealKg * (item.quantity || 1);
          }

          if (item.restaurant) {
            restaurantsSupported.add(item.restaurant);
          }
        });
      }
    });

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

// Get community stats (remains aggregate over all orders and CSVs)
router.get("/dashboard/community-stats", async (req, res) => {
  try {
    const rescueMeals = await readCsv(rescueMealsFile);
    const waste = await readCsv(wasteFile);

    let activeUsers = 0;
    let totalMealsRescued = 0;
    let totalWastePrevented = 0;
    const uniqueRestaurants = new Set();

    rescueMeals.forEach((row) => {
      const meals = parseInt(row["Meals Rescued"] || "0", 10);
      if (!Number.isNaN(meals)) {
        totalMealsRescued += meals;
      }

      const restaurant = row["Restaurant Name"];
      if (restaurant) {
        uniqueRestaurants.add(restaurant);
      }
    });

    const userFile = path.join(__dirname, "../data/users.json");
    if (fs.existsSync(userFile)) {
      const users = JSON.parse(fs.readFileSync(userFile, "utf8"));
      activeUsers = Array.isArray(users) ? users.length : 0;
    }

    waste.forEach((row) => {
      const wasteLbs = parseFloat(row["Food Waste (lbs)"] || "0");
      if (!Number.isNaN(wasteLbs)) {
        totalWastePrevented += wasteLbs;
      }
    });

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
