import {
  getFirestore,
  collection,
  addDoc,
  setDoc,
  doc,
  getDocs,
  query,
  where,
  serverTimestamp,
  deleteDoc,
  updateDoc
} from "firebase/firestore";
import { app } from "./config";

const db = getFirestore(app);

// 1. Guardar un usuario con su uid y email (y rol "user")
export const saveUser = (uid, email) => {
  return setDoc(doc(db, "users", uid), { email, role: "user" });
};

// 2. Guardar una reserva en la colección "reservas"
export const saveReserva = (reserva) => {
  return addDoc(collection(db, "reservas"), {
    ...reserva,
    timestamp: serverTimestamp(),
  });
};

// 3. Crear un nuevo servicio
export const createServicio = async (servicio) => {
  // 'servicio' debe ser un objeto con { title, description, image, sellerId, ... }
  const ref = await addDoc(collection(db, "servicios"), {
    ...servicio,
    timestamp: serverTimestamp(),
  });
  return ref.id;
};

// 4. Traer todos los documentos de la colección "servicios"
export const fetchServicios = async () => {
  const snapshot = await getDocs(collection(db, "servicios"));
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

// 5. Enviar una consulta a la colección "messages"
export const sendConsulta = async ({ name, email, message }) => {
  await addDoc(collection(db, "messages"), {
    name,
    email,
    message,
    timestamp: serverTimestamp(),
  });
};

// 6. Traer reservas asociadas a un usuario (por ejemplo, por email)
export const fetchReservasByUser = async (userEmail) => {
  const reservasRef = collection(db, "reservas");
  const q = query(reservasRef, where("email", "==", userEmail));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

// 7. Actualizar un servicio existente
export const updateServicio = async (id, cambios) => {
  const ref = doc(db, "servicios", id);
  await updateDoc(ref, {
    ...cambios,
    timestamp: serverTimestamp(),
  });
};

// 8. Borrar un servicio
export const deleteServicio = async (id) => {
  const ref = doc(db, "servicios", id);
  await deleteDoc(ref);
};

// 9. Editar y borrar reservas
export const updateReserva = async (reserva) => {
  const { id, ...rest } = reserva;
  await updateDoc(doc(db, "reservas", id), {
    ...rest,
    timestamp: serverTimestamp(),
  });
};
export const deleteReserva = async (reservaId) => {
  await deleteDoc(doc(db, "reservas", reservaId));
};

// 10. Traer todos los usuarios
export const fetchUsuarios = async () => {
  const snapshot = await getDocs(collection(db, "users"));
  return snapshot.docs.map(d => ({ uid: d.id, ...d.data() }));
};

// 11. Traer todas las reservas (admin)
export const fetchReservas = async () => {
  const snapshot = await getDocs(collection(db, "reservas"));
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

// 12. Traer todas las consultas
export const fetchConsultas = async () => {
  const snapshot = await getDocs(collection(db, "messages"));
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

// 13. Traer los servicios por companyId
export const fetchServiciosByCompany = async (companyId) => {
  const serviciosRef = collection(db, "servicios");
  const q = query(serviciosRef, where("companyId", "==", companyId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

// 14. Traer los datos de las empresas (sin usar getDoc, igual que las otras funciones)
export const getCompanyByUser = async (companyId) => {
  if (!companyId) return null;

  try {
    const companiesRef = collection(db, "companies");
    const q = query(companiesRef, where("__name__", "==", companyId));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return doc.data();
    }
    return null;
  } catch (error) {
    console.error("Error fetching company data:", error);
    return null;
  }
};

// 15. Actualizar la empresa (nombre y/o logo)
export const updateCompany = async (companyId, updates) => {
  if (!companyId || !updates) return;

  try {
    const companyRef = doc(db, "companies", companyId);
    await updateDoc(companyRef, {
      ...updates,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error actualizando la empresa:", error);
    throw error;
  }
};

