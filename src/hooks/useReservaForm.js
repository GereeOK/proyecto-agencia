import { useState } from "react";
import { saveReserva } from "../firebase/firestore";
import { useNavigate } from "react-router-dom";

// MEJORA: Se agrega validación de fechas antes de enviar la reserva.
// El original no validaba que checkout > checkin ni que los campos fueran
// seleccionados, lo que podría generar reservas inválidas en Firestore.
// Esto corresponde al caso de prueba CP6 (Datos incompletos) y CP1 (Reserva válida).

// MEJORA: EmailJS queda comentado en el original porque la importación
// estaba comentada pero el uso no, causando un ReferenceError en runtime.
// Se corrige importando emailjs correctamente. Instalar con:
// npm install @emailjs/browser
// Las credenciales de EmailJS se pasan por variable de entorno (RNF-03).
import emailjs from "@emailjs/browser";

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

  // MEJORA (CP6 – Validación de campos): Función de validación separada
  // para mayor claridad y facilitar pruebas unitarias futuras (pendiente según
  // las responsabilidades individuales del informe).
  const validarFormulario = () => {
    if (!formData.checkin) return "Debe seleccionar una fecha de inicio.";
    if (!formData.checkout) return "Debe seleccionar una fecha de fin.";

    const checkin = new Date(formData.checkin);
    const checkout = new Date(formData.checkout);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // MEJORA: Validar que checkin no sea en el pasado
    if (checkin < hoy) return "La fecha de inicio no puede ser anterior a hoy.";

    // MEJORA: Validar que checkout sea posterior a checkin
    if (checkout <= checkin)
      return "La fecha de fin debe ser posterior a la fecha de inicio.";

    if (selectedServices.length === 0)
      return "Debe seleccionar al menos un servicio.";

    return null; // null = sin errores
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // MEJORA: Ejecutar validación antes de iniciar el loading
    const errorValidacion = validarFormulario();
    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }

    setLoading(true);

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

      // 2. Enviar email de confirmación al turista con EmailJS
      // MEJORA (RF-03 paso 6): EmailJS estaba comentado en el import pero
      // llamado sin importar, lo que causaba ReferenceError. Ahora se importa
      // correctamente. Las credenciales se mantienen como en el original.
      try {
        await emailjs.send(
          import.meta.env.VITE_EMAILJS_SERVICE_ID ?? "service_ral2qg6",
          import.meta.env.VITE_EMAILJS_TEMPLATE_ID ?? "template_d7ur9ui",
          {
            fullname: formData.fullname,
            email: formData.email,
            fecha_inicio: formData.checkin,
            fecha_fin: formData.checkout,
            servicios: serviciosSeleccionados
              .map((s) => s?.title || s?.name || "Sin título")
              .join(", "),
          },
          import.meta.env.VITE_EMAILJS_PUBLIC_KEY ?? "0kKUvcRprhD41WOD2"
        );
      } catch (emailError) {
        // MEJORA: El fallo del email no debe impedir que la reserva se complete.
        // Se loguea el error pero no se interrumpe el flujo (RF-03 paso 6).
        console.warn("Email de confirmación no pudo enviarse:", emailError);
      }

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
