// carritoContext.jsx
// Contexto global del carrito de reserva. Persiste en sessionStorage para que
// no se pierda si el usuario navega entre páginas durante la misma sesión.
// Se resetea al confirmar la reserva o al cerrar el navegador.

import { createContext, useContext, useState, useEffect } from "react";

const CarritoContext = createContext();
export const useCarrito = () => useContext(CarritoContext);

const STORAGE_KEY = "baires_carrito";

const cargarDesdeSession = () => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { items: [], checkin: "", checkout: "", personas: 1 };
  } catch {
    return { items: [], checkin: "", checkout: "", personas: 1 };
  }
};

export const CarritoProvider = ({ children }) => {
  const [carrito, setCarrito] = useState(cargarDesdeSession);

  // Sincronizar con sessionStorage cada vez que cambia
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(carrito));
  }, [carrito]);

  const setFechas = (checkin, checkout) =>
    setCarrito((prev) => ({ ...prev, checkin, checkout }));

  const setPersonas = (personas) =>
    setCarrito((prev) => ({ ...prev, personas }));

  const agregarItem = (servicio) => {
    setCarrito((prev) => {
      // No duplicar el mismo servicio
      if (prev.items.find((i) => i.id === servicio.id)) return prev;
      return { ...prev, items: [...prev.items, servicio] };
    });
  };

  const quitarItem = (servicioId) =>
    setCarrito((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.id !== servicioId),
    }));

  const limpiarCarrito = () =>
    setCarrito({ items: [], checkin: "", checkout: "", personas: 1 });

  const estaEnCarrito = (servicioId) =>
    carrito.items.some((i) => i.id === servicioId);

  return (
    <CarritoContext.Provider
      value={{
        carrito,
        setFechas,
        setPersonas,
        agregarItem,
        quitarItem,
        limpiarCarrito,
        estaEnCarrito,
      }}
    >
      {children}
    </CarritoContext.Provider>
  );
};
