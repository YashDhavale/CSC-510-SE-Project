const express = require("express");
const path = require("path");
const fs = require("fs");
const csv = require("csv-parser");

const router = express.Router();

const dataPath = path.join(__dirname, "../../../data");
const restaurantFile = path.join(dataPath, "Restaurant_Metadata.csv");
const wasteFile = path.join(dataPath, "Raleigh_Food_Waste__1-week_sample_.csv");

router.get("/restaurants", (req, res) => {
  const results = [];
  fs.createReadStream(restaurantFile)
    .pipe(csv())
    .on("data", (row) => results.push(row))
    .on("end", () => {
      res.json(results);
    })
    .on("error", (err) => {
      console.error("❌ Error reading restaurant CSV:", err);
      res.status(500).json({ error: "Failed to load restaurant data" });
    });
});

const usersFile = path.join(__dirname, "../secrets/users.js");

router.get("/impact", (req, res) => {
  let totalMeals = 0;
  let totalWaste = 0;

  fs.createReadStream(wasteFile)
    .pipe(csv())
    .on("data", (row) => {
      const servings = parseFloat(row.servings) || 0;
      const quantity = parseFloat(row.quantity_lb) || 0;

      totalMeals += servings;
      totalWaste += quantity;
    })
    .on("end", () => {
      let activeUsers = 0;

      fs.createReadStream(usersFile)
        .pipe(csv())
        .on("data", () => {
          activeUsers += 1; // count each user row
        })
        .on("end", () => {
          res.json({
            mealsRescued: totalMeals.toFixed(0),
            wastePreventedTons: (totalWaste / 2000).toFixed(1),
            communityImpact: activeUsers,
          });
        })
        .on("error", (err) => {
          console.error("❌ Error reading users CSV:", err);
          res.status(500).json({ error: "Failed to load user data" });
        });
    })
    .on("error", (err) => {
      console.error("❌ Error reading waste CSV:", err);
      res.status(500).json({ error: "Failed to load impact data" });
    });
});

module.exports = router;
