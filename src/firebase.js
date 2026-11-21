// Firebase 연결 (timebean-4de50 공용 Auth + Firestore)
// 설정값은 .env.local (Git 제외) 또는 GitHub Actions Secrets(VITE_FIREBASE_*)에서 주입한다.
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";

const env = import.meta.env || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyArOBkscLILvwAiQ3QlBSt1aUFW8zgTfg0",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "timebean-4de50.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "timebean-4de50",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "timebean-4de50.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1012941948842",
  appId: env.VITE_FIREBASE_APP_ID || "1:1012941948842:web:5380627f433f6d8f728dd3",
};

export const firebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
);

let authInstance = null;
let dbInstance = null;

if (firebaseConfigured) {
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  authInstance = getAuth(app);
  dbInstance = initializeFirestore(app, {});
}

export const auth = authInstance;
export const db = dbInstance;
