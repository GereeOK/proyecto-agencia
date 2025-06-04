// auth.js

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

// Login con Google
loginBtn.addEventListener('click', () => {
  auth.signInWithPopup(new firebase.auth.GoogleAuthProvider())
      .catch(err => {
        console.error('Error login:', err);
        alert('No pudimos iniciar sesión.');
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
