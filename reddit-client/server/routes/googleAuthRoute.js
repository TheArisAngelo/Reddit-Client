// ADD this route to your existing server/routes/auth.js file
// This handles Google sign-in from the frontend

const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const jwt = require("jsonwebtoken");
const User = require("../models/User"); // adjust path if needed

// ─── POST /api/auth/google ────────────────────────────────────────────────────
// Frontend sends Firebase token → we verify it → return our own JWT
router.post("/google", async (req, res) => {
  const { firebaseToken } = req.body;

  if (!firebaseToken) {
    return res.status(400).json({ message: "No Firebase token provided" });
  }

  try {
    // Step 1: Verify the Firebase token is real
    const decoded = await admin.auth().verifyIdToken(firebaseToken);

    const { uid, email, name, picture } = decoded;

    // Step 2: Find or create user in MongoDB
    let user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      // First time Google login — create a new user in MongoDB
      user = await User.create({
        firebaseUid: uid,
        username: name || email.split("@")[0], // use Google name or email prefix
        email,
        avatar: picture || "",
        // No password needed for Google users
      });
    }

    // Step 3: Issue your own JWT so the rest of your app works as normal
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      token,
      user: {
        username: user.username,
        email: user.email,
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
