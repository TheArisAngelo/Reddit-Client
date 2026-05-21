const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const BudgetData = require("../models/BudgetData");
const authMiddleware = require("../middleware/authMiddleware");
const admin = require("../utils/firebaseAdmin");

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
        country: user.country,
        place: user.place,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      user: {
        username: user.username,
        mobileNumber: user.mobileNumber,
        country: user.country,
        place: user.place,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        email: user.email || "",
        firebaseUid: user.firebaseUid || "",
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { username, newPassword } = req.body;

    if (!username || !newPassword) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: "Username not found." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password reset successful." });
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
});

// ─── Google Sign-in (LOGIN ONLY) ─────────────────────────────────────────────
router.post("/google", async (req, res) => {
  const { firebaseToken } = req.body;

  if (!firebaseToken) {
    return res.status(400).json({ message: "No Firebase token provided" });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(firebaseToken);
    const { uid, email } = decoded;

    // Look for existing user by firebaseUid first
    let user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      // Fallback: standard account with same email — link it
      user = await User.findOne({ email });

      if (user) {
        user.firebaseUid = uid;
        user.isVerified = true;
        await user.save();
      } else {
        // No account found — block login, must sign up first
        return res.status(404).json({
          message:
            "No account found for this Google account. Please sign up first.",
        });
      }
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      message: "Google login successful",
      token,
      user: {
        username: user.username,
        email: user.email || "",
        mobileNumber: user.mobileNumber || "",
        country: user.country || "",
        place: user.place || "",
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error("Google login error:", err);
    res.status(401).json({ message: "Invalid Firebase token" });
  }
});

// ─── Google Sign-up (SIGNUP ONLY) ────────────────────────────────────────────
router.post("/google/signup", async (req, res) => {
  const { firebaseToken } = req.body;

  if (!firebaseToken) {
    return res.status(400).json({ message: "No Firebase token provided" });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(firebaseToken);
    const { uid, email, name } = decoded;

    // Block if already registered
    const existingUser = await User.findOne({
      $or: [{ firebaseUid: uid }, { email }],
    });

    if (existingUser) {
      return res.status(409).json({
        message: "This Google account is already registered. Please log in.",
      });
    }

    // Build a unique username from Google display name or email
    const baseUsername = name || email.split("@")[0];
    const existingUsername = await User.findOne({ username: baseUsername });
    const finalUsername = existingUsername
      ? `${baseUsername}_${uid.slice(0, 5)}`
      : baseUsername;

    const user = await User.create({
      firebaseUid: uid,
      username: finalUsername,
      email,
      password: "",
      mobileNumber: "",
      country: "",
      place: "",
      isVerified: true,
    });

    await BudgetData.create({
      userId: user._id,
      currentBalance: 0,
      transactions: [],
      budgets: [],
      savingsGoals: [],
    });

    res
      .status(201)
      .json({ message: "Google account registered successfully." });
  } catch (err) {
    console.error("Google signup error:", err);
    res.status(401).json({ message: "Invalid Firebase token" });
  }
});

module.exports = router;
