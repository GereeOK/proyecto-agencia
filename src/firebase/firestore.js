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
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  deleteDoc,
  updateDoc,
  runTransaction,
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
  return snapshot.docs.map((d) => ({ uid: d.id, ...d.data() }));
};

// MEJORA (RF-05 – Gestión de Usuarios): Función para actualizar el rol de un
// usuario desde el panel de administración. Antes, los botones de "Editar"
// en Usuarios.jsx solo mostraban un alert() sin funcionalidad real.
export const updateUsuarioRol = async (uid, nuevoRol) => {
  const ref = doc(db, "users", uid);
  await updateDoc(ref, { role: nuevoRol });
};

// MEJORA (RF-05 – Gestión de Usuarios): Función para desactivar una cuenta
// sin eliminarla definitivamente, como indica el requerimiento funcional.
// Se agrega el campo "activo: false" en lugar de borrar el documento.
export const desactivarUsuario = async (uid) => {
  const ref = doc(db, "users", uid);
  await updateDoc(ref, { activo: false });
};

// ==========================================
// 2. SERVICIOS
// ==========================================

// Crear servicio
export const createServicio = async (servicio) => {
  const ref = await addDoc(collection(db, "servicios"), {
    ...servicio,
    // MEJORA (RF-04): Se agrega el campo "activo" al crear un servicio.
    // Esto permite desactivar experiencias sin eliminarlas (soft delete),
    // tal como indica RF-04: "Desactivar experiencias sin eliminarlas."
    activo: servicio.activo !== undefined ? servicio.activo : true,
    timestamp: serverTimestamp(),
  });
  return ref.id;
};

// Traer TODOS los servicios
export const fetchServicios = async () => {
  const snapshot = await getDocs(collection(db, "servicios"));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// MEJORA (RF-04 – Gestión de Experiencias): Traer solo los servicios activos.
// Se filtra por el campo "activo: true" para que los turistas no vean
// experiencias desactivadas por el seller/admin.
export const fetchServiciosActivos = async () => {
  const ref = collection(db, "servicios");
  const q = query(ref, where("activo", "==", true));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// Traer servicios según COMPANY ID
export const fetchServiciosByCompany = async (companyId) => {
  const serviciosRef = collection(db, "servicios");
  const q = query(serviciosRef, where("companyId", "==", companyId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
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

// MEJORA CRÍTICA (RF-03 – Transaccionalidad + CP8 – Concurrencia):
// La función original saveReserva() no validaba cupos disponibles ni
// prevenía duplicados. Esta nueva versión usa runTransaction() de Firestore
// para garantizar atomicidad: se lee el cupo actual, se valida, y se escribe
// la reserva en una sola operación. Esto evita sobre-reservas concurrentes
// (race conditions), tal como indica el caso de prueba CP8 y el flujo básico
// del caso de uso "Realizar Reserva" (pasos 5–8 del documento técnico).
export const saveReservaTransaccional = async (reserva, servicioId) => {
  // Solo se aplica transacción si el servicio tiene control de cupos
  if (!servicioId) {
    // Sin control de cupos: guardar directamente (compatibilidad hacia atrás)
    return addDoc(collection(db, "reservas"), {
      ...reserva,
      estado: "pendiente",
      timestamp: serverTimestamp(),
    });
  }

  const servicioRef = doc(db, "servicios", servicioId);

  return runTransaction(db, async (transaction) => {
    const servicioSnap = await transaction.get(servicioRef);

    if (!servicioSnap.exists()) {
      throw new Error("El servicio no existe.");
    }

    const servicio = servicioSnap.data();

    // VALIDACIÓN (CP2 – Fecha sin disponibilidad):
    // Si el servicio tiene cupos máximos definidos, verificar disponibilidad.
    if (servicio.cupoMaximo !== undefined) {
      const cupoActual = servicio.cupoActual ?? servicio.cupoMaximo;
      if (cupoActual <= 0) {
        throw new Error("No hay cupos disponibles para la fecha seleccionada.");
      }
      // Descontar el cupo disponible de forma atómica
      transaction.update(servicioRef, { cupoActual: cupoActual - 1 });
    }

    // Crear la reserva dentro de la misma transacción
    const reservaRef = doc(collection(db, "reservas"));
    transaction.set(reservaRef, {
      ...reserva,
      estado: "pendiente", // RF-03: Estado inicial siempre "pendiente"
      timestamp: serverTimestamp(),
    });

    return reservaRef;
  });
};

// MEJORA (CP5 – Duplicación de reserva): Verifica si el usuario ya tiene
// una reserva para la misma experiencia antes de crear una nueva.
export const checkReservaDuplicada = async (userEmail, servicioId) => {
  const ref = collection(db, "reservas");
  const q = query(
    ref,
    where("email", "==", userEmail),
    where("servicioId", "==", servicioId),
    where("estado", "!=", "cancelada")
  );
  const snapshot = await getDocs(q);
  return !snapshot.empty; // true = ya existe reserva
};

// Función original mantenida para compatibilidad con el resto del código
export const saveReserva = async (reserva) => {
  return addDoc(collection(db, "reservas"), {
    ...reserva,
    estado: reserva.estado || "pendiente",
    timestamp: serverTimestamp(),
  });
};

// Traer reservas por usuario
export const fetchReservasByUser = async (userEmail) => {
  const reservasRef = collection(db, "reservas");
  const q = query(reservasRef, where("email", "==", userEmail));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// Admin: traer **todas** las reservas
export const fetchReservas = async () => {
  const snapshot = await getDocs(collection(db, "reservas"));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// Actualizar reserva
export const updateReserva = async (reserva) => {
  const { id, ...rest } = reserva;
  await updateDoc(doc(db, "reservas", id), {
    ...rest,
    timestamp: serverTimestamp(),
  });
};

// MEJORA (RF-09 – Gestión de Reservas): Función dedicada para que el
// admin/seller cambie el estado de una reserva (Confirmar/Cancelar),
// separada del update general para mayor claridad semántica.
export const cambiarEstadoReserva = async (reservaId, nuevoEstado) => {
  // nuevoEstado puede ser: "pendiente" | "confirmada" | "cancelada"
  const estadosValidos = ["pendiente", "confirmada", "cancelada"];
  if (!estadosValidos.includes(nuevoEstado)) {
    throw new Error(`Estado inválido: ${nuevoEstado}`);
  }
  await updateDoc(doc(db, "reservas", reservaId), {
    estado: nuevoEstado,
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
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// ==========================================
// 5. EMPRESAS
// ==========================================

// Traer datos de la empresa según companyId
export const getCompanyByUser = async (companyId) => {
  if (!companyId) return null;

  try {
    // MEJORA: Se usa getDoc() con referencia directa en lugar de hacer una
    // query con where("__name__", "==", companyId), que es menos eficiente
    // y más verboso. getDoc() es la forma idiomática de Firestore para
    // obtener un documento por su ID.
    const ref = doc(db, "companies", companyId);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
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
