import React, { useState, useEffect } from "react";
import { fetchConsultas } from "../firebase/firestore";

const Consultas = () => {
  const [consultas, setConsultas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");

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

  const consultasFiltradas = consultas.filter(c => {
    if (!busqueda) return true;
    const texto = busqueda.toLowerCase();
    return (
      (c.name || "").toLowerCase().includes(texto) ||
      (c.email || "").toLowerCase().includes(texto) ||
      (c.message || "").toLowerCase().includes(texto)
    );
  });

  if (loading) return <p className="text-center py-10">Cargando consultas...</p>;

  return (
    <section className="text-gray-600 body-font">
      <div className="container px-4 py-8 mx-auto">
        <div className="flex flex-col text-center w-full mb-6">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Consultas</h1>
          <p className="text-gray-600 text-base">Mensajes enviados desde el formulario de contacto.</p>
        </div>

        {/* Filtro de búsqueda */}
        <div className="flex flex-wrap gap-3 mb-6 items-center">
          <input
            type="text"
            placeholder="Buscar por nombre, email o mensaje..."
            className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[250px] focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
          <span className="text-sm text-gray-500 whitespace-nowrap">
            {consultasFiltradas.length} resultado/s
          </span>
          {busqueda && (
            <button className="text-sm text-indigo-600 hover:underline" onClick={() => setBusqueda("")}>
              Limpiar
            </button>
          )}
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
              {consultasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-400">
                    {busqueda ? "No hay consultas que coincidan con la búsqueda" : "No hay consultas registradas"}
                  </td>
                </tr>
              )}
              {consultasFiltradas.map(({ id, name, email, message }) => (
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
