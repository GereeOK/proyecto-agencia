import React, { useState, useEffect } from "react";
import {
  fetchServicios,
  createServicio,
  updateServicio,
  deleteServicio
} from "../firebase/firestore";

const Servicios = () => {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para modales y servicio actual
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentService, setCurrentService] = useState(null);

  // Función para recargar lista
  const recargar = async () => {
    setLoading(true);
    try {
      const data = await fetchServicios();
      setServicios(data);
    } catch (err) {
      console.error("Error recargando servicios:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    recargar();
  }, []);

  // Abre modal de creación
  const abrirAdd = () => {
    setCurrentService({ title: "", description: "", image: "" });
    setShowAddModal(true);
  };

  // Abre modal de edición
  const abrirEdit = (servicio) => {
    setCurrentService(servicio);
    setShowEditModal(true);
  };

  // Cierra ambos modales
  const cerrarModales = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setCurrentService(null);
  };

  // Maneja envío de form para crear
  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await createServicio(currentService);
      recargar();
      cerrarModales();
    } catch (err) {
      console.error("Error creando servicio:", err);
    }
  };

  // Maneja envío de form para editar
  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await updateServicio(currentService.id, {
        title: currentService.title,
        description: currentService.description,
        image: currentService.image
      });
      recargar();
      cerrarModales();
    } catch (err) {
      console.error("Error actualizando servicio:", err);
    }
  };

  // Confirmar y eliminar
  const handleDelete = async (id) => {
    if (!window.confirm("¿Confirmás eliminar este servicio?")) return;
    try {
      await deleteServicio(id);
      recargar();
    } catch (err) {
      console.error("Error eliminando servicio:", err);
    }
  };

  if (loading) {
    return <p className="text-center py-10">Cargando servicios...</p>;
  }

  return (
    <section className="text-gray-600 body-font">
      <div className="container px-4 py-8 mx-auto">
        <div className="flex flex-col text-center w-full mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Servicios</h1>
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
                        onClick={() => abrirEdit({ id, title, description, image })}
                      >
                        Editar
                      </button>
                      <button
                        className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1 rounded"
                        onClick={() => handleDelete(id)}
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
            onClick={abrirAdd}
          >
            Agregar Servicio
          </button>
        </div>
      </div>

      {/* Modales */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <form
            onSubmit={showAddModal ? handleAdd : handleEdit}
            className="bg-white p-6 rounded shadow-lg w-full max-w-md"
          >
            <h2 className="text-xl mb-4">
              {showAddModal ? "Nuevo Servicio" : "Editar Servicio"}
            </h2>

            <label className="block mb-2">
              Título
              <input
                type="text"
                className="w-full border rounded p-2"
                value={currentService.title}
                onChange={e => setCurrentService({ ...currentService, title: e.target.value })}
                required
              />
            </label>

            <label className="block mb-2">
              Descripción
              <textarea
                className="w-full border rounded p-2"
                value={currentService.description}
                onChange={e => setCurrentService({ ...currentService, description: e.target.value })}
                required
              />
            </label>

            <label className="block mb-4">
              URL imagen
              <input
                type="text"
                className="w-full border rounded p-2"
                value={currentService.image}
                onChange={e => setCurrentService({ ...currentService, image: e.target.value })}
              />
            </label>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 bg-gray-300 rounded"
                onClick={cerrarModales}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded"
              >
                {showAddModal ? "Crear" : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
};

export default Servicios;
