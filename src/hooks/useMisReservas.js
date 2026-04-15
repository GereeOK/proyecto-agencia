import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/authContext";
import {
  fetchReservasByUser,
  fetchServicios,
  updateReserva,
  deleteReserva,
} from "../firebase/firestore";

// MEJORA (RF-03 / Mis Reservas): Se agrega ordenamiento de reservas por fecha
// de creación descendente para que el usuario vea primero las más recientes.
// También se expone el estado "estado" de cada reserva para mostrarlo en la UI.

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
      serviciosData.forEach((s) => {
        serviciosMap[s.id] = s;
      });

      const reservasConServicios = reservasData.map((reserva) => {
        const serviciosCompletos = (reserva.servicios || []).map((srv) =>
          typeof srv === "string"
            ? serviciosMap[srv]
            : serviciosMap[srv.id] || srv
        );
        return { ...reserva, servicios: serviciosCompletos };
      });

      // MEJORA: Ordenar reservas por timestamp descendente (más reciente primero)
      reservasConServicios.sort((a, b) => {
        const fechaA = a.timestamp?.toDate?.() ?? new Date(0);
        const fechaB = b.timestamp?.toDate?.() ?? new Date(0);
        return fechaB - fechaA;
      });

      setReservas(reservasConServicios);
      setServiciosDisponibles(serviciosData);
    } catch (err) {
      console.error("Error al traer reservas o servicios:", err);
      setError("Error al cargar tus reservas.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      loadData();
    } else if (!user && !authLoading) {
      setReservas([]);
      setLoading(false);
    }
  }, [authLoading, user, loadData]);

  const refetch = () => loadData();

  const handleUpdate = async (reservaActualizada) => {
    try {
      await updateReserva(reservaActualizada);
      await loadData();
    } catch (err) {
      console.error("Error actualizando reserva:", err);
    }
  };

  const handleDelete = async (reservaId) => {
    try {
      await deleteReserva(reservaId);
      // MEJORA: Actualizar el estado local inmediatamente en lugar de recargar
      // todo desde Firestore, lo que reduce una llamada a la red.
      setReservas((prev) => prev.filter((r) => r.id !== reservaId));
    } catch (err) {
      console.error("Error eliminando reserva:", err);
    }
  };

  return {
    reservas,
    serviciosDisponibles,
    loading,
    error,
    handleUpdate,
    handleDelete,
    refetch,
  };
};
