const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// SIGNUP
const signUp = async (req, res) => {
  const { email, password } = req.body;

  // Hash password before saving
  const hashedPassword = await bcrypt.hash(password, 12);

  // Save user with hashedPassword to your DB here
  // const newUser = await User.create({ email, password: hashedPassword });

  res.status(201).json({ message: "User created successfully" });
};

// LOGIN
const login = async (req, res) => {
  const { email, password } = req.body;

  // Fetch user from DB
  // const user = await User.findOne({ email });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

  // Issue JWT token
  const token = jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );

  res.json({ token });
};

module.exports = { signUp, login };
