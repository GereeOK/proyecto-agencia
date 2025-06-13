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
const reservasLink  = document.getElementById('mis-reservas-link');
const menuToggle    = document.getElementById('menu-toggle');

const languageSelect = document.getElementById('language-select');
const translations = {
  es: {
    nav_inicio: "Inicio",
    nav_nosotros: "Nosotros",
    nav_servicios: "Servicios",
    nav_contacto: "Contacto",
    login: "Iniciar con Google",
    logout: "Cerrar sesi\xC3\xB3n",
    hero_title: "BAIRES ESSENCE",
    hero_text: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Totam et ducimus accusamus laboriosam sint, iure voluptatem provident beatae reprehenderit nostrum quaerat tempore maxime fugiat eos ab! Repudiandae nobis autem obcaecati!",
    see_more: "Ver m\xC3\xA1s",
    about_title: "Nosotros",
    about_text: "En <strong>Baires Essence</strong> somos un equipo apasionado por mostrar lo mejor de Buenos Aires. Con a\xC3\xB1os de experiencia en turismo, dise\xC3\xB1amos experiencias a medida: desde traslados VIP en aeropuertos hasta inolvidables city-tours y estancias en la provincia. \xC2\xA1Te acompa\xC3\xB1amos en cada paso de tu viaje!",
    services_title: "Servicios",
    services_intro: "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Nisi ratione officiis cupiditate ea vitae vero pariatur porro soluta inventore ab corrupti, delectus dolor optio fuga explicabo assumenda deserunt. Eligendi, ut?",
    contact_title: "Formulario de Contacto",
    send_message: "Enviar Mensaje"
    booking_title: 'Completa tu Reserva',
    selected_services: 'Servicios Seleccionados',
    send_booking: 'Enviar reserva',
    booking_success: '¡Reserva confirmada! Pronto recibirás un correo de confirmación.'
  },
  en: {
    nav_inicio: "Home",
    nav_nosotros: "About Us",
    nav_servicios: "Services",
    nav_contacto: "Contact",
    login: "Sign in with Google",
    logout: "Sign out",
    hero_title: "BAIRES ESSENCE",
    hero_text: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Totam et ducimus accusamus laboriosam sint, iure voluptatem provident beatae reprehenderit nostrum quaerat tempore maxime fugiat eos ab! Repudiandae nobis autem obcaecati!",
    see_more: "See more",
    about_title: "About Us",
    about_text: "At <strong>Baires Essence</strong> we are a team passionate about showing the best of Buenos Aires. With years of experience in tourism, we design tailor-made experiences: from VIP airport transfers to unforgettable city tours and estancias in the province. We accompany you in every step of your trip!",
    services_title: "Services",
    services_intro: "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Nisi ratione officiis cupiditate ea vitae vero pariatur porro soluta inventore ab corrupti, delectus dolor optio fuga explicabo assumenda deserunt. Eligendi, ut?",
    contact_title: "Contact Form",
    send_message: "Send Message"
    booking_title: "Complete your Booking",
    selected_services: "Selected Services",
    send_booking: "Submit booking",
    booking_success: "Booking confirmed! You will receive an email soon."
  }
};

function applyTranslations(lang) {
  document.documentElement.lang = lang;
  const dict = translations[lang];
  if (!dict) return;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const text = dict[key];
    if (!text) return;
    if (el.placeholder !== undefined && el.tagName === 'INPUT') {
      el.placeholder = text;
    } else {
      el.innerHTML = text;
    }
  });
}

if (languageSelect) {
  const saved = localStorage.getItem('language') || 'es';
  languageSelect.value = saved;
  applyTranslations(saved);
  languageSelect.addEventListener('change', () => {
    const lang = languageSelect.value;
    localStorage.setItem('language', lang);
    applyTranslations(lang);
  });
}

if (menuToggle && nav) {
  menuToggle.addEventListener('click', () => {
    const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!expanded));
    nav.classList.toggle('open');
  });
}
// Estado inicial: solo muestro “Iniciar con Google”
loginBtn.hidden     = false;
logoutBtn.hidden    = true;
if (reservasLink) reservasLink.hidden = true;

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
function sendConfirmationEmail(success) {
  if (!window.emailjs) return;
  const templateParams = {
    to_email: bookingForm.email.value,
    status: success ? 'success' : 'failure'
  };
  emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', templateParams, 'YOUR_PUBLIC_KEY');
}

function initPayment(total) {
  if (!window.paypal) return;
  paypal.Buttons({
    createOrder: (data, actions) => {
      return actions.order.create({ purchase_units: [{ amount: { value: total.toString() } }] });
    },
    onApprove: (data, actions) => {
      return actions.order.capture().then(details => {
        sendConfirmationEmail(true);
        document.getElementById('payment-container').innerHTML = '<p>Pago completado</p>';
      });
    },
    onError: err => {
      console.error('Pago fallido', err);
      sendConfirmationEmail(false);
      document.getElementById('payment-container').innerHTML = '<p>Error en el pago</p>';
    }
  }).render('#payment-container');
}

