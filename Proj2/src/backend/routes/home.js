const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const csv = require("csv-parser");

const csvFilePath = path.join(__dirname, "../../../data/Restaurant_Metadata.csv");

// GET all restaurants
router.get("/restaurants", (req, res) => {
  const results = [];
  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", () => res.json(results))
    .on("error", (err) => {
      console.error("Error reading CSV:", err);
      res.status(500).json({ error: "Failed to load restaurant data" });
    });
});

module.exports = router;
