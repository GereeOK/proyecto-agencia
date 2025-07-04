import { useEffect, useState } from "react";
import { fetchServicios } from "../firebase/firestore";

export const useServicios = () => {
  const [servicios, setServicios] = useState([]);

  useEffect(() => {
    const cargarServicios = async () => {
      const data = await fetchServicios();
      setServicios(data);
    };
    cargarServicios();
  }, []);

  return servicios;
};
