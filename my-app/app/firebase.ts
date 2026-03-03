import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey:            "AIzaSyBO2fmkGoxJxL4r_z_Bvqw31hpNWC0hF0o",
  authDomain:        "kiova-cddb5.firebaseapp.com",
  projectId:         "kiova-cddb5",
  storageBucket:     "kiova-cddb5.firebasestorage.app",
  messagingSenderId: "730203073826",
  appId:             "1:730203073826:web:80c0df95b45f395c28c97b",
  measurementId:     "G-XBRVETZ358",
};

// Prevent re-initialising on hot reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export default app;
