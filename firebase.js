// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.x.x/firebase-app.js";

const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROYECTO",
  // …el resto de campos…
};

const app = initializeApp(firebaseConfig);
export default app;
