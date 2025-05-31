// main.js

// 0) SLIDER HERO (tu código existente)
const hero = document.querySelector('.hero');
const slides = [
  './img/avion.png',
  './img/buenosaires1.jpg',
  './img/buenosaires2.jpg',
  './img/tango.jpg'
];
let current = 0;
function nextSlide() {
  hero.style.backgroundImage = `url(${slides[current]})`;
  current = (current + 1) % slides.length;
}
nextSlide();
setInterval(nextSlide, 5000);

// 1) REFERENCIAS A FIREBASE (ya expuestas en window.auth y window.db)
const auth = window.auth;
const db   = window.db;

// 2) LOGIN / LOGOUT EN EL NAV
const nav            = document.querySelector('nav ul.navbar');
const loginBtn       = document.querySelector('#login-btn');
const logoutBtn      = document.querySelector('#logout-btn');
const reservasNavItem= document.querySelector('a[href="#mis-reservas"]');

// Observador de estado
auth.onAuthStateChanged(user => {
  if (user) {
    loginBtn?.classList.add('hidden');
    logoutBtn?.classList.remove('hidden');
    reservasNavItem?.classList.remove('hidden');

    // añade nombre en nav si no existe
    if (!document.querySelector('#nav-user')) {
      const li = document.createElement('li');
      li.id = 'nav-user';
      li.textContent = user.displayName;
      nav.append(li);
    }
  } else {
    loginBtn?.classList.remove('hidden');
    logoutBtn?.classList.add('hidden');
    reservasNavItem?.classList.add('hidden');
    document.querySelector('#nav-user')?.remove();
  }

  // 3) Carga o limpia "Mis Reservas" cada vez que cambia user
  cargarMisReservas(user);
});

// Botones de login/logout
loginBtn?.addEventListener('click', () =>
  auth.signInWithPopup(new firebase.auth.GoogleAuthProvider())
      .catch(_ => alert('No pudimos iniciar sesión.'))
);

logoutBtn?.addEventListener('click', () =>
  auth.signOut()
);

// 4) FUNCION PARA LEER Y PINTAR "MIS RESERVAS"
async function cargarMisReservas(user) {
  const cont = document.getElementById('mis-reservas');
  if (!cont) return;

  cont.innerHTML = '';             // limpio todo

  if (!user) {
    cont.innerHTML = `<p>Inicia sesión para ver tus reservas.</p>`;
    return;
  }

  cont.innerHTML = '<h2>Mis Reservas</h2><p>Cargando…</p>';
  try {
    const snap = await db.collection('reservations')
      .where('uid','==',user.uid)
      .orderBy('timestamp','desc')
      .get();

    if (snap.empty) {
      cont.innerHTML = '<h2>Mis Reservas</h2><p>No tienes reservas aún.</p>';
      return;
    }

    cont.innerHTML = '<h2>Mis Reservas</h2>';
    snap.forEach(doc => {
      const r = doc.data();
      const d = r.timestamp?.toDate
        ? r.timestamp.toDate()
        : new Date(r.timestamp.seconds * 1000);
      const div = document.createElement('div');
      div.classList.add('reserva-item');
      div.textContent = `${r.service} — ${d.toLocaleString()}`;
      cont.appendChild(div);
    });
  } catch (e) {
    console.error(e);
    cont.innerHTML = '<p>Error al cargar reservas.</p>';
  }
}

// 5) HANDLER DE "RESERVAR" POR CADA CARD
document.querySelectorAll('.card button').forEach(btn => {
  btn.addEventListener('click', async () => {
    let user = auth.currentUser;
    if (!user) {
      // forzamos login primero
      try {
        await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
        user = auth.currentUser;
      } catch {
        return alert('Necesitas iniciar sesión para reservar.');
      }
    }
    // tras login, guardamos la reserva
    const serviceId = btn.closest('.card').dataset.serviceId;
    await db.collection('reservations').add({
      uid: user.uid,
      service: serviceId,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    alert('¡Reserva realizada con éxito!');
    // y recargamos la lista
    cargarMisReservas(user);
  });
});

