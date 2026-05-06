import React, { useState, useEffect, lazy, Suspense } from "react";
import {
  fetchServicios,
  createServicio,
  updateServicio,
  deleteServicio,
  fetchEmpresas,
} from "../firebase/firestore";
import { Timestamp } from "firebase/firestore";

const MapaServicio = lazy(() => import("../components/MapaServicio"));

const CATEGORIAS = ["Tours", "Gastronomia", "Traslados", "Experiencias"];

const Servicios = () => {
  const [servicios, setServicios] = useState([]);
  const [empresasMap, setEmpresasMap] = useState({});  // companyId → nombre
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentService, setCurrentService] = useState(null);

  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [filtroActivo, setFiltroActivo] = useState("todos");

  const recargar = async () => {
    setLoading(true);
    try {
      const [data, empresas] = await Promise.all([fetchServicios(), fetchEmpresas()]);
      setServicios(data);
      const map = {};
      empresas.forEach((e) => { map[e.id] = e.name || e.nombre || e.razonSocial || e.id; });
      setEmpresasMap(map);
    } catch (err) {
      console.error("Error recargando servicios:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { recargar(); }, []);

  const abrirAdd = () => {
    setCurrentService({
      title: "", description: "", image: "", price: "",
      from: null, until: null, lat: "", lng: "", activo: true,
      categoria: "", duracion: "", idioma: "", ubicacion: "", incluye: "",
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
      categoria: servicio.categoria || "",
      duracion: servicio.duracion || "",
      idioma: servicio.idioma || "",
      ubicacion: servicio.ubicacion || "",
      incluye: servicio.incluye || "",
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
        categoria: currentService.categoria,
        duracion: currentService.duracion,
        idioma: currentService.idioma,
        ubicacion: currentService.ubicacion,
        incluye: currentService.incluye,
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

  // Servicios filtrados
  const serviciosFiltrados = servicios.filter(s => {
    const matchBusqueda = !busqueda || (s.title || "").toLowerCase().includes(busqueda.toLowerCase());
    const matchCategoria = filtroCategoria === "todas" || s.categoria === filtroCategoria;
    const matchActivo =
      filtroActivo === "todos" ||
      (filtroActivo === "activo" ? s.activo !== false : s.activo === false);
    return matchBusqueda && matchCategoria && matchActivo;
  });

  if (loading) return <p className="text-center py-10">Cargando servicios...</p>;

  return (
    <section className="text-gray-600 body-font">
      <div className="container px-4 py-8 mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Servicios</h1>
            <p className="text-gray-500 text-sm mt-1">
              Gestión de servicios turísticos. Podés activar, desactivar o eliminar experiencias.
            </p>
          </div>
          <button className="text-white bg-green-500 hover:bg-green-600 py-2 px-5 rounded-lg self-start sm:self-auto" onClick={abrirAdd}>
            + Agregar Servicio
          </button>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 mb-6 items-center">
          <input
            type="text"
            placeholder="Buscar por título..."
            className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
          <select
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={filtroCategoria}
            onChange={e => setFiltroCategoria(e.target.value)}
          >
            <option value="todas">Todas las categorías</option>
            {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={filtroActivo}
            onChange={e => setFiltroActivo(e.target.value)}
          >
            <option value="todos">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
          <span className="text-sm text-gray-500 whitespace-nowrap">
            {serviciosFiltrados.length} resultado/s
          </span>
          {(busqueda || filtroCategoria !== "todas" || filtroActivo !== "todos") && (
            <button
              className="text-sm text-indigo-600 hover:underline"
              onClick={() => { setBusqueda(""); setFiltroCategoria("todas"); setFiltroActivo("todos"); }}
            >
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="w-full overflow-x-auto">
          <table className="table-auto w-full text-left">
            <thead>
              <tr>
                <th className="px-4 py-2 bg-gray-100">Título</th>
                <th className="px-4 py-2 bg-gray-100">Empresa</th>
                <th className="px-4 py-2 bg-gray-100">Categoría</th>
                <th className="px-4 py-2 bg-gray-100">Imagen</th>
                <th className="px-4 py-2 bg-gray-100">Precio</th>
                <th className="px-4 py-2 bg-gray-100">Desde</th>
                <th className="px-4 py-2 bg-gray-100">Hasta</th>
                <th className="px-4 py-2 bg-gray-100 text-center">Estado</th>
                <th className="px-4 py-2 bg-gray-100 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {serviciosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-400">
                    No hay servicios que coincidan con los filtros
                  </td>
                </tr>
              )}
              {serviciosFiltrados.map((s) => (
                <tr key={s.id} className={`border-t ${s.activo === false ? "opacity-50" : ""}`}>
                  <td className="px-4 py-2 font-medium">{s.title}</td>
                  <td className="px-4 py-2 text-sm">
                    {s.companyId ? (
                      <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full font-medium">
                        {empresasMap[s.companyId] || s.companyId}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">Sin empresa</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    {s.categoria
                      ? <span className="bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded-full">{s.categoria}</span>
                      : <span className="text-gray-400 text-xs">—</span>
                    }
                  </td>
                  <td className="px-4 py-2">
                    {s.image
                      ? <img src={s.image} alt={s.title} className="w-20 h-14 object-cover rounded" />
                      : <span className="text-gray-400 text-xs">Sin imagen</span>
                    }
                  </td>
                  <td className="px-4 py-2">{s.price ? `$${s.price}` : "-"}</td>
                  <td className="px-4 py-2">{mostrarFecha(s.from)}</td>
                  <td className="px-4 py-2">{mostrarFecha(s.until)}</td>
                  <td className="px-4 py-2 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${s.activo !== false ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {s.activo !== false ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex justify-center gap-1 flex-wrap">
                      <button
                        className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1 rounded"
                        onClick={() => abrirEdit(s)}
                      >
                        Editar
                      </button>
                      <button
                        className={`text-white text-sm px-3 py-1 rounded ${s.activo !== false ? "bg-yellow-500 hover:bg-yellow-600" : "bg-green-500 hover:bg-green-600"}`}
                        onClick={() => handleToggleActivo(s)}
                      >
                        {s.activo !== false ? "Desactivar" : "Activar"}
                      </button>
                      <button
                        className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1 rounded"
                        onClick={() => handleDelete(s.id)}
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

      {/* MODAL ADD / EDIT */}
      {(showAddModal || showEditModal) && currentService && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[92vh]">

            {/* Header */}
            <div className="bg-gray-900 text-white px-6 py-4 rounded-t-xl flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-base font-semibold">
                  {showAddModal ? "Nuevo Servicio" : "Editar Servicio"}
                </h2>
                {showEditModal && currentService.title && (
                  <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[400px]">{currentService.title}</p>
                )}
              </div>
              <button
                type="button"
                onClick={cerrarModales}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <form
              id="form-servicio"
              onSubmit={showAddModal ? handleAdd : handleEdit}
              className="overflow-y-auto flex-1 px-6 py-5 space-y-6"
            >
              {/* Sección: Información básica */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Información básica
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Título <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      value={currentService.title}
                      onChange={e => setCurrentService({ ...currentService, title: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción <span className="text-red-500">*</span></label>
                    <textarea
                      rows={3}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                      value={currentService.description}
                      onChange={e => setCurrentService({ ...currentService, description: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                        <input
                          type="number"
                          min="0"
                          className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                          value={currentService.price}
                          onChange={e => setCurrentService({ ...currentService, price: e.target.value })}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">URL de imagen</label>
                      <input
                        type="text"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        value={currentService.image}
                        onChange={e => setCurrentService({ ...currentService, image: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                  {currentService.image && (
                    <div className="rounded-lg overflow-hidden border border-gray-100">
                      <img src={currentService.image} alt="preview" className="w-full h-32 object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Sección: Detalles */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Detalles
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                    <select
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      value={currentService.categoria || ""}
                      onChange={e => setCurrentService({ ...currentService, categoria: e.target.value })}
                    >
                      <option value="">Sin categoría</option>
                      {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duración</label>
                    <input
                      type="text"
                      placeholder="Ej: 3 horas"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      value={currentService.duracion || ""}
                      onChange={e => setCurrentService({ ...currentService, duracion: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Idioma/s</label>
                    <input
                      type="text"
                      placeholder="Ej: Español, Inglés"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      value={currentService.idioma || ""}
                      onChange={e => setCurrentService({ ...currentService, idioma: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación (texto)</label>
                    <input
                      type="text"
                      placeholder="Ej: Barracas, CABA"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      value={currentService.ubicacion || ""}
                      onChange={e => setCurrentService({ ...currentService, ubicacion: e.target.value })}
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">¿Qué incluye?</label>
                  <textarea
                    rows={2}
                    placeholder="Ej: Guía local, traslado, entrada..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                    value={currentService.incluye || ""}
                    onChange={e => setCurrentService({ ...currentService, incluye: e.target.value })}
                  />
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Sección: Disponibilidad */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Disponibilidad
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                    <input
                      type="date"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      value={currentService.from?.toDate ? currentService.from.toDate().toISOString().split("T")[0] : currentService.from instanceof Date ? currentService.from.toISOString().split("T")[0] : ""}
                      onChange={e => setCurrentService({ ...currentService, from: e.target.value ? Timestamp.fromDate(new Date(e.target.value)) : null })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                    <input
                      type="date"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      value={currentService.until?.toDate ? currentService.until.toDate().toISOString().split("T")[0] : currentService.until instanceof Date ? currentService.until.toISOString().split("T")[0] : ""}
                      onChange={e => setCurrentService({ ...currentService, until: e.target.value ? Timestamp.fromDate(new Date(e.target.value)) : null })}
                    />
                  </div>
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Sección: Ubicación en el mapa */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Ubicación en el mapa
                </p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Latitud</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="-34.6037"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      value={currentService.lat || ""}
                      onChange={e => setCurrentService({ ...currentService, lat: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Longitud</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="-58.3816"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      value={currentService.lng || ""}
                      onChange={e => setCurrentService({ ...currentService, lng: e.target.value })}
                    />
                  </div>
                </div>
                <Suspense fallback={
                  <div className="w-full h-48 bg-gray-100 rounded-xl animate-pulse flex items-center justify-center text-sm text-gray-400">
                    Cargando mapa...
                  </div>
                }>
                  <div className="rounded-xl overflow-hidden border border-gray-200">
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
                  </div>
                </Suspense>
              </div>

              {/* Toggle de estado (solo en edición) */}
              {showEditModal && (
                <>
                  <hr className="border-gray-100" />
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Estado</p>
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={currentService.activo !== false}
                          onChange={e => setCurrentService({ ...currentService, activo: e.target.checked })}
                        />
                        <div className={`w-10 h-6 rounded-full transition-colors ${currentService.activo !== false ? "bg-indigo-500" : "bg-gray-300"}`} />
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${currentService.activo !== false ? "translate-x-5" : "translate-x-1"}`} />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">
                          {currentService.activo !== false ? "Servicio activo" : "Servicio inactivo"}
                        </span>
                        <p className="text-xs text-gray-400">
                          {currentService.activo !== false ? "Visible para turistas en el catálogo" : "Oculto del catálogo público"}
                        </p>
                      </div>
                    </label>
                  </div>
                </>
              )}
            </form>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end gap-3 border-t border-gray-100 flex-shrink-0">
              <button
                type="button"
                onClick={cerrarModales}
                className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="form-servicio"
                className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                {showAddModal ? "Crear servicio" : "Guardar cambios"}
              </button>
            </div>

          </div>
        </div>
      )}
    </section>
  );
};

export default Servicios;
