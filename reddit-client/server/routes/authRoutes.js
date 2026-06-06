const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const BudgetData = require("../models/BudgetData");
const authMiddleware = require("../middleware/authMiddleware");
const admin = require("../utils/firebaseAdmin");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const upload = require("../middleware/upload");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// Helper
const issueJWT = (user) =>
  jwt.sign(
    { userId: user._id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );

// POST - /api/auth/signup
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

// POST - /api/auth/login
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

// GET - /api/auth/me
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
        avatar: user.avatar || null,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/auth/reset-password
router.post("/reset-password", async (req, res) => {
  try {
    const { identifier, newPassword } = req.body;

    if (!identifier || !newPassword) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const isEmail = identifier.includes("@");
    const user = await User.findOne(
      isEmail ? { email: identifier } : { username: identifier },
    );

    if (!user)
      return res
        .status(404)
        .json({ message: "No account found with that username or email." });
    if (user.firebaseUid && !user.password) {
      return res.status(400).json({
        message:
          "This account uses Google sign in and has no password to reset.",
      });
    }

    // Block if OTP wasn't verified
    if (!user.otpVerified) {
      return res.status(403).json({
        message: "OTP not verified. Please complete verification first.",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.emailOtp = "";
    user.otpExpiry = null;
    user.otpVerified = false;
    await user.save();

    res.json({ message: "Password reset successful." });
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
});

// POST /api/auth/google (SIGN IN ONLY)
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
        // Only link if this is NOT a local-only (password) account
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

// POST /api/auth/google/signup (SIGN UP ONLY)
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

// POST /api/auth/send-otp
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

// POST /api/auth/verify-otp
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

// POST /api/auth/forgot/send-otp
router.post("/forgot/send-otp", async (req, res) => {
  try {
    const { identifier } = req.body;

    if (!identifier) {
      return res
        .status(400)
        .json({ message: "Please provide a username or email." });
    }

    const isEmail = identifier.includes("@");
    const user = await User.findOne(
      isEmail ? { email: identifier } : { username: identifier },
    );

    if (!user)
      return res
        .status(404)
        .json({ message: "No account found with that username or email." });
    if (!user.email)
      return res
        .status(400)
        .json({ message: "No email linked with this account." });

    // Block Google only accounts
    if (user.firebaseUid && !user.password) {
      return res.status(400).json({
        message: "This account uses Google sign in and no password to reset.",
      });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    user.emailOtp = otp;
    user.otpExpiry = expiry;
    user.otpVerified = false;
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"SpendWise" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Your SpenWise Password Reset Code",
      html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: auto;">
          <h2>Reset your password</h2>
          <p>Your one-time reset code is:</p>
          <h1 style="letter-spacing: 8px; color: #6c47ff;">${otp}</h1>
          <p>This code expires in <strong>10 minutes</strong>.</p>
          <p style="color: #888;">If you didn't request this, ignore this email.</p>
        </div>
      `,
    });

    res.json({ message: "OTP sent to your email." });
  } catch (error) {
    console.error("Forgot send-otp error:", error);
    res.status(500).json({ message: "Failed to send OTP." });
  }
});

// POST /api/auth/forgot/verify-otp
router.post("/forgot.verify-otp", async (req, res) => {
  try {
    const { identifier, otp } = req.body;

    const isEmail = identifier.includes("@");
    const user = await User.findOne(
      isEmail ? { email: identifier } : { username: identifier },
    );

    if (!user) return res.status(404).json({ message: "User not found." });
    if (!user.emailOtp || !user.otpExpiry)
      return res.status(400).json({ message: "No OTP requested." });
    if (new Date() > user.otpExpiry)
      return res.status(400).json({ message: "OTP has expired." });
    if (user.emailOtp !== otp)
      return res.status(400).json({ message: "Incorrect OTP." });

    user.otpVerified = true;
    await user.save();

    res.json({ message: "OTP verified." });
  } catch (error) {
    console.error("Forgot verify-otp error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// DELETE /api/auth/me
router.delete("/me", authMiddleware, async (req, res) => {
  try {
    const { identifier } = req.body;

    if (!identifier) {
      return res
        .status(400)
        .json({ message: "Please provide your username or email to confirm." });
    }

    // Check if identifier matches username or email
    const isMatch =
      identifier.trim().toLowerCase() === user.username.toLowerCase() ||
      identifier.trim().toLowerCase() === (user.email || "").toLowerCase();

    if (!isMatch) {
      return res.status(400).json({
        message: "Username or email does not match. Please try again.",
      });
    }

    // Delete user and their budget data
    await BudgetData.deleteOne({ userId: req.user.userId });
    await User.findByIdAndDelete(req.user.userId);

    res.json({ message: "Account deleted successfully." });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({ message: "Server Error." });
  }
});

// POST /api/auth/me/avatar
router.post(
  "/me/avatar",
  authMiddleware,
  upload.single("avatar"),
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ message: "No File Uploaded." });

      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      await User.findByIdAndUpdate(req.user.userId, { avatar: avatarUrl });

      res.json({ avatarUrl });
    } catch (err) {
      res.status(500).json({ message: "Avatar upload failed." });
    }
  },
);

// DELETE /api/auth/me/avatar
router.delete("/me/avatar", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (user.avatar) {
      const filePath = path.join(__dirname, "../", user.avatar);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await User.findByIdAndUpdate(req.user.userId, { avatar: null });
    res.json({ message: "Avatar removed." });
  } catch (err) {
    res.status(500).json({ message: "Failed to remove avatar." });
  }
});

module.exports = router;
