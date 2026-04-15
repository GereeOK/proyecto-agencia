import React, { useState, useEffect } from "react";
import {
  fetchServicios,
  createServicio,
  updateServicio,
  deleteServicio,
} from "../firebase/firestore";
import { Timestamp } from "firebase/firestore";

// MEJORA (RF-04 – Gestión de Experiencias): Se agrega la opción de
// "desactivar" un servicio sin eliminarlo, tal como indica el requerimiento:
// "Desactivar experiencias sin eliminarlas."
// También se agrega el campo "price" en el formulario, ya que la página
// pública Servicios.jsx ya lo muestra pero no había forma de cargarlo.

const Servicios = () => {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentService, setCurrentService] = useState(null);

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

  const abrirAdd = () => {
    setCurrentService({
      title: "",
      description: "",
      image: "",
      price: "",
      from: null,
      until: null,
      activo: true, // MEJORA: Nuevo campo; por defecto activo al crear
    });
    setShowAddModal(true);
  };

  const abrirEdit = (servicio) => {
    setCurrentService({
      id: servicio.id,
      title: servicio.title,
      description: servicio.description,
      image: servicio.image,
      price: servicio.price || "",
      from: servicio.from || null,
      until: servicio.until || null,
      activo: servicio.activo !== false, // Mantener estado actual
    });
    setShowEditModal(true);
  };

  const cerrarModales = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setCurrentService(null);
  };

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

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await updateServicio(currentService.id, {
        title: currentService.title,
        description: currentService.description,
        image: currentService.image,
        price: currentService.price,
        from: currentService.from,
        until: currentService.until,
        activo: currentService.activo,
      });
      recargar();
      cerrarModales();
    } catch (err) {
      console.error("Error actualizando servicio:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Confirmás eliminar este servicio?")) return;
    try {
      await deleteServicio(id);
      recargar();
    } catch (err) {
      console.error("Error eliminando servicio:", err);
    }
  };

  // MEJORA (RF-04): Soft delete / desactivar sin eliminar
  const handleToggleActivo = async (servicio) => {
    const nuevoEstado = servicio.activo !== false ? false : true;
    const accion = nuevoEstado ? "activar" : "desactivar";
    if (!window.confirm(`¿${accion} este servicio?`)) return;
    try {
      await updateServicio(servicio.id, { activo: nuevoEstado });
      recargar();
    } catch (err) {
      console.error("Error cambiando estado del servicio:", err);
    }
  };

  const mostrarFecha = (valor) => {
    if (!valor) return "-";
    if (valor.toDate) return valor.toDate().toLocaleDateString();
    if (valor instanceof Date) return valor.toLocaleDateString();
    return "-";
  };

  if (loading) return <p className="text-center py-10">Cargando servicios...</p>;

  return (
    <section className="text-gray-600 body-font">
      <div className="container px-4 py-8 mx-auto">
        <div className="flex flex-col text-center w-full mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Servicios</h1>
          <p className="text-gray-600 text-base">
            Gestión de servicios turísticos. Podés activar, desactivar o eliminar experiencias.
          </p>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="table-auto w-full text-left">
            <thead>
              <tr>
                <th className="px-4 py-2 bg-gray-100">Título</th>
                <th className="px-4 py-2 bg-gray-100">Descripción</th>
                <th className="px-4 py-2 bg-gray-100">Imagen</th>
                <th className="px-4 py-2 bg-gray-100">Precio</th>
                <th className="px-4 py-2 bg-gray-100">Desde</th>
                <th className="px-4 py-2 bg-gray-100">Hasta</th>
                {/* MEJORA: Columna de estado activo/inactivo */}
                <th className="px-4 py-2 bg-gray-100 text-center">Estado</th>
                <th className="px-4 py-2 bg-gray-100 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {servicios.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-4">No hay servicios cargados</td>
                </tr>
              )}
              {servicios.map(({ id, title, description, image, price, from, until, activo }) => (
                <tr key={id} className={`border-t ${activo === false ? "opacity-50" : ""}`}>
                  <td className="px-4 py-2">{title}</td>
                  <td className="px-4 py-2 text-sm">{description}</td>
                  <td className="px-4 py-2">
                    <img src={image} alt={title} className="w-24 h-16 object-cover rounded" />
                  </td>
                  <td className="px-4 py-2">{price ? `$${price}` : "-"}</td>
                  <td className="px-4 py-2">{mostrarFecha(from)}</td>
                  <td className="px-4 py-2">{mostrarFecha(until)}</td>
                  <td className="px-4 py-2 text-center">
                    {/* MEJORA: Badge de estado activo/inactivo */}
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        activo !== false
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {activo !== false ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex justify-center space-x-1 flex-wrap gap-1">
                      <button
                        className="bg-blue-500 text-white text-sm px-3 py-1 rounded"
                        onClick={() => abrirEdit({ id, title, description, image, price, from, until, activo })}
                      >
                        Editar
                      </button>
                      {/* MEJORA (RF-04): Botón de activar/desactivar (soft delete) */}
                      <button
                        className={`text-white text-sm px-3 py-1 rounded ${
                          activo !== false
                            ? "bg-yellow-500 hover:bg-yellow-600"
                            : "bg-green-500 hover:bg-green-600"
                        }`}
                        onClick={() => handleToggleActivo({ id, activo })}
                      >
                        {activo !== false ? "Desactivar" : "Activar"}
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
          <button className="text-white bg-green-500 py-2 px-5 rounded" onClick={abrirAdd}>
            Agregar Servicio
          </button>
        </div>
      </div>

      {/* MODAL ADD / EDIT */}
      {(showAddModal || showEditModal) && currentService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <form
            onSubmit={showAddModal ? handleAdd : handleEdit}
            className="bg-white p-6 rounded shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-xl mb-4">{showAddModal ? "Nuevo Servicio" : "Editar Servicio"}</h2>

            <label className="block mb-2">
              Título
              <input
                type="text"
                className="w-full border rounded p-2"
                value={currentService.title}
                onChange={(e) => setCurrentService({ ...currentService, title: e.target.value })}
                required
              />
            </label>

            <label className="block mb-2">
              Descripción
              <textarea
                className="w-full border rounded p-2"
                value={currentService.description}
                onChange={(e) => setCurrentService({ ...currentService, description: e.target.value })}
                required
              />
            </label>

            <label className="block mb-2">
              URL imagen
              <input
                type="text"
                className="w-full border rounded p-2"
                value={currentService.image}
                onChange={(e) => setCurrentService({ ...currentService, image: e.target.value })}
              />
            </label>

            {/* MEJORA: Campo de precio que antes no existía en el formulario
                pero sí se mostraba en la página pública de Servicios */}
            <label className="block mb-2">
              Precio (opcional)
              <input
                type="number"
                min="0"
                className="w-full border rounded p-2"
                value={currentService.price}
                onChange={(e) => setCurrentService({ ...currentService, price: e.target.value })}
                placeholder="Ej: 5000"
              />
            </label>

            <label className="block mb-2">
              Desde
              <input
                type="date"
                className="w-full border rounded p-2"
                value={
                  currentService.from?.toDate
                    ? currentService.from.toDate().toISOString().split("T")[0]
                    : currentService.from instanceof Date
                    ? currentService.from.toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  setCurrentService({
                    ...currentService,
                    from: e.target.value ? Timestamp.fromDate(new Date(e.target.value)) : null,
                  })
                }
              />
            </label>

            <label className="block mb-2">
              Hasta
              <input
                type="date"
                className="w-full border rounded p-2"
                value={
                  currentService.until?.toDate
                    ? currentService.until.toDate().toISOString().split("T")[0]
                    : currentService.until instanceof Date
                    ? currentService.until.toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  setCurrentService({
                    ...currentService,
                    until: e.target.value ? Timestamp.fromDate(new Date(e.target.value)) : null,
                  })
                }
              />
            </label>

            {/* MEJORA (RF-04): Toggle de estado activo en el formulario de edición */}
            {showEditModal && (
              <label className="flex items-center gap-2 mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentService.activo !== false}
                  onChange={(e) =>
                    setCurrentService({ ...currentService, activo: e.target.checked })
                  }
                />
                <span className="text-sm text-gray-700">Servicio activo (visible para turistas)</span>
              </label>
            )}

            <div className="flex justify-end gap-2 mt-2">
              <button type="button" className="px-4 py-2 bg-gray-300 rounded" onClick={cerrarModales}>
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
