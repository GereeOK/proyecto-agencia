// reserva-form.js
import { auth, db } from './firebase.js';
import firebase from 'firebase/compat/app';


const selectedContainer = document.getElementById('selected-services');
const bookingForm = document.getElementById('booking-form');
const servicesBoxes = document.getElementById('services-boxes');

if (selectedContainer && bookingForm && servicesBoxes) {
    const params = new URLSearchParams(window.location.search);
    const defaultServiceId = params.get('service');

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
        })
    }

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
            }
        } catch (err) {
            console.error('Error guardando reserva:', err);
            alert('Hubo un problema al registrar la reserva.');
        }
    });

    renderSelected();
}
