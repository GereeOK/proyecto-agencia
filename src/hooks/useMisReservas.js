import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/authContext";
import {
  fetchReservasByUser,
  fetchServicios,
  updateReserva,
  deleteReserva,
  cambiarEstadoReserva,
} from "../firebase/firestore";

// Parsea "YYYY-MM-DD" o "DD/MM/YYYY" → Date local medianoche
const parseCheckout = (str) => {
  if (!str) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return new Date(str + "T00:00:00");
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    const [d, m, y] = str.split("/");
    return new Date(`${y}-${m}-${d}T00:00:00`);
  }
  return null;
};

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

      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const reservasConServicios = reservasData.map((reserva) => {
        const serviciosCompletos = (reserva.servicios || []).map((srv) => {
          if (typeof srv === "string") return serviciosMap[srv] || { id: srv };
          const fromFirestore = serviciosMap[srv.id] || {};
          return {
            ...fromFirestore,
            ...srv,
            id: srv.id || fromFirestore.id,
          };
        });

        // Transición lazy a "finalizada": checkout pasado + estado activo completado
        let estado = reserva.estado || "pendiente";
        const checkout = parseCheckout(reserva.checkout);
        if (
          checkout && checkout < hoy &&
          (estado === "confirmada" || estado === "pagada")
        ) {
          estado = "finalizada";
        }

        return { ...reserva, estado, servicios: serviciosCompletos };
      });

      // Persistir en Firestore las que cambiaron a "finalizada"
      const aFinalizar = reservasConServicios.filter(
        (r, i) => r.estado === "finalizada" && (reservasData[i].estado === "confirmada" || reservasData[i].estado === "pagada")
      );
      if (aFinalizar.length > 0) {
        await Promise.all(aFinalizar.map((r) => cambiarEstadoReserva(r.id, "finalizada")));
      }

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
