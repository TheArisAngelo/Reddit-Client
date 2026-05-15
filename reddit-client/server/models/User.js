const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    mobileNumber: {
      type: String,
      required: true,
    email: {
      type: String,
      trim: true,
      default: "",
    },
    firebaseUid: {
      type: String,
      default: "",
    },
    password: {
      type: String,
      default: "", 
    },
    mobileNumber: {
      type: String,
      default: "", 
      trim: true,
    },
    country: {
      type: String,
      required: true,
      default: "", 
      trim: true,
    },
    place: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      default: "", 
      trim: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    currentBalance: {
      type: Number,
      default: 0,
    },
    transactions: {
      type: Array,
      default: [],
    },
    budgets: {
      type: Array,
      default: [],
    },
    savingsGoals: {
      type: Array,
      default: [],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
