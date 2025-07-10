import React, { useState, useEffect } from "react";
import { fetchConsultas } from "../firebase/firestore"; // Ajusta si la ruta es distinta

const Consultas = () => {
  const [consultas, setConsultas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarConsultas = async () => {
      try {
        const data = await fetchConsultas();
        setConsultas(data);
      } catch (error) {
        console.error("Error cargando consultas:", error);
      } finally {
        setLoading(false);
      }
    };
    cargarConsultas();
  }, []);

  if (loading) {
    return <p className="text-center py-10">Cargando consultas...</p>;
  }

  return (
    <section className="text-gray-600 body-font">
      <div className="container px-4 py-8 mx-auto">
        <div className="flex flex-col text-center w-full mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Consultas</h1>
          <p className="text-gray-600 text-base">Mensajes enviados desde el formulario de contacto.</p>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="table-auto w-full text-left border">
            <thead>
              <tr>
                <th className="px-4 py-2 bg-gray-100 text-sm font-medium text-gray-900 rounded-tl">Nombre</th>
                <th className="px-4 py-2 bg-gray-100 text-sm font-medium text-gray-900">Email</th>
                <th className="px-4 py-2 bg-gray-100 text-sm font-medium text-gray-900">Mensaje</th>
                <th className="px-4 py-2 bg-gray-100 text-sm font-medium text-gray-900 rounded-tr text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {consultas.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-4">No hay consultas registradas</td>
                </tr>
              )}
              {consultas.map(({ id, name, email, message }) => (
                <tr key={id} className="border-t">
                  <td className="px-4 py-2">{name}</td>
                  <td className="px-4 py-2">{email}</td>
                  <td className="px-4 py-2">{message}</td>
                  <td className="px-4 py-2 text-center">
                    <a
                      href={`mailto:${email}?subject=Respuesta a tu consulta`}
                      className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm px-4 py-1 rounded"
                    >
                      Responder
                    </a>
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

export default Consultas;
