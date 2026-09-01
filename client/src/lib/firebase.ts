// Blue Decore Firebase client setup for authentication and analytics.
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBDfKknrSnsfkkoUYWA0oiN8SvTFaiz99s",
  authDomain: "blue-decore.firebaseapp.com",
  projectId: "blue-decore",
  storageBucket: "blue-decore.firebasestorage.app",
  messagingSenderId: "49207178042",
  appId: "1:49207178042:web:75574a3e86680dc502d603",
  measurementId: "G-8K69HDP3E9",
};

const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

if (typeof window !== "undefined" && firebaseConfig.measurementId) {
  void isSupported().then((supported) => {
    if (supported) getAnalytics(firebaseApp);
  }).catch(() => undefined);
}

export const firebaseAuth = getAuth(firebaseApp);
