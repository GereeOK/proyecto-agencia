// auth.js
import { auth } from './firebase.js';
import firebase from 'firebase/compat/app';


const nav = document.querySelector('nav ul.navbar');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const reservasLink = document.getElementById('mis-reservas-link');

// Estado inicial del navbar
loginBtn.hidden = false;
logoutBtn.hidden = true;
if (reservasLink) reservasLink.hidden = true;

// Funciones auxiliares
function hasBooking(user) {
  if (!user) return false;
  return localStorage.getItem(`hasBooking_${user.uid}`) === 'true';
}

function hasDraft(user) {
  if (!user) return false;
  return !!localStorage.getItem(`reservaDraft_${user.uid}`);
}

function updateReservasLink(user) {
  if (!reservasLink) return;
  const visible = !!(user && (hasDraft(user) || hasBooking(user)));
  reservasLink.hidden = !visible;
}

// Observador de estado de autenticación
auth.onAuthStateChanged(user => {
  if (user) {
    loginBtn.hidden = true;
    logoutBtn.hidden = false;
    updateReservasLink(user);

    // Añadir nombre de usuario
    if (!document.getElementById('nav-user')) {
      const li = document.createElement('li');
      li.id = 'nav-user';
      li.textContent = user.displayName;
      nav.appendChild(li);
    }
  } else {
    loginBtn.hidden = false;
    logoutBtn.hidden = true;
    updateReservasLink(null);
    document.getElementById('nav-user')?.remove();
  }
});

const modal = document.getElementById("login-modal");
const openBtn = document.getElementById("open-login-modal");
const closeBtn = document.getElementById("close-login-modal");
const loginForm = document.getElementById("login-form");
const googleLoginBtn = document.getElementById("google-login-btn");

// Mostrar modal
openBtn.addEventListener("click", () => modal.classList.remove("hidden"));

// Cerrar modal
closeBtn.addEventListener("click", () => modal.classList.add("hidden"));

// Iniciar sesión con correo y contraseña
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      modal.classList.add("hidden");
      alert("¡Bienvenido!");
      // Redirigir según rol aquí si querés
    })
    .catch((error) => {
      alert("Error: " + error.message);
    });
});

// Iniciar sesión con Google
googleLoginBtn.addEventListener("click", () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider)
    .then((result) => {
      modal.classList.add("hidden");
      alert("¡Sesión iniciada con Google!");
    })
    .catch((error) => {
      alert("Error: " + error.message);
    });
});

// Logout
logoutBtn.addEventListener('click', () => {
  auth.signOut()
      .catch(err => {
        console.error('Error logout:', err);
        alert('Error cerrando sesión.');
      });
});
