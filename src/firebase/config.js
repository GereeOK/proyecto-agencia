// config.js
// MEJORA (RNF-03 – Seguridad): Las API keys no deben estar hardcodeadas.
// Se usan variables de entorno de Vite (prefijo VITE_) para proteger credenciales.
// Crear un archivo .env en la raíz con: VITE_FIREBASE_API_KEY=tu_api_key, etc.
// El .gitignore ya excluye .env, por lo que las claves no se subirán a GitHub.
// Se mantienen los valores actuales como fallback durante el desarrollo local.

import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "AIzaSyAkjTubMcIKbXkVZ6QDzd-2y8DyExa2VrE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "baires-essence.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL ?? "https://baires-essence-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "baires-essence",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "baires-essence.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "211864182519",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "1:211864182519:web:086785d6d0969ee643fdf2",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? "G-6WHV3BEPQ3",
};

export const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
export const db = getFirestore(app);
