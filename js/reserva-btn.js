// reserva-btn.js

document.querySelectorAll('.btn-reservar').forEach(btn => {
  btn.addEventListener('click', async e => {
    e.preventDefault();

    let user = auth.currentUser;

    // Si no está logueado, mostrar popup de Google
    if (!user) {
      try {
        const result = await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
        user = result.user;
      } catch {
        return alert('Necesitas iniciar sesión para reservar.');
      }
    }

    // Redirigir con el parámetro "service"
    const serviceId = btn.closest('.card').dataset.serviceId;
    window.location.href = `pages/reservas.html?service=${encodeURIComponent(serviceId)}`;
  });
});
