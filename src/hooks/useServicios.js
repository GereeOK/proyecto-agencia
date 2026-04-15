import { useEffect, useState } from "react";
import { fetchServicios } from "../firebase/firestore";

// MEJORA (RNF-04 – Rendimiento + UX): Se agrega estado de loading y error
// al hook. En el original no había feedback mientras se cargaban los servicios,
// lo que podía mostrar una lista vacía brevemente al usuario.
export const useServicios = () => {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarServicios = async () => {
      try {
        const data = await fetchServicios();
        setServicios(data);
      } catch (err) {
        console.error("Error al cargar servicios:", err);
        // MEJORA: Se captura el error y se expone para que el componente
        // que consume el hook pueda mostrar un mensaje al usuario.
        setError("No se pudieron cargar los servicios. Intentá más tarde.");
      } finally {
        setLoading(false);
      }
    };
    cargarServicios();
  }, []);

  return { servicios, loading, error };
};
