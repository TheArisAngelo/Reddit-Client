const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": [
        "'self'",
        "data:",
        "blob:",
        "http://localhost:5000",
        process.env.SERVER_URL || "",
      ],
    },
  },
});

const corsConfig = cors({
  origin: [process.env.CLIENT_URL, "http://localhost:3000"].filter(Boolean),
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
});

module.exports = { helmetConfig, corsConfig, limiter, authLimiter };