// ────────────────────────────────────────────────────
// 3) Observador de estado de autenticación
// ────────────────────────────────────────────────────
auth.onAuthStateChanged(user => {
  if (user) {
    // Usuario logueado
    loginBtn.hidden     = true;
    logoutBtn.hidden    = false;
    updateReservasLink(user);
      initPayment(100);

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
    updateReservasLink(null); 

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

// ────────────────────────────────────────────────────
// 7) Página de reservas – mostrar servicio y guardar datos
// ────────────────────────────────────────────────────
const selectedContainer = document.getElementById('selected-services');
const bookingForm = document.getElementById('booking-form');
const servicesBoxes = document.getElementById('services-boxes');

if (selectedContainer && bookingForm && servicesBoxes) {
  const params = new URLSearchParams(window.location.search);
  const defaultServiceId = params.get('service');

  // Catálogo estático de servicios
  const services = {
    'traslados-aeroportuarios': {
      title: 'Traslados Aeroportuarios',
      img: '../img/img_ezeiza.jpg',
      desc: 'Servicio puerta-a-puerta desde y hacia los aeropuertos.'
    },
    'City Tours': {
      title: 'City Tours Esenciales',
      img: '../img/img_caminito-boca.jpg',
      desc: 'Recorre lo imprescindible de Buenos Aires en pocas horas.'
    },
    'City Tours Temáticos': {
      title: 'City Tours Temáticos',
      img: '../img/img_citytour.jpg',
      desc: 'Experiencias con sabor local por los barrios más emblemáticos.'
    },
    'Delta & Estancias': {
      title: 'Delta & Estancias',
      img: '../img/img_tigre.jpg',
      desc: 'Navegación por el Delta del Tigre y escapada a estancias.'
    },
    'Gourmet & Tango': {
      title: 'Gourmet & Tango',
      img: '../img/img_tango_show.jpg',
      desc: 'Cena gourmet seguida de un show de tango inolvidable.'
    },
    'Eventos & Servicios a Medida': {
      title: 'Eventos & Servicios a Medida',
      img: '../img/avion.png',
      desc: 'Chofer y vehículo disponibles por hora para tus eventos.'
    }
  };

  // Crear casillas de verificación
  Object.entries(services).forEach(([id, info]) => {
    const label = document.createElement('label');
    label.className = 'service-option';
    label.innerHTML = `<input type="checkbox" value="${id}"><span>${info.title}</span>`;
    const input = label.querySelector('input');
    if (id === defaultServiceId) {
      input.checked = true;
      label.classList.add('selected');
    }
    input.addEventListener('change', () => {
      label.classList.toggle('selected', input.checked);
      renderSelected();
    });
    servicesBoxes.appendChild(label);
  });

  function renderSelected() {
    selectedContainer.innerHTML = '<h2>Servicios Seleccionados</h2>';
    const ids = Array.from(servicesBoxes.querySelectorAll('input:checked')).map(i => i.value);
    if (!ids.length) {
      selectedContainer.innerHTML += '<p>No has seleccionado servicios.</p>';
      return;
    }
    ids.forEach(id => {
      const svc = services[id];
      if (!svc) return;
      const card = document.createElement('article');
      card.className = 'card';
      card.innerHTML = `
        <img src="${svc.img}" alt="${svc.title}">
        <h3>${svc.title}</h3>
        <p>${svc.desc}</p>
      `;
      selectedContainer.appendChild(card);
    });
  }

  renderSelected();

    function loadDraft() {
    const user = auth.currentUser;
    if (!user) return;
    const draftStr = localStorage.getItem(`reservaDraft_${user.uid}`);
    if (!draftStr) return;
    try {
      const draft = JSON.parse(draftStr);
      bookingForm.checkin.value = draft.checkin || '';
      bookingForm.checkout.value = draft.checkout || '';
      bookingForm.fullname.value = draft.fullname || '';
      bookingForm.email.value = draft.email || '';
      servicesBoxes.querySelectorAll('input').forEach(input => {
        const checked = draft.services?.includes(input.value);
        input.checked = checked;
        input.parentElement.classList.toggle('selected', checked);
      });
      renderSelected();
    } catch (e) {
      console.error('Error cargando borrador', e);
    }
  }

  function saveDraft() {
    const user = auth.currentUser;
    if (!user) return;
    const data = {
      services: Array.from(servicesBoxes.querySelectorAll('input:checked')).map(i => i.value),
      checkin: bookingForm.checkin.value,
      checkout: bookingForm.checkout.value,
      fullname: bookingForm.fullname.value,
      email: bookingForm.email.value
    };
    localStorage.setItem(`reservaDraft_${user.uid}`, JSON.stringify(data));
    updateReservasLink(user);
      initPayment(100);
  }

  auth.onAuthStateChanged(loadDraft);
  loadDraft();

  bookingForm.addEventListener('input', saveDraft);
  servicesBoxes.addEventListener('change', saveDraft);
  window.addEventListener('beforeunload', saveDraft);

  bookingForm.addEventListener('submit', async e => {
    e.preventDefault();

    const selectedIds = Array.from(servicesBoxes.querySelectorAll('input:checked')).map(i => i.value);

    const data = {
      services: selectedIds,
      checkin: bookingForm.checkin.value,
      checkout: bookingForm.checkout.value,
      fullname: bookingForm.fullname.value.trim(),
      email: bookingForm.email.value.trim(),
      userId: auth.currentUser ? auth.currentUser.uid : null,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
      await db.collection('bookings').add(data);
      document.getElementById('booking-success').style.display = 'block';
      bookingForm.reset();
      const user = auth.currentUser;
      if (user) {
        localStorage.removeItem(`reservaDraft_${user.uid}`);
        localStorage.setItem(`hasBooking_${user.uid}`, 'true');
        updateReservasLink(user);
      initPayment(100);
      }
    } catch (err) {
      console.error('Error guardando reserva:', err);
      alert('Hubo un problema al registrar la reserva.');
    }
  });
}





