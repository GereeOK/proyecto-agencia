import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/authContext";
import {
  fetchReservasByUser,
  fetchServicios,
  updateReserva,
  deleteReserva,
} from "../firebase/firestore";

export const useMisReservas = () => {
  const { user, loading: authLoading } = useAuth();
  const [reservas, setReservas] = useState([]);
  const [serviciosDisponibles, setServiciosDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [reservasData, serviciosData] = await Promise.all([
        fetchReservasByUser(user.email),
        fetchServicios(),
      ]);

      const serviciosMap = {};
      serviciosData.forEach((s) => { serviciosMap[s.id] = s; });

      const reservasConServicios = reservasData.map((reserva) => {
        const serviciosCompletos = (reserva.servicios || []).map((srv) => {
          if (typeof srv === "string") return serviciosMap[srv] || { id: srv };
          // BUG FIX: Mergear datos de Firestore (lat, lng, price, etc.) con los
          // datos guardados en la reserva (personas, pasajeros, image, title).
          // Se da prioridad a los datos de la reserva para preservar pasajeros y personas.
          const fromFirestore = serviciosMap[srv.id] || {};
          return {
            ...fromFirestore,  // datos completos del servicio (lat, lng, price, etc.)
            ...srv,            // datos guardados en la reserva (personas, pasajeros)
            id: srv.id || fromFirestore.id, // garantizar que el id siempre esté
          };
        });
        return {
          ...reserva,
          // Normalizar estado: si no tiene estado en Firestore, es "pendiente"
          estado: reserva.estado || "pendiente",
          servicios: serviciosCompletos,
        };
      });

      reservasConServicios.sort((a, b) => {
        const fechaA = a.timestamp?.toDate?.() ?? new Date(0);
        const fechaB = b.timestamp?.toDate?.() ?? new Date(0);
        return fechaB - fechaA;
      });

      setReservas(reservasConServicios);
      setServiciosDisponibles(serviciosData);
    } catch (err) {
      console.error("Error al traer reservas:", err);
      setError("Error al cargar tus reservas.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) loadData();
    else if (!user && !authLoading) { setReservas([]); setLoading(false); }
  }, [authLoading, user, loadData]);

  const handleUpdate = async (reservaActualizada) => {
    try {
      await updateReserva(reservaActualizada);
      // Actualizar estado local sin recargar todo — más rápido y evita perder datos locales
      setReservas((prev) =>
        prev.map((r) => r.id === reservaActualizada.id ? { ...r, ...reservaActualizada } : r)
      );
    } catch (err) {
      console.error("Error actualizando reserva:", err);
    }
  };

  const handleDelete = async (reservaId) => {
    try {
      await deleteReserva(reservaId);
      setReservas((prev) => prev.filter((r) => r.id !== reservaId));
    } catch (err) {
      console.error("Error eliminando reserva:", err);
    }
  };

  return { reservas, serviciosDisponibles, loading, error, handleUpdate, handleDelete };
};
