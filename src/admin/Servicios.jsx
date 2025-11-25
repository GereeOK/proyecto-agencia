import React, { useState, useEffect } from "react";
import {
  fetchServicios,
  createServicio,
  updateServicio,
  deleteServicio
} from "../firebase/firestore";

import { Timestamp } from "firebase/firestore";

const Servicios = () => {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentService, setCurrentService] = useState(null);

  // Cargar servicios
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

  // Abrir modal de agregar
  const abrirAdd = () => {
    setCurrentService({
      title: "",
      description: "",
      image: "",
      from: null,
      until: null
    });
    setShowAddModal(true);
  };

  // Abrir modal de edición
  const abrirEdit = (servicio) => {
    setCurrentService({
      id: servicio.id,
      title: servicio.title,
      description: servicio.description,
      image: servicio.image,
      from: servicio.from || null,
      until: servicio.until || null
    });
    setShowEditModal(true);
  };

  const cerrarModales = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setCurrentService(null);
  };

  // Crear servicio
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

  // Editar servicio
  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await updateServicio(currentService.id, {
        title: currentService.title,
        description: currentService.description,
        image: currentService.image,
        from: currentService.from,
        until: currentService.until
      });
      recargar();
      cerrarModales();
    } catch (err) {
      console.error("Error actualizando servicio:", err);
    }
  };

  // Eliminar
  const handleDelete = async (id) => {
    if (!window.confirm("¿Confirmás eliminar este servicio?")) return;
    try {
      await deleteServicio(id);
      recargar();
    } catch (err) {
      console.error("Error eliminando servicio:", err);
    }
  };

  // Mostrar fecha formateada
  const mostrarFecha = (valor) => {
    if (!valor) return "-";

    if (valor.toDate) return valor.toDate().toLocaleDateString();
    if (valor instanceof Date) return valor.toLocaleDateString();

    return "-";
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
                <th className="px-4 py-2 bg-gray-100">Título</th>
                <th className="px-4 py-2 bg-gray-100">Descripción</th>
                <th className="px-4 py-2 bg-gray-100">Imagen</th>
                <th className="px-4 py-2 bg-gray-100">Desde</th>
                <th className="px-4 py-2 bg-gray-100">Hasta</th>
                <th className="px-4 py-2 bg-gray-100 text-center">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {servicios.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-4">
                    No hay servicios cargados
                  </td>
                </tr>
              )}

              {servicios.map(({ id, title, description, image, from, until }) => (
                <tr key={id} className="border-t">
                  <td className="px-4 py-2">{title}</td>
                  <td className="px-4 py-2 text-sm">{description}</td>
                  <td className="px-4 py-2">
                    <img
                      src={image}
                      alt={title}
                      className="w-24 h-16 object-cover rounded"
                    />
                  </td>

                  <td className="px-4 py-2">{mostrarFecha(from)}</td>
                  <td className="px-4 py-2">{mostrarFecha(until)}</td>

                  <td className="px-4 py-2">
                    <div className="flex justify-center space-x-2">
                      <button
                        className="bg-blue-500 text-white text-sm px-3 py-1 rounded"
                        onClick={() =>
                          abrirEdit({ id, title, description, image, from, until })
                        }
                      >
                        Editar
                      </button>

                      <button
                        className="bg-red-500 text-white text-sm px-3 py-1 rounded"
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
            className="text-white bg-green-500 py-2 px-5 rounded"
            onClick={abrirAdd}
          >
            Agregar Servicio
          </button>
        </div>
      </div>

      {(showAddModal || showEditModal) && currentService && (
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
                onChange={(e) =>
                  setCurrentService({ ...currentService, title: e.target.value })
                }
                required
              />
            </label>

            <label className="block mb-2">
              Descripción
              <textarea
                className="w-full border rounded p-2"
                value={currentService.description}
                onChange={(e) =>
                  setCurrentService({
                    ...currentService,
                    description: e.target.value
                  })
                }
                required
              />
            </label>

            <label className="block mb-4">
              URL imagen
              <input
                type="text"
                className="w-full border rounded p-2"
                value={currentService.image}
                onChange={(e) =>
                  setCurrentService({ ...currentService, image: e.target.value })
                }
              />
            </label>

            {/* === FECHA DESDE === */}
            <label className="block mb-2">
              Desde
              <input
                type="date"
                className="w-full border rounded p-2"
                value={
                  currentService.from && currentService.from.toDate
                    ? currentService.from.toDate().toISOString().split("T")[0]
                    : currentService.from instanceof Date
                    ? currentService.from.toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  setCurrentService({
                    ...currentService,
                    from: e.target.value
                      ? Timestamp.fromDate(new Date(e.target.value))
                      : null
                  })
                }
              />
            </label>

            {/* === FECHA HASTA === */}
            <label className="block mb-4">
              Hasta
              <input
                type="date"
                className="w-full border rounded p-2"
                value={
                  currentService.until && currentService.until.toDate
                    ? currentService.until.toDate().toISOString().split("T")[0]
                    : currentService.until instanceof Date
                    ? currentService.until.toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  setCurrentService({
                    ...currentService,
                    until: e.target.value
                      ? Timestamp.fromDate(new Date(e.target.value))
                      : null
                  })
                }
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

              <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
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
