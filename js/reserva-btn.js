// reserva-btn.js
import { auth } from './firebase.js';
import firebase from 'firebase/compat/app';

document.querySelectorAll('.btn-reservar').forEach(btn => {
  btn.addEventListener('click', async e => {
    e.preventDefault();

    let user = auth.currentUser;

    if (!user) {
      try {
        const result = await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
        user = result.user;
      } catch {
        return alert('Necesitas iniciar sesión para reservar.');
      }
    }

    const serviceId = btn.closest('.card').dataset.serviceId;
    window.location.href = `pages/reservas.html?service=${encodeURIComponent(serviceId)}`;
  });
});
