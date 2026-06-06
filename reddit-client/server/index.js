require("dotenv").config();

const express = require("express");
const path = require("path");
const {
  helmetConfig,
  corsConfig,
  limiter,
  authLimiter,
} = require("./middleware/security");
const authMiddleware = require("./middleware/auth");

const app = express();

// Security middleware
app.use(helmetConfig);
app.use(corsConfig);
app.use(limiter);
app.use(express.json());

// Static file serving ← this was already correct
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ↓ ADD THESE — your actual routes were never imported!
const authRoutes = require("./routes/authRoutes");
const budgetRoutes = require("./routes/budgetRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/budget", budgetRoutes);

app.listen(process.env.PORT || 5000, () => {
  console.log("Server running securely");
});
