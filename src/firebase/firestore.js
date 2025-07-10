import { 
  getFirestore, 
  collection, 
  addDoc, 
  setDoc, 
  doc, 
  getDocs, 
  query,
  where,
  serverTimestamp 
} from "firebase/firestore";
import { app } from "./config";

const db = getFirestore(app);

// Guardar un usuario con su uid y email (y rol "user")
export const saveUser = (uid, email) => {
  return setDoc(doc(db, "users", uid), { email, role: "user" });
};

// Guardar una reserva en la colección "reservas"
export const saveReserva = (reserva) => {
  return addDoc(collection(db, "reservas"), {
    ...reserva,
    timestamp: serverTimestamp(),
  });
};

// Traer todos los documentos de la colección "servicios"
export const fetchServicios = async () => {
  const snapshot = await getDocs(collection(db, "servicios"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Enviar una consulta a la colección "messages"
export const sendConsulta = async ({ name, email, message }) => {
  const consultasRef = collection(db, "messages");
  await addDoc(consultasRef, {
    name,
    email,
    message,
    timestamp: serverTimestamp(),
  });
};

// Traer reservas asociadas a un usuario (por ejemplo, por email)
export const fetchReservasByUser = async (userEmail) => {
  const reservasRef = collection(db, "reservas");
  const q = query(reservasRef, where("email", "==", userEmail));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

import { deleteDoc, updateDoc } from "firebase/firestore";

// editar y borrar reservas

export const deleteReserva = async (reservaId) => {
  await deleteDoc(doc(db, "reservas", reservaId));
};

export const updateReserva = async (reserva) => {
  const { id, ...rest } = reserva;
  await updateDoc(doc(db, "reservas", id), {
    ...rest,
    timestamp: serverTimestamp(),
  });
};

//trae todos los usuarios
export const fetchUsuarios = async () => {
  const snapshot = await getDocs(collection(db, "users"));
  return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
};