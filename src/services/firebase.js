import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration - Replace with your actual Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyCoKgWcVWbQnUWoSrNbZRdFN144cNqU8-s",
  authDomain: "vr-school-4d9da.firebaseapp.com",
  projectId: "vr-school-4d9da",
  storageBucket: "vr-school-4d9da.firebasestorage.app",
  messagingSenderId: "1074963145481",
  appId: "1:1074963145481:web:75534f0b73885b91fb29d8",
  measurementId: "G-2X6L3VG29T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
