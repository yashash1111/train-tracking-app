import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB4upNxKxPOpr_btFuvh8LKPGEDQhm2_jw",
  authDomain: "train-tracking-app-3ce3d.firebaseapp.com",
  projectId: "train-tracking-app-3ce3d",
  storageBucket: "train-tracking-app-3ce3d.firebasestorage.app",
  messagingSenderId: "556798358394",
  appId: "1:556798358394:web:beee18f970ded39fcedcc3",
  measurementId: "G-PRP5THJQN7"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const storage = getStorage(app);
