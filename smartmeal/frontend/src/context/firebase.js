import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCMokOobnLbdZgBR9X7GXsxOq4k0OHk400",
  authDomain: "smart-meal-plan.firebaseapp.com",
  projectId: "smart-meal-plan",
  storageBucket: "smart-meal-plan.firebasestorage.app",
  messagingSenderId: "261090836955",
  appId: "1:261090836955:web:0814fbaaaa371e21ab67fe"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
