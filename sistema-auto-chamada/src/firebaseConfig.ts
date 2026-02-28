import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// 1. Defina a configuração primeiro
const firebaseConfig = {
  apiKey: "AIzaSyCFY49weqT-_5cw6RU6FijS1cOy3FLvPE4",
  authDomain: "sistema-auto-chamada.firebaseapp.com",
  projectId: "sistema-auto-chamada",
  storageBucket: "sistema-auto-chamada.firebasestorage.app",
  messagingSenderId: "771695315375",
  appId: "1:771695315375:web:16ee1a1c3f5a010f39875a",
  measurementId: "G-12STKH8Y6Z"
};

// 2. Inicialize o Firebase uma única vez
const app = initializeApp(firebaseConfig);

// 3. Exporte os serviços
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);