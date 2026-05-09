const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const helmetConfig = helmet();

const corsConfig = cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
});

const limiter = rateLimit({
  windowMS: 15 * 60 * 1000,
  max: 100,
});

const authLimiter = rateLimit({
  windowMS: 15 * 60 * 1000,
  max: 10,
});

module.exports = { helmetConfig, corsConfig, limiter, authLimiter };
