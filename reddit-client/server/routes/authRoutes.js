const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const BudgetData = require("../models/BudgetData");

const router = express.Router();

router.post("/signup", async (req, res) => {
  try {
    const { username, password, mobileNumber, country, place } = req.body;

    if (!username || !password || !mobileNumber || !country || !place) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      password: hashedPassword,
      mobileNumber,
      country,
      place,
    });

    await BudgetData.create({
      userId: user._id,
      currentBalance: 0,
      transactions: [],
      budgets: [],
      savingsGoals: [],
    });

    res.status(201).json({ message: "Account Created Successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        username: user.username,
        mobileNumber: user.mobileNumber,
        country: user.Country,
        place: user.place,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
