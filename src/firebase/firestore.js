// ==========================================
// FIREBASE – FIRESTORE FUNCTIONS
// Ordenado por tipo: Usuarios / Servicios / Reservas / Consultas / Empresas
// ==========================================

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

// ==========================================
// 1. USUARIOS
// ==========================================

// Crear usuario con uid
export const saveUser = (uid, email) => {
  return setDoc(doc(db, "users", uid), { email, role: "user" });
};

// Traer todos los usuarios
export const fetchUsuarios = async () => {
  const snapshot = await getDocs(collection(db, "users"));
  return snapshot.docs.map(d => ({ uid: d.id, ...d.data() }));
};

// ==========================================
// 2. SERVICIOS
// ==========================================

// Crear servicio
export const createServicio = async (servicio) => {
  const ref = await addDoc(collection(db, "servicios"), {
    ...servicio,
    timestamp: serverTimestamp(),
  });
  return ref.id;
};

// Traer TODOS los servicios
export const fetchServicios = async () => {
  const snapshot = await getDocs(collection(db, "servicios"));
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

// Traer servicios según COMPANY ID
export const fetchServiciosByCompany = async (companyId) => {
  const serviciosRef = collection(db, "servicios");
  const q = query(serviciosRef, where("companyId", "==", companyId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

// Actualizar un servicio
export const updateServicio = async (id, cambios) => {
  const ref = doc(db, "servicios", id);
  await updateDoc(ref, {
    ...cambios,
    timestamp: serverTimestamp(),
  });
};

// Borrar servicio
export const deleteServicio = async (id) => {
  await deleteDoc(doc(db, "servicios", id));
};

// ==========================================
// 3. RESERVAS
// ==========================================

// Crear reserva
export const saveReserva = async (reserva) => {
  return addDoc(collection(db, "reservas"), {
    ...reserva,
    timestamp: serverTimestamp(),
  });
};

// Traer reservas por usuario
export const fetchReservasByUser = async (userEmail) => {
  const reservasRef = collection(db, "reservas");
  const q = query(reservasRef, where("email", "==", userEmail));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

// Admin: traer **todas** las reservas
export const fetchReservas = async () => {
  const snapshot = await getDocs(collection(db, "reservas"));
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

// Actualizar reserva
export const updateReserva = async (reserva) => {
  const { id, ...rest } = reserva;
  await updateDoc(doc(db, "reservas", id), {
    ...rest,
    timestamp: serverTimestamp(),
  });
};

// Borrar reserva
export const deleteReserva = async (reservaId) => {
  await deleteDoc(doc(db, "reservas", reservaId));
};

// ==========================================
// 4. CONSULTAS (CONTACT FORM)
// ==========================================

// Crear consulta
export const sendConsulta = async ({ name, email, message }) => {
  await addDoc(collection(db, "messages"), {
    name,
    email,
    message,
    timestamp: serverTimestamp(),
  });
};

// Traer consultas
export const fetchConsultas = async () => {
  const snapshot = await getDocs(collection(db, "messages"));
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

// ==========================================
// 5. EMPRESAS
// ==========================================

// Traer datos de la empresa según companyId
export const getCompanyByUser = async (companyId) => {
  if (!companyId) return null;

  try {
    const companiesRef = collection(db, "companies");
    const q = query(companiesRef, where("__name__", "==", companyId));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      return snapshot.docs[0].data();
    }

    return null;
  } catch (error) {
    console.error("Error fetching company data:", error);
    return null;
  }
};

// Update empresa
export const updateCompany = async (companyId, updates) => {
  if (!companyId || !updates) return;

  try {
    const ref = doc(db, "companies", companyId);
    await updateDoc(ref, {
      ...updates,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error actualizando la empresa:", error);
    throw error;
  }
};

