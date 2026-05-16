import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD9iNgPSzrxpvtLiaoFXQnWSoy8tEfrERU",
  authDomain: "spenwise-3096b.firebaseapp.com",
  projectId: "spenwise-3096b",
  storageBucket: "spenwise-3096b.firebasestorage.app",
  messagingSenderId: "232259538902",
  appId: "1:232259538902:web:e20ee20bd312bff14d5e77",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
