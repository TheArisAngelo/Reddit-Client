// Clean user input before sending to API
export const sanitize = (str) => str.trim().replace(/<[^>]*>/g, "");

// Use in LoginPage.js and SignUpPage.jsx
import { sanitize } from "../utils/sanitize";

const handleSubmit = () => {
  const cleanEmail = sanitize(email);
  const cleanPassword = sanitize(password);
  // then send to API
};
