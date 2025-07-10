import React, { useState, useEffect } from "react";
import { fetchServicios } from "../firebase/firestore";

const Servicios = () => {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarServicios = async () => {
      try {
        const data = await fetchServicios();
        setServicios(data);
      } catch (error) {
        console.error("Error cargando servicios:", error);
      } finally {
        setLoading(false);
      }
    };
    cargarServicios();
  }, []);

  const editarServicio = (id) => {
    alert("Editar servicio con ID: " + id);
  };

  const eliminarServicio = (id) => {
    if (window.confirm(`¿Seguro que querés eliminar el servicio con ID ${id}?`)) {
      alert("Servicio eliminado: " + id);
    }
  };

  const nuevoServicio = () => {
    alert("Abrir formulario para agregar nuevo servicio");
  };

  if (loading) {
    return <p className="text-center py-10">Cargando servicios...</p>;
  }

  return (
    <section className="text-gray-600 body-font">
      <div className="container px-4 py-8 mx-auto">
        <div className="flex flex-col text-center w-full mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            Servicios
          </h1>
          <p className="text-gray-600 text-base">
            Lista de servicios turísticos cargados por los administradores.
          </p>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="table-auto w-full text-left">
            <thead>
              <tr>
                <th className="px-4 py-2 bg-gray-100 text-sm font-medium text-gray-900 rounded-tl rounded-bl">
                  Título
                </th>
                <th className="px-4 py-2 bg-gray-100 text-sm font-medium text-gray-900">
                  Descripción
                </th>
                <th className="px-4 py-2 bg-gray-100 text-sm font-medium text-gray-900">
                  Imagen
                </th>
                <th className="px-4 py-2 bg-gray-100 text-sm font-medium text-gray-900 rounded-tr rounded-br text-center">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {servicios.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-4">
                    No hay servicios cargados
                  </td>
                </tr>
              )}
              {servicios.map(({ id, title, description, image }) => (
                <tr key={id} className="border-t">
                  <td className="px-4 py-2 font-medium text-gray-800">{title}</td>
                  <td className="px-4 py-2 text-sm">{description}</td>
                  <td className="px-4 py-2">
                    <img src={image} alt={title} className="w-24 h-16 object-cover rounded" />
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex justify-center space-x-2">
                      <button
                        className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1 rounded"
                        onClick={() => editarServicio(id)}
                      >
                        Editar
                      </button>
                      <button
                        className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1 rounded"
                        onClick={() => eliminarServicio(id)}
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

        <div className="flex justify-end mt-6">
          <button
            className="text-white bg-green-500 hover:bg-green-600 py-2 px-5 rounded"
            onClick={nuevoServicio}
          >
            Agregar Servicio
          </button>
        </div>
      </div>
    </section>
  );
};

export default Servicios;
