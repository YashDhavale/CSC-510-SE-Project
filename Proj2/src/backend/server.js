const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 5000;

const usersFile = path.join(__dirname, "secrets/users.js");

let users = require(usersFile);

app.use(cors());
app.use(express.json());

const homeRoutes = require("./routes/home");
app.use("/", homeRoutes);

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email === email && u.password === password);

  if (user) {
    res.json({
      success: true,
      user: { name: user.name, email: user.email },
    });
  } else {
    res.json({ success: false, message: "Invalid credentials" });
  }
});

app.post("/register", (req, res) => {
  const { name, email, password } = req.body;

  if (users.find((u) => u.email === email)) {
    return res.json({ success: false, message: "Email already exists" });
  }

  const newUser = { name, email, password };
  users.push(newUser);
  try {
    fs.writeFileSync(
      usersFile,
      `module.exports = ${JSON.stringify(users, null, 2)};`
    );
    res.json({ success: true, message: "Registration successful" });
  } catch (err) {
    console.error("❌ Error writing users file:", err);
    res.json({ success: false, message: "Server error, try again later" });
  }
});

// ------------------------------
// 🔹 Root Route
// ------------------------------
app.get("/", (req, res) => {
  res.send("Backend is running successfully!");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
