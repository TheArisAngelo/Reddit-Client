const jwt = require("jsonwebtoken");
const admin = require("firebase-admin");

module.exports = async function (req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1].trim();

  // ─── Try your own JWT first ───────────────────────────────────────────────
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch {
    // Not a valid JWT — try Firebase token next
  }

  // ─── Try Firebase token ───────────────────────────────────────────────────
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = { id: decoded.uid, email: decoded.email };
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};
