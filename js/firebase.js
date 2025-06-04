// firebase.js (sin import, usa objetos globales ya cargados desde el <script>)
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "baires-essence.firebaseapp.com",
  projectId: "baires-essence",
  storageBucket: "baires-essence.appspot.com",
  messagingSenderId: "211864182519",
  appId: "1:211864182519:web:086785d6d0969ee643fdf2",
  measurementId: "G-6WHV3BEPQ3"
};

// Inicializar Firebase si no está inicializado
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Exportar globalmente para que esté disponible en otros archivos
window.firebase = firebase;
window.auth = firebase.auth();
window.db = firebase.firestore();
