// firebase.js

// Este archivo supone que Firebase ya fue cargado vía CDN en el HTML.
// Solo configura alias globales para comodidad en el resto del código.

window.auth = firebase.auth();
window.db = firebase.firestore();
