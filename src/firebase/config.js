// config.js
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAkjTubMcIKbXkVZ6QDzd-2y8DyExa2VrE",
  authDomain: "baires-essence.firebaseapp.com",
  databaseURL: "https://baires-essence-default-rtdb.firebaseio.com",
  projectId: "baires-essence",
  storageBucket: "baires-essence.firebasestorage.app",
  messagingSenderId: "211864182519",
  appId: "1:211864182519:web:086785d6d0969ee643fdf2",
  measurementId: "G-6WHV3BEPQ3"
};

export const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
