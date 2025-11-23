// Initialize Firebase
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCv3dM4Tm94cDo72dlzQFXK-Yt405rzgi0",
  authDomain: "queuefree-app.firebaseapp.com",
  projectId: "queuefree-app",
  storageBucket: "queuefree-app.firebasestorage.app",
  messagingSenderId: "974922067064",
  appId: "1:974922067064:web:98b0178bd743db7520518d",
  measurementId: "G-P3PFGMSEPM"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const functions = getFunctions(app, 'us-central1'); // Specify region