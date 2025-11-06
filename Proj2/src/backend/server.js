const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 5000;

// Path to users file
const usersFile = path.join(__dirname, "secrets/users.js");

// Load users
let users = require(usersFile);

app.use(cors());
app.use(express.json());

const homeRoutes = require("./routes/home");
app.use("/", homeRoutes);

// LOGIN endpoint
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);

  if (user) {
    res.json({ success: true, user: { name: user.name, email: user.email } });
  } else {
    res.json({ success: false, message: "Invalid credentials" });
  }
});

// REGISTER endpoint
app.post("/register", (req, res) => {
  const { name, email, password } = req.body;

  // Check if email already exists
  if (users.find(u => u.email === email)) {
    return res.json({ success: false, message: "Email already exists" });
  }

  const newUser = { name, email, password };
  users.push(newUser);

  // Persist to file
  try {
    fs.writeFileSync(usersFile, `module.exports = ${JSON.stringify(users, null, 2)};`);
    res.json({ success: true, message: "Registration successful" });
  } catch (err) {
    console.error("Error writing users file:", err);
    res.json({ success: false, message: "Server error, try again later" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
