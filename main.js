// main.js

// ────────────────────────────────────────────────────
// 1) Alias de Firebase (declarados en tu index.html)
// ────────────────────────────────────────────────────
const auth = window.auth;
const db   = window.db;

// ────────────────────────────────────────────────────
// 2) Referencias al NAV – login/logout/reservas
// ────────────────────────────────────────────────────
const nav           = document.querySelector('nav ul.navbar');
const loginBtn      = document.getElementById('login-btn');
const logoutBtn     = document.getElementById('logout-btn');
const reservasLink  = document.querySelector('a[href="#mis-reservas"]');

// Estado inicial: solo muestro “Iniciar con Google”
loginBtn.hidden     = false;
logoutBtn.hidden    = true;
if (reservasLink) reservasLink.hidden = true;

// ────────────────────────────────────────────────────
// 3) Observador de estado de autenticación
// ────────────────────────────────────────────────────
auth.onAuthStateChanged(user => {
  if (user) {
    // Usuario logueado
    loginBtn.hidden     = true;
    logoutBtn.hidden    = false;
    if (reservasLink) reservasLink.hidden = false;

    // Añade nombre de usuario al NAV si no existe
    if (!document.getElementById('nav-user')) {
      const li = document.createElement('li');
      li.id = 'nav-user';
      li.textContent = user.displayName;
      nav.appendChild(li);
    }
  } else {
    // Usuario desconectado
    loginBtn.hidden     = false;
    logoutBtn.hidden    = true;
    if (reservasLink) reservasLink.hidden = true;

    // Elimina el nombre de usuario si está
    document.getElementById('nav-user')?.remove();
  }
});

// ────────────────────────────────────────────────────
// 4) Login / Logout con Google
// ────────────────────────────────────────────────────
loginBtn.addEventListener('click', () => {
  auth.signInWithPopup(new firebase.auth.GoogleAuthProvider())
      .catch(err => {
        console.error('Error login:', err);
        alert('No pudimos iniciar sesión.');
      });
});

logoutBtn.addEventListener('click', () => {
  auth.signOut()
      .catch(err => {
        console.error('Error logout:', err);
        alert('Error cerrando sesión.');
      });
});

// ────────────────────────────────────────────────────
// 5) Botones “Reservar” → forzar login y redirigir
// ────────────────────────────────────────────────────
document.querySelectorAll('.btn-reservar').forEach(btn => {
  btn.addEventListener('click', async e => {
    e.preventDefault();

    let user = auth.currentUser;
    if (!user) {
      // Si no está logueado, forzamos el popup
      try {
        const result = await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
        user = result.user;
      } catch {
        return alert('Necesitas iniciar sesión para reservar.');
      }
    }

    // Redirijo con el parámetro service
    const serviceId = btn.closest('.card').dataset.serviceId;
    window.location.href = `pages/reservas.html?service=${encodeURIComponent(serviceId)}`;
  });
});

// ────────────────────────────────────────────────────
// 6) Formulario de Contacto → validación + Firestore
// ────────────────────────────────────────────────────
const contactForm = document.querySelector('.contact-form');
console.log('Contacto: from encontrado?', !!contactForm);
if (contactForm) {
  // Creo mensaje de éxito oculto
  const successMsg = document.createElement('div');
  successMsg.className    = 'success-message';
  successMsg.textContent  = '¡Gracias! Tu mensaje fue enviado.';
  successMsg.style.display = 'none';
  contactForm.parentNode.insertBefore(successMsg, contactForm.nextSibling);

  contactForm.addEventListener('submit', async e => {
    e.preventDefault();

    // Recojo y valido campos
    const name    = e.target.name.value.trim();
    const email   = e.target.email.value.trim();
    const message = e.target.message.value.trim();
    if (!name || !email || !message) {
      return alert('Por favor completa todos los campos.');
    }

    try {
      // Guardo en Firestore
      await db.collection('messages').add({
        name,
        email,
        message,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      // Muestro mensaje de éxito y limpio form
      successMsg.style.display = 'block';
      contactForm.reset();
      setTimeout(() => successMsg.style.display = 'none', 5000);
    } catch (err) {
      console.error('Error enviando mensaje:', err);
      alert('Hubo un problema al enviar tu mensaje. Intenta de nuevo.');
    }
  });
} else {
  console.warn('No se encontró .contact-form en el DOM');
}








