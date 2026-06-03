const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const { sendOtpEmail } = require("../utils/mailer");

// Signup
const signUp = async (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 12);
  res.status(201).json({ message: "User created successfully" });
};

// Login
const login = async (req, res) => {
  const { email, password } = req.body;
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });
  const token = jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );
  res.json({ token });
};

// Send OTP
const sendOtp = async (req, res) => {
  try {
    const { identifier } = req.body;

    if (!identifier) {
      return res
        .status(400)
        .json({ message: "Please provide a username or email." });
    }

    const user = await User.findOne({
      $or: [{ username: identifier }, { email: identifier }],
    });

    if (!user) return res.status(404).json({ message: "User not found." });
    if (!user.email)
      return res
        .status(400)
        .json({ message: "No email linked with this account." });

    const otp = crypto.randomInt(100000, 999999).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 Minutes

    user.emailOtp = otp;
    user.otpExpiry = expiry;
    user.otpVerified = false;
    await user.save();

    await sendOtpEmail(user.email, otp);

    res.json({ message: "OTP sent to your email." });
  } catch (err) {
    console.error("sendOtp error:", err);
    res.status(500).json({ message: "Failed to send OTP." });
  }
};

// Verify OTP
const verifyOtp = async (req, res) => {
  try {
    const { identifier, otp } = req.body;

    const user = await User.findOne({
      $or: [{ username: identifier }, { email: identifier }],
    });

    if (!user) return res.status(404).json({ message: "User not found." });
    if (user.emailOtp !== otp)
      return res.status(400).json({ message: "Invalid OTP." });
    if (user.otpExpiry < new Date())
      return res.status(400).json({ message: "OTP has expired." });

    user.otpVerified = true;
    await user.save();

    res.json({ message: "OTP verified." });
  } catch (err) {
    console.error("verifyOtp error:", err);
    res.status(500).json({ message: "Failed to verify OTP." });
  }
};

// Reset Password
const resetPasssword = async (req, res) => {
  try {
    const { identifier, newPassword } = req.body;

    const user = await User.findOne({
      $or: [{ username: identifier }, { email: identifier }],
    });

    if (!user) return res.status(404).json({ message: "User not found." });
    if (!user.otpVerified)
      return res.status(403).json({ message: "OTP not verified." });

    user.password = await bcrypt.hash(newPassword, 10);
    user.emailOtp = "";
    user.otpExpiry = null;
    user.otpVerified = false;
    await user.save();

    res.json({ message: "Password reset successful." });
  } catch (err) {
    console.error("resetPassword error:", err);
    res.status(500).json({ message: "Reset failed. Please try again." });
  }
};

module.exports = { signUp, login, sendOtp, verifyOtp, resetPassword };
