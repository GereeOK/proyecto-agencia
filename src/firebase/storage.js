// storage.js
// MEJORA (RNF-04 – Rendimiento): Se agrega un nombre único al archivo usando
// timestamp para evitar colisiones si dos imágenes tienen el mismo nombre.
// También se exporta correctamente (export default → export named) para
// consistencia con el resto del proyecto que usa named exports.

import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "./config";

// CORRECCIÓN: El archivo original importaba "app" como default export
// (import app from "./config") pero config.js usa named export.
// Ahora se usa el named import correcto: import { app } from "./config".
const storage = getStorage(app);

export const uploadImage = async (file) => {
  // MEJORA: Se agrega timestamp al nombre del archivo para evitar que dos
  // imágenes con el mismo nombre se sobreescriban en Firebase Storage.
  const uniqueName = `${Date.now()}_${file.name}`;
  const storageRef = ref(storage, `images/${uniqueName}`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return url;
};
