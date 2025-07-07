import { useState } from "react";
import { saveReserva } from "../firebase/firestore";

export const useReservaForm = (serviciosDisponibles, initialData = {}) => {
  const [selectedServices, setSelectedServices] = useState([]);
  const [formData, setFormData] = useState({
    checkin: "",
    checkout: "",
    fullname: "",
    email: "",
    ...initialData,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCheckboxChange = (id) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = {
        ...formData,
        servicios: selectedServices.map((id) =>
          serviciosDisponibles.find((s) => s.id === id)
        ),
      };
      await saveReserva(data);
      alert("¡Reserva enviada correctamente!");
      // Opcional: resetear form y selección
      setFormData({
        checkin: "",
        checkout: "",
        fullname: "",
        email: "",
        ...initialData,
      });
      setSelectedServices([]);
    } catch (err) {
      console.error("Error guardando reserva:", err);
      setError("Error al enviar la reserva. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    selectedServices,
    handleChange,
    handleCheckboxChange,
    handleSubmit,
    loading,
    error,
  };
};
