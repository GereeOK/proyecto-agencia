// contacto.js

const contactForm = document.querySelector('.contact-form');
console.log('Contacto: form encontrado?', !!contactForm);

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
      // Guardar en Firestore
      await db.collection('messages').add({
        name,
        email,
        message,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Mostrar mensaje de éxito y limpiar el form
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
