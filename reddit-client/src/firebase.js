import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
 
const firebaseConfig = {
  apiKey: "AIzaSyD4QUGQcXn6JSqw7OK7HE3vR2aLGgSXUPo",
  authDomain: "spendwise-a2f98.firebaseapp.com",
  projectId: "spendwise-a2f98",
  storageBucket: "spendwise-a2f98.firebasestorage.app",
  messagingSenderId: "770572877179",
  appId: "1:770572877179:web:30f13cb4a4b470753551de",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

