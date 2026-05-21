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

// ─── NEW: Google Sign-in Route ────────────────────────────────────────────────
// Frontend sends Firebase token → we verify it → return our own JWT
router.post("/google", async (req, res) => {
  const { firebaseToken } = req.body;

  if (!firebaseToken) {
    return res.status(400).json({ message: "No Firebase token provided" });
  }

  try {
    // Step 1: Verify the Firebase token is legitimate
    const decoded = await admin.auth().verifyIdToken(firebaseToken);
    const { uid, email, name, picture } = decoded;

    // Step 2: Find existing user by firebaseUid or email
    let user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      // Check if user signed up normally with same email before
      user = await User.findOne({ email });

      if (user) {
        // Link existing account to Google
        user.firebaseUid = uid;
        user.isVerified = true;
        await user.save();
      } else {
        // Brand new Google user — create account in MongoDB
        const username = name || email.split("@")[0];

        // Make sure username is unique
        const existingUsername = await User.findOne({ username });
        const finalUsername = existingUsername
          ? `${username}_${uid.slice(0, 5)}`
          : username;

        user = await User.create({
          firebaseUid: uid,
          username: finalUsername,
          email,
          avatar: picture || "",
          password: "", // No password for Google users
          mobileNumber: "",
          country: "",
          place: "",
          isVerified: true,
        });

        // Create empty budget data for new user
        await BudgetData.create({
          userId: user._id,
          currentBalance: 0,
          transactions: [],
          budgets: [],
          savingsGoals: [],
        });
      }
    }

    // Step 3: Issue your own JWT so the rest of your app works as normal
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
      },
    });
  } catch (err) {
    console.error("Google auth error:", err);
    res.status(401).json({ message: "Invalid Firebase token" });
  }
});

module.exports = router;
