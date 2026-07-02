// Import only what we need — Auth and Firestore
import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

// These values come from your .env file
// NEVER hardcode keys directly here
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Initialize Firebase app with our config
const app = initializeApp(firebaseConfig)

// Auth instance — used for Google Sign-In
export const auth = getAuth(app)

// Google provider — tells Firebase we want Google login
export const googleProvider = new GoogleAuthProvider()

// Firestore instance — used for saving/reading data
export const db = getFirestore(app)