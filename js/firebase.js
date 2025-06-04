// firebase.js
import firebase from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js";
import "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js";
import "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js";

const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "baires-essence.firebaseapp.com",
  projectId: "baires-essence",
  storageBucket: "baires-essence.appspot.com",
  messagingSenderId: "211864182519",
  appId: "1:211864182519:web:086785d6d0969ee643fdf2",
  measurementId: "G-6WHV3BEPQ3"
};

// Inicializar Firebase una sola vez
const app = !firebase.apps.length
  ? firebase.initializeApp(firebaseConfig)
  : firebase.app();

const auth = firebase.auth();
const db = firebase.firestore();

export { app, auth, db };
