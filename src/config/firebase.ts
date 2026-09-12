import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, isSupported } from "firebase/messaging";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDqtSQFtjtuuZ8BArVOx82GAYA6Pxu0cAc",
  authDomain: "smart-campus-v2-3534a.firebaseapp.com",
  projectId: "smart-campus-v2-3534a",
  storageBucket: "smart-campus-v2-3534a.firebasestorage.app",
  messagingSenderId: "577559919340",
  appId: "1:577559919340:web:627b59e7f9bfa718fdc3c9",
  measurementId: "G-93TD6LENMN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Export API key for serverless admin operations (used to create auth users without signing in)
export const FIREBASE_API_KEY = firebaseConfig.apiKey;

// ✅ Messaging SAFE INIT (important fix)
let messaging = null;

isSupported().then((supported) => {
  if (supported) {
    messaging = getMessaging(app);
  }
});

export { messaging };

export default app;