const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const BudgetData = require("../models/BudgetData");
const authMiddleware = require("../middleware/authMiddleware");
const admin = require("../utils/firebaseAdmin");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const router = express.Router();

// ─── Helper ───────────────────────────────────────────────────────────────────
const issueJWT = (user) =>
  jwt.sign(
    { userId: user._id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );

// ─── POST /api/auth/signup ────────────────────────────────────────────────────
router.post("/signup", async (req, res) => {
  try {
    const { username, email, password, mobileNumber, country, place } =
      req.body;

    if (!username || !email || !password || !country || !place) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      mobileNumber,
      country,
      place,
      isVerified: true,
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

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;

    const isEmail = identifier.includes("@");
    const user = await User.findOne(
      isEmail ? { email: identifier } : { username: identifier },
    );
    if (!user || !user.password) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    const token = issueJWT(user);

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

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
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

// ─── POST /api/auth/reset-password ───────────────────────────────────────────
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

    // FIX: Block password reset for Google-only accounts
    if (user.firebaseUid && !user.password) {
      return res.status(400).json({
        message:
          "This account uses Google sign-in and has no password to reset.",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password reset successful." });
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
});

// ─── POST /api/auth/google (SIGN IN ONLY) ────────────────────────────────────
router.post("/google", async (req, res) => {
  const { firebaseToken } = req.body;

  if (!firebaseToken) {
    return res.status(400).json({ message: "No Firebase token provided" });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(firebaseToken);
    const { uid, email } = decoded;

    // Find by firebaseUid first, then email
    let user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      user = await User.findOne({ email });

      if (user) {
        // FIX: Only link if this is NOT a local-only (password) account
        if (user.password) {
          return res.status(403).json({
            message:
              "This email is already registered with a username and password. Please log in normally.",
          });
        }
        // Safe to link — no password set, clearly a Google account
        user.firebaseUid = uid;
        user.isVerified = true;
        await user.save();
      } else {
        return res.status(404).json({
          message:
            "No account found for this Google account. Please sign up first.",
        });
      }
    }

    const token = issueJWT(user);

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

// ─── POST /api/auth/google/signup (SIGN UP ONLY) ─────────────────────────────
router.post("/google/signup", async (req, res) => {
  const { firebaseToken } = req.body;

  if (!firebaseToken) {
    return res.status(400).json({ message: "No Firebase token provided" });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(firebaseToken);
    const { uid, email, name } = decoded;

    const existingUser = await User.findOne({
      $or: [{ firebaseUid: uid }, { email }],
    });

    if (existingUser) {
      return res.status(409).json({
        message:
          "This Google account is already registered. Please log in instead.",
      });
    }

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

// - POST /api/auth/send-otp
router.post("/send-otp", authMiddleware, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    // Check if email is already used by another account
    const existingUser = await User.findOne({
      email,
      _id: { $ne: req.user.userId },
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Email is already in use by another account." });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    await User.findByIdAndUpdate(req.user.userId, {
      email,
      emailOtp: otp,
      otpExpiry: expiry,
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"SpendWise" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your SpendWise Verification Code",
      html: `
      <div style="font-family: sans-serif; max-width: 400px; margin: auto;">
          <h2>Verify your email</h2>
          <p>Your one-time verification code is:</p>
          <h1 style="letter-spacing: 8px; color: #6c47ff;">${otp}</h1>
          <p>This code expires in <strong>10 minutes</strong>.</p>
          <p style="color: #888;">If you didn't request this, ignore this email.</p>
        </div>
      `,
    });

    res.json({ message: "OTP sent to your email." });
  } catch (error) {
    console.error("Send OTP error:", error);
    res.status(500).json({ message: "Failed to send OTP." });
  }
});

// - POST /api/auth/verify-otp
router.post("/verify-otp", authMiddleware, async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ message: "OTP is required." });
    }

    const user = await User.findById(req.user.userId);

    if (!user.emailOtp || !user.otpExpiry) {
      return res
        .status(400)
        .json({ message: "No OTP requested. Please request one first." });
    }

    if (new Date() > user.otpExpiry) {
      return res
        .status(400)
        .json({ message: "OTP has expired. Please request a new one." });
    }

    if (user.emailOtp !== otp) {
      return res
        .status(400)
        .json({ message: "Incorrect OTP. Please try again." });
    }

    await User.findByIdAndUpdate(req.user.userId, {
      isVerified: true,
      emailOtp: "",
      otpExpiry: null,
    });

    res.json({ message: "Email verified successfully!" });
  } catch (error) {
    console.error("verify OTP error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
