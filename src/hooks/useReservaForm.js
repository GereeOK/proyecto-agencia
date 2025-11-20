import { useState } from "react";
import { saveReserva } from "../firebase/firestore";
import emailjs from "@emailjs/browser";
import { useNavigate } from "react-router-dom";

export const useReservaForm = (serviciosDisponibles, initialData = {}) => {
  const navigate = useNavigate();

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
      const serviciosSeleccionados = selectedServices.map((id) =>
        serviciosDisponibles.find((s) => s.id === id)
      );

      const data = {
        ...formData,
        servicios: serviciosSeleccionados,
      };

      // 1. Guardar en Firebase
      await saveReserva(data);

      // 2. Enviar email con EmailJS
      await emailjs.send(
        "service_ral2qg6", // ID del servicio
        "template_d7ur9ui", // ID del template
        {
          fullname: formData.fullname,
          email: formData.email,
          fecha_inicio: formData.checkin,
          fecha_fin: formData.checkout,
          servicios: serviciosSeleccionados.map((s) => s.title || s.name || "Sin título").join(", "),
        },
        "0kKUvcRprhD41WOD2" // Public Key
      );

      // 3. Redirigir a página de confirmación
      navigate("/reserva-exitosa");

      // 4. Resetear formulario
      setFormData({
        checkin: "",
        checkout: "",
        fullname: "",
        email: "",
        ...initialData,
      });
      setSelectedServices([]);
    } catch (err) {
      console.error("❌ Error al enviar la reserva:", err);
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


