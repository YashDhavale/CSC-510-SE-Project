const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const reviewRoutes = require("./routes/reviews");

const app = express();
const PORT = process.env.PORT || 5000;

// Path to users file
const usersFile = path.join(__dirname, "secrets/users.js");

// In-memory users cache
let users = [];

/**
 * Safely load users from secrets/users.js.
 * If the file does not exist or is invalid, initialize as empty array.
 */
function loadUsers() {
  try {
    if (fs.existsSync(usersFile)) {
      // Clear require cache to always read latest content
      delete require.cache[require.resolve(usersFile)];
      const loaded = require(usersFile);

      if (Array.isArray(loaded)) {
        users = loaded;
      } else {
        // eslint-disable-next-line no-console
        console.warn(
          "users.js did not export an array. Resetting to empty array."
        );
        users = [];
      }
    } else {
      // Ensure directory exists and create a minimal users.js
      fs.mkdirSync(path.dirname(usersFile), { recursive: true });
      fs.writeFileSync(usersFile, "module.exports = [];\n");
      users = [];
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
      "Error loading users.js. Falling back to empty users array:",
      err
    );
    users = [];
  }
}

/**
 * Persist current users array back to secrets/users.js.
 */
function saveUsers() {
  try {
    fs.mkdirSync(path.dirname(usersFile), { recursive: true });
    fs.writeFileSync(
      usersFile,
      `module.exports = ${JSON.stringify(users, null, 2)};\n`
    );
    return true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error writing users.js:", err);
    return false;
  }
}

// Initialize users on server startup
loadUsers();

app.use(cors());
app.use(express.json());
app.use("/reviews", reviewRoutes);

/* ------------------------------
 * Auth routes: Login / Register
 * ------------------------------ */

/**
 * POST /login
 * Body: { email, password }
 */
app.post("/login", (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    // Keep HTTP 200 for backward compatibility with existing frontend/tests
    return res.json({
      success: false,
      message: "Email and password are required",
    });
  }

  const user = users.find(
    (u) => u.email === email && u.password === password
  );

  if (user) {
    const accountType = user.accountType || "customer";
    const restaurantName =
      accountType === "restaurant" ? user.restaurantName || null : null;

    return res.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        accountType,
        restaurantName,
      },
    });
  }

  return res.json({
    success: false,
    message: "Invalid credentials",
  });
});

/**
 * POST /register
 * Body: { name, email, password }
 */
app.post("/register", (req, res) => {
  const { name, email, password } = req.body || {};

  // Basic validation
  if (!name || !email || !password) {
    return res.json({
      success: false,
      message: "Name, email, and password are required",
    });
  }

  if (users.find((u) => u.email === email)) {
    return res.json({
      success: false,
      message: "Email already exists",
    });
  }

  // Default newly registered users to customer accounts.
  const newUser = { name, email, password, accountType: "customer" };
  users.push(newUser);

  const ok = saveUsers();
  if (!ok) {
    return res.json({
      success: false,
      message: "Server error, try again later",
    });
  }

  return res.json({
    success: true,
    message: "Registration successful",
  });
});

/* ------------------------------
 * Other feature routes
 * ------------------------------ */

const homeRoutes = require("./routes/home");
const cartRoutes = require("./routes/cart");
const dashboardRoutes = require("./routes/dashboard");
const restaurantRoutes = require("./routes/restaurant");

// Mount feature routes after auth routes so auth endpoints are not shadowed
app.use("/", homeRoutes);
app.use("/", cartRoutes);
app.use("/", dashboardRoutes);
app.use("/", restaurantRoutes);

/* ------------------------------
 * Root & 404 handlers
 * ------------------------------ */

// Simple health check
app.get("/", (req, res) => {
  res.send("Backend is running successfully!");
});

// Fallback: return JSON for unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.path,
  });
});

// Only start the server if this file is run directly (not in tests)
if (require.main === module) {
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
