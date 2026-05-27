const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const issueJWT = (user) =>
  jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

const safeUser = (user) => ({
  username: user.username,
  email: user.email,
  mobileNumber: user.mobileNumber || "",
  country: user.country || "",
  place: user.place || "",
});

//  POST /api/auth/google (SIGN IN ONLY)
// Fails if user doesn't exist — does NOT auto-create
router.post("/google", async (req, res) => {
  const { firebaseToken } = req.body;
  if (!firebaseToken)
    return res.status(400).json({ message: "No Firebase token provided" });

  try {
    const decoded = await admin.auth().verifyIdToken(firebaseToken);
    const { uid, email } = decoded;

    // STRICT: only find, never create
    const user = await User.findOne({
      $or: [{ firebaseUid: uid }, { email }],
    });

    if (!user) {
      return res.status(404).json({
        message:
          "No account found for this Google account. Please sign up first.",
      });
    }

    // Block local-only accounts from using Google sign-in
    if (!user.firebaseUid) {
      return res.status(403).json({
        message:
          "This email is registered with a username/password. Please log in normally.",
      });
    }

    const token = issueJWT(user);
    res.json({ token, user: safeUser(user) });
  } catch (err) {
    console.error("Google sign-in error:", err);
    res.status(401).json({ message: "Invalid Firebase token" });
  }
});

//  POST /api/auth/google/signup (SIGN UP ONLY) 
// Fails if user already exists — does NOT allow duplicates
router.post("/google/signup", async (req, res) => {
  const { firebaseToken } = req.body;
  if (!firebaseToken)
    return res.status(400).json({ message: "No Firebase token provided" });

  try {
    const decoded = await admin.auth().verifyIdToken(firebaseToken);
    const { uid, email, name, picture } = decoded;

    // Check for any existing account with this uid OR email
    const existing = await User.findOne({
      $or: [{ firebaseUid: uid }, { email }],
    });

    if (existing) {
      return res.status(409).json({
        message:
          "This Google account is already registered. Please log in instead.",
      });
    }

    const user = await User.create({
      firebaseUid: uid,
      username: name || email.split("@")[0],
      email,
      avatar: picture || "",
    });

    res.status(201).json({ message: "Google account registered successfully" });
  } catch (err) {
    console.error("Google sign-up error:", err);
    res.status(401).json({ message: "Invalid Firebase token" });
  }
});

module.exports = router;
