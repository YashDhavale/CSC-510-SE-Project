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

    // Build a quick lookup of how many portions of each rescue meal
    // have already been ordered, using the persisted orders.json.
    let orders = [];
    if (fs.existsSync(ordersFile)) {
      try {
        const raw = fs.readFileSync(ordersFile, "utf8");
        orders = JSON.parse(raw);
      } catch (err) {
        console.error("⚠️ Failed to read orders for inventory:", err);
      }
    }

    const soldByKey = new Map();
    orders.forEach((order) => {
      if (!order || !Array.isArray(order.items)) return;

      order.items.forEach((item) => {
        if (!item || !item.isRescueMeal) {
          return;
        }

        const restaurantName = item.restaurant;
        const mealName = item.meal;

        if (!restaurantName || !mealName) {
          return;
        }

        const key = `${restaurantName}|||${mealName}`;
        const qtyRaw =
          typeof item.quantity === "number"
            ? item.quantity
            : parseInt(item.quantity || "0", 10);
        const qty = Number.isNaN(qtyRaw) ? 0 : qtyRaw;
        if (qty <= 0) {
          return;
        }
        soldByKey.set(key, (soldByKey.get(key) || 0) + qty);
      });
    });

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
      const restaurantName =
        mealRow.restaurant || mealRow["Restaurant Name"] || mealRow.restaurant_name;
      if (!restaurantName || !restaurantMap.has(restaurantName)) {
        return;
      }

      const restaurant = restaurantMap.get(restaurantName);

      const mealName =
        mealRow.meal_name || mealRow["Meal Name"] || mealRow.name || "Rescue Meal";

      const originalPriceRaw =
        mealRow.original_price || mealRow["Original Price"] || mealRow.originalPrice;
      const rescuePriceRaw =
        mealRow.rescue_price || mealRow["Rescue Price"] || mealRow.rescuePrice;

      const originalPriceNumber = parseFloat(originalPriceRaw);
      const rescuePriceNumber = parseFloat(rescuePriceRaw);

      const originalPrice = Number.isFinite(originalPriceNumber)
        ? originalPriceNumber.toFixed(2)
        : null;
      const rescuePrice = Number.isFinite(rescuePriceNumber)
        ? rescuePriceNumber.toFixed(2)
        : null;

      const expiresInRaw =
        mealRow.expires_in ||
        mealRow["expires_in"] ||
        mealRow["Pickup Window"] ||
        "";

      const quantityRaw = mealRow.quantity || mealRow["Quantity"];
      const baseQuantityParsed = parseInt(quantityRaw || "0", 10);
      const totalQuantity = Number.isNaN(baseQuantityParsed)
        ? 0
        : baseQuantityParsed;

      const inventoryKey = `${restaurantName}|||${mealName}`;
      const soldQuantity = soldByKey.get(inventoryKey) || 0;
      const availableQuantity = Math.max(totalQuantity - soldQuantity, 0);
      const isSoldOut = availableQuantity <= 0;

      const meal = {
        id: `${restaurantName}-${mealName}-${expiresInRaw || "today"}`,
        name: mealName,
        description: mealRow.description || mealRow["Description"] || "",
        originalPrice,
        rescuePrice,
        pickupWindow: expiresInRaw || "",
        expiresIn: expiresInRaw || "",
        isRescueMeal: true,
        totalQuantity,
        soldQuantity,
        availableQuantity,
        isSoldOut,
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
    res.status(500).json({ error: "Failed to load vendor efficiency data" });
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
    console.error("❌ Error fetching customer feedback:", error);
    res.status(500).json({ error: "Failed to load customer feedback" });
  }
});

// Get user impact (per-user stats)
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

            moneySaved += saved;

            // Simple heuristic conversion
            const wastePerMeal = 1.5; // lbs
            const carbonPerMeal = 3.0; // kg CO2e

            foodWastePrevented += wastePerMeal * (item.quantity || 1);
            carbonReduced += carbonPerMeal * (item.quantity || 1);

            if (item.restaurant) {
              restaurantsSupported.add(item.restaurant);
            }
          }
        });
      }
    });

    let impactLevel = "Getting Started";
    if (mealsOrdered >= 10 || moneySaved >= 50) {
      impactLevel = "Food Rescue Champion";
    } else if (mealsOrdered >= 5 || moneySaved >= 25) {
      impactLevel = "Rising Rescuer";
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
    let orders = [];
    if (fs.existsSync(ordersFile)) {
      orders = JSON.parse(fs.readFileSync(ordersFile, "utf8"));
    }

    let activeUsers = 0;
    let totalMealsRescued = 0;
    const uniqueRestaurants = new Set();

    const userMap = new Map();

    orders.forEach((order) => {
      if (!order.userEmail) return;

      const email = order.userEmail.toLowerCase();
      if (!userMap.has(email)) {
        userMap.set(email, 0);
      }

      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item) => {
          if (item.isRescueMeal) {
            const qty = item.quantity || 1;
            userMap.set(email, userMap.get(email) + qty);
            totalMealsRescued += qty;
            if (item.restaurant) {
              uniqueRestaurants.add(item.restaurant);
            }
          }
        });
      }
    });

    activeUsers = Array.from(userMap.values()).filter((count) => count > 0).length;

    let totalWastePrevented = 0;
    const waste = await readCsv(wasteFile);
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
