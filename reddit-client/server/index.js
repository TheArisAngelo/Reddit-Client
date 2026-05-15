require("dotenv").config();


const express = require("express");
const {
  helmetConfig,
  corsConfig,
  limiter,
  authLimiter,
} = require("./middleware/security");
const authMiddleware = require("./middleware/auth");
const auth = require("./middleware/auth");

const app = express();

// Security middleware
app.use(helmetConfig);
app.use(corsConfig);
app.use(limiter);
app.use(express.json());

app.use("./api/login", authLimiter);
app.use("./api/signup", authLimiter);

app.use("/api/budgets", authMiddleware);
app.use("/api/transactions", authMiddleware);
app.use("./api/savings", authMiddleware);
app.use("./api/insights", authMiddleware);

app.listen(process.env.PORT || 5000, () => {
  console.log("Server running securely");
});
