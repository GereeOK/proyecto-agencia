import React, { useState, useEffect } from "react";

const ModalReserva = ({ reserva, serviciosDisponibles, onClose, onUpdate, onDelete }) => {
  const [checkin, setCheckin] = useState(reserva.checkin);
  const [checkout, setCheckout] = useState(reserva.checkout);
  const [selectedServices, setSelectedServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null); // éxito o error

  useEffect(() => {
    const ids = (reserva.servicios || []).map((s) => s.id);
    setSelectedServices(ids);
  }, [reserva]);

  const handleCheckboxChange = (id) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handleUpdate = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      await onUpdate({
        ...reserva,
        checkin,
        checkout,
        servicios: selectedServices.map((id) =>
          serviciosDisponibles.find((s) => s.id === id)
        ),
      });
      setFeedback({ type: "success", message: "Reserva actualizada correctamente." });
      setTimeout(() => onClose(), 1500); // cerrar después del mensaje
    } catch (err) {
      console.error(err);
      setFeedback({ type: "error", message: "Error al actualizar la reserva." });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmDelete = confirm("¿Estás seguro de que querés eliminar esta reserva?");
    if (!confirmDelete) return;

    setLoading(true);
    setFeedback(null);
    try {
      await onDelete(reserva.id);
      setFeedback({ type: "success", message: "Reserva eliminada correctamente." });
      setTimeout(() => onClose(), 1000);
    } catch (err) {
      console.error(err);
      setFeedback({ type: "error", message: "Error al eliminar la reserva." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-xl shadow-lg relative">
        <button onClick={onClose} className="absolute top-2 right-4 text-gray-500 text-2xl">&times;</button>
        <h2 className="text-2xl font-semibold mb-4">Revisar Reserva</h2>

        <div className="mb-4">
          <label className="block font-medium mb-1">Nombre completo</label>
          <input type="text" value={reserva.fullname} disabled className="w-full border rounded px-3 py-2 bg-gray-100" />
        </div>

        <div className="mb-4">
          <label className="block font-medium mb-1">Email</label>
          <input type="email" value={reserva.email} disabled className="w-full border rounded px-3 py-2 bg-gray-100" />
        </div>

        <div className="flex gap-4 mb-4">
          <div className="w-1/2">
            <label className="block font-medium mb-1">Check-in</label>
            <input type="date" value={checkin} onChange={(e) => setCheckin(e.target.value)} className="w-full border rounded px-3 py-2" />
          </div>
          <div className="w-1/2">
            <label className="block font-medium mb-1">Check-out</label>
            <input type="date" value={checkout} onChange={(e) => setCheckout(e.target.value)} className="w-full border rounded px-3 py-2" />
          </div>
        </div>

        <div className="mb-4">
          <label className="block font-medium mb-1">Servicios</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
            {serviciosDisponibles.map((servicio) => (
              <label key={servicio.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedServices.includes(servicio.id)}
                  onChange={() => handleCheckboxChange(servicio.id)}
                />
                <span>{servicio.title}</span>
              </label>
            ))}
          </div>
        </div>

        {feedback && (
          <p className={`mb-4 text-sm font-medium ${feedback.type === "error" ? "text-red-600" : "text-green-600"}`}>
            {feedback.message}
          </p>
        )}

        <div className="flex justify-end gap-4">
          <button
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Eliminar
          </button>
          <button
            onClick={handleUpdate}
            disabled={loading}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalReserva;
