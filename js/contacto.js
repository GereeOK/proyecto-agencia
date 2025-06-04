// contacto.js
import { db } from './firebase.js';
import firebase from 'firebase/compat/app';

const contactForm = document.querySelector('.contact-form');
console.log('Contacto: form encontrado?', !!contactForm);

if (contactForm) {
  const successMsg = document.createElement('div');
  successMsg.className = 'success-message';
  successMsg.textContent = '¡Gracias! Tu mensaje fue enviado.';
  successMsg.style.display = 'none';
  contactForm.parentNode.insertBefore(successMsg, contactForm.nextSibling);

  contactForm.addEventListener('submit', async e => {
    e.preventDefault();

    const name = e.target.name.value.trim();
    const email = e.target.email.value.trim();
    const message = e.target.message.value.trim();

    if (!name || !email || !message) {
      return alert('Por favor completa todos los campos.');
    }

    try {
      await db.collection('messages').add({
        name,
        email,
        message,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });

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
