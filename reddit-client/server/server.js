const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();
require("./utils/firebaseAdmin");
const authRoutes = require("./routes/authRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const { startNotificationJob } = require("./jobs/notificationJob");
require("./jobs/weeklyNotificationJob");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/budget", budgetRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    startNotificationJob();
    app.listen(process.env.PORT || 5000, () => {
      console.log(`Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((error) => {
    console.error("Database connection error:", error);
  });
