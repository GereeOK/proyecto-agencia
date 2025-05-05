const hero = document.querySelector('.hero');
const slides = [
'./img/avion.png',
'./img/buenosaires1.jpg',
'./img/buenosaires2.jpg',
'./img/tango.jpg' ];
let current = 0;
function nextSlide() {
hero.style.backgroundImage = `url(${slides[current]})`;
current = (current + 1) % slides.length;
}

// Arranca inmediatamente y luego cada 5 s
nextSlide();
setInterval(nextSlide, 5000);

// Referencias a Firebase (ya expuestas en window.auth y window.db)
const auth = window.auth;

// Apunta a todos los botones de “Reservar”
const botonesReservar = document.querySelectorAll('.btn-reservar');

// Contenedor de tu formulario (puede ser un modal o sección oculta)
const formReserva = document.getElementById('reserveForm');
const reservaServicioInput = document.getElementById('reservaServicio');

// Función que muestra el formulario y precarga el nombre del servicio
function abrirFormulario(servicio) {
  reservaServicioInput.value = servicio;
  formReserva.style.display = 'block';
}

// Handler para cuando el usuario hace clic en “Reservar”
botonesReservar.forEach(btn => {
  btn.addEventListener('click', async () => {
    const servicio = btn.closest('.card').dataset.servicio;
    const user = auth.currentUser;

    if (!user) {
      // Pide login con Google
      try {
        await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
        // Una vez logueado, abre el form
        abrirFormulario(servicio);
      } catch (err) {
        console.error('Error de login:', err);
        alert('No pudimos iniciar sesión.');
      }
    } else {
      // Ya estaba logueado: abrimos el form de una
      abrirFormulario(servicio);
    }
  });
});


