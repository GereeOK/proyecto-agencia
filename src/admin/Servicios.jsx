import React, { useState, useEffect, lazy, Suspense } from "react";
import {
  fetchServicios,
  createServicio,
  updateServicio,
  deleteServicio,
} from "../firebase/firestore";
import { Timestamp } from "firebase/firestore";

// Lazy-load del mapa para no impactar el bundle del panel admin
const MapaServicio = lazy(() => import("../components/MapaServicio"));

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
      lat: "",
      lng: "",
      activo: true,
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
      lat: servicio.lat || "",
      lng: servicio.lng || "",
      activo: servicio.activo !== false,
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
        lat: currentService.lat,
        lng: currentService.lng,
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

            {/* Campos nuevos usados por la UI estilo TripAdvisor */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <label className="block">
                Categoría
                <select
                  className="w-full border rounded p-2 mt-1"
                  value={currentService.categoria || ""}
                  onChange={(e) => setCurrentService({ ...currentService, categoria: e.target.value })}
                >
                  <option value="">Sin categoría</option>
                  <option value="Tours">Tours</option>
                  <option value="Gastronomia">Gastronomía</option>
                  <option value="Traslados">Traslados</option>
                  <option value="Experiencias">Experiencias</option>
                </select>
              </label>
              <label className="block">
                Duración
                <input type="text" placeholder="Ej: 3 horas" className="w-full border rounded p-2 mt-1"
                  value={currentService.duracion || ""}
                  onChange={(e) => setCurrentService({ ...currentService, duracion: e.target.value })} />
              </label>
            </div>
            <label className="block mb-2">
              Idioma
              <input type="text" placeholder="Ej: Español, Inglés" className="w-full border rounded p-2"
                value={currentService.idioma || ""}
                onChange={(e) => setCurrentService({ ...currentService, idioma: e.target.value })} />
            </label>
            <label className="block mb-2">
              Ubicación (texto)
              <input type="text" placeholder="Ej: Barracas, CABA" className="w-full border rounded p-2"
                value={currentService.ubicacion || ""}
                onChange={(e) => setCurrentService({ ...currentService, ubicacion: e.target.value })} />
            </label>
            <label className="block mb-2">
              ¿Qué incluye?
              <textarea rows={2} placeholder="Ej: Guía local, traslado, entrada..." className="w-full border rounded p-2 text-sm"
                value={currentService.incluye || ""}
                onChange={(e) => setCurrentService({ ...currentService, incluye: e.target.value })} />
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

            {/* MAPA INTERACTIVO: el seller/admin hace click para ubicar la experiencia */}
            <div className="mb-4">
              <p className="text-sm font-medium mb-1">Ubicación en el mapa</p>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <label className="block text-xs">
                  Latitud
                  <input type="number" step="any" placeholder="-34.6037"
                    className="w-full border rounded p-2 text-sm mt-1"
                    value={currentService.lat || ""}
                    onChange={(e) => setCurrentService({ ...currentService, lat: e.target.value })} />
                </label>
                <label className="block text-xs">
                  Longitud
                  <input type="number" step="any" placeholder="-58.3816"
                    className="w-full border rounded p-2 text-sm mt-1"
                    value={currentService.lng || ""}
                    onChange={(e) => setCurrentService({ ...currentService, lng: e.target.value })} />
                </label>
              </div>
              {/* Mapa editable: click para mover el pin y actualizar lat/lng automáticamente */}
              <Suspense fallback={<div className="w-full h-48 bg-gray-100 rounded-xl animate-pulse flex items-center justify-center text-sm text-gray-400">Cargando mapa...</div>}>
                <MapaServicio
                  lat={currentService.lat}
                  lng={currentService.lng}
                  titulo={currentService.title || "Nueva experiencia"}
                  editable={true}
                  height="200px"
                  onChangeCoords={(lat, lng) =>
                    setCurrentService({ ...currentService, lat: lat.toFixed(6), lng: lng.toFixed(6) })
                  }
                />
              </Suspense>
            </div>

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
