import React, { useState, useEffect } from "react";
import { fetchReservas, deleteReserva } from "../firebase/firestore"; // Ajustá la ruta si es necesario

const ReservasAdmin = () => {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarReservas = async () => {
      try {
        const data = await fetchReservas();
        setReservas(data);
      } catch (error) {
        console.error("Error cargando reservas:", error);
      } finally {
        setLoading(false);
      }
    };
    cargarReservas();
  }, []);

  const editarReserva = (reserva) => {
    alert("Editar reserva:\n" + JSON.stringify(reserva, null, 2));
    // Acá podrías abrir un modal o redirigir a un formulario con los datos precargados
  };

  const eliminarReserva = async (id) => {
    const confirmacion = window.confirm("¿Seguro que querés eliminar esta reserva?");
    if (!confirmacion) return;

    try {
      await deleteReserva(id);
      setReservas(prev => prev.filter(reserva => reserva.id !== id));
    } catch (err) {
      console.error("Error al eliminar reserva:", err);
      alert("Ocurrió un error al eliminar la reserva.");
    }
  };

  if (loading) {
    return <p className="text-center py-10">Cargando reservas...</p>;
  }

  return (
    <section className="text-gray-600 body-font">
      <div className="container px-4 py-8 mx-auto">
        <div className="flex flex-col text-center w-full mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Reservas</h1>
          <p className="text-gray-600 text-base">Listado de reservas registradas en el sistema.</p>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="table-auto w-full text-left border">
            <thead>
              <tr>
                <th className="px-4 py-2 bg-gray-100 text-sm font-medium text-gray-900 rounded-tl">Nombre</th>
                <th className="px-4 py-2 bg-gray-100 text-sm font-medium text-gray-900">Email</th>
                <th className="px-4 py-2 bg-gray-100 text-sm font-medium text-gray-900">Check-in</th>
                <th className="px-4 py-2 bg-gray-100 text-sm font-medium text-gray-900">Check-out</th>
                <th className="px-4 py-2 bg-gray-100 text-sm font-medium text-gray-900">Servicios</th>
                <th className="px-4 py-2 bg-gray-100 text-sm font-medium text-gray-900 rounded-tr text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {reservas.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-4">No hay reservas registradas</td>
                </tr>
              )}
              {reservas.map(({ id, fullname, email, checkin, checkout, servicios }) => (
                <tr key={id} className="border-t">
                  <td className="px-4 py-2">{fullname}</td>
                  <td className="px-4 py-2">{email}</td>
                  <td className="px-4 py-2">{checkin}</td>
                  <td className="px-4 py-2">{checkout}</td>
                  <td className="px-4 py-2">
                    {Array.isArray(servicios)
                      ? servicios.join(", ")
                      : servicios || "—"}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex justify-center space-x-2">
                      <button
                        className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1 rounded"
                        onClick={() => editarReserva({ id, fullname, email, checkin, checkout, servicios })}
                      >
                        Editar
                      </button>
                      <button
                        className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1 rounded"
                        onClick={() => eliminarReserva(id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default ReservasAdmin;
