import React, { useState, useEffect } from "react";
import {
  fetchReservas,
  deleteReserva,
  updateReserva,
  fetchServicios,
  cambiarEstadoReserva,
} from "../firebase/firestore";

const exportCSV = (rows, filename) => {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map(row =>
      headers.map(h => `"${String(row[h] ?? "").replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const Modal = ({ children, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg relative">
      <button className="absolute top-2 right-3 text-xl" onClick={onClose}>✕</button>
      {children}
    </div>
  </div>
);

const EstadoBadge = ({ estado }) => {
  const colores = {
    pendiente:          "bg-yellow-100 text-yellow-800",
    confirmada_usuario: "bg-blue-100 text-blue-700",
    confirmada:         "bg-green-100 text-green-700",
    cancelada:          "bg-red-100 text-red-700",
    pagada:             "bg-purple-100 text-purple-700",
    finalizada:         "bg-gray-100 text-gray-600",
  };
  const labels = {
    pendiente:          "Pendiente",
    confirmada_usuario: "Esp. seller",
    confirmada:         "Confirmada",
    cancelada:          "Cancelada",
    pagada:             "Pagada",
    finalizada:         "Finalizada",
  };
  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${colores[estado] || "bg-gray-100 text-gray-600"}`}>
      {labels[estado] || estado || "pendiente"}
    </span>
  );
};

const ReservasAdmin = () => {
  const [reservas, setReservas] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);

  const [reservaEditando, setReservaEditando] = useState(null);
  const [reservaEliminando, setReservaEliminando] = useState(null);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [filtroDesde, setFiltroDesde] = useState("");
  const [filtroHasta, setFiltroHasta] = useState("");

  useEffect(() => {
    const cargar = async () => {
      try {
        const [r, s] = await Promise.all([fetchReservas(), fetchServicios()]);
        setReservas(r);
        setServicios(s);
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  const getServiciosNombres = (serviciosArray = []) => {
    if (!Array.isArray(serviciosArray)) return "—";
    return serviciosArray.map(s => s?.title || "Desconocido").join(", ");
  };

  // Filtrado combinado
  const reservasFiltradas = reservas.filter(r => {
    const estado = r.estado || "pendiente";
    const matchEstado = filtroEstado === "todos" || estado === filtroEstado;
    const texto = busqueda.toLowerCase();
    const matchBusqueda = !texto ||
      (r.fullname || "").toLowerCase().includes(texto) ||
      (r.email || "").toLowerCase().includes(texto);
    const matchDesde = !filtroDesde || (r.checkin || "") >= filtroDesde;
    const matchHasta = !filtroHasta || (r.checkin || "") <= filtroHasta;
    return matchEstado && matchBusqueda && matchDesde && matchHasta;
  });

  const hayFiltros = filtroEstado !== "todos" || busqueda || filtroDesde || filtroHasta;

  const limpiarFiltros = () => {
    setFiltroEstado("todos");
    setBusqueda("");
    setFiltroDesde("");
    setFiltroHasta("");
  };

  const handleExport = () => {
    const rows = reservasFiltradas.map(r => ({
      Nombre: r.fullname || "",
      Email: r.email || "",
      "Check-in": r.checkin || "",
      "Check-out": r.checkout || "",
      Estado: r.estado || "pendiente",
      Servicios: (r.servicios || []).map(s => s.title).join(" | "),
      "Monto estimado ($)": (r.servicios || []).reduce((s, sv) => s + (parseFloat(sv.price) || 0), 0),
      "Nota interna": r.notaInterna || "",
    }));
    exportCSV(rows, `reservas_${new Date().toISOString().split("T")[0]}.csv`);
  };

  const guardarEdicion = async () => {
    try {
      await updateReserva(reservaEditando);
      setReservas(prev => prev.map(r => r.id === reservaEditando.id ? reservaEditando : r));
      setReservaEditando(null);
    } catch (error) {
      console.error("Error actualizando reserva:", error);
      alert("No se pudo actualizar la reserva.");
    }
  };

  const handleCambiarEstado = async (reservaId, nuevoEstado) => {
    try {
      await cambiarEstadoReserva(reservaId, nuevoEstado);
      setReservas(prev => prev.map(r => r.id === reservaId ? { ...r, estado: nuevoEstado } : r));
    } catch (error) {
      console.error("Error cambiando estado:", error);
      alert("No se pudo cambiar el estado de la reserva.");
    }
  };

  const confirmarEliminacion = async () => {
    try {
      await deleteReserva(reservaEliminando.id);
      setReservas(prev => prev.filter(r => r.id !== reservaEliminando.id));
      setReservaEliminando(null);
    } catch (error) {
      console.error("Error eliminando reserva:", error);
      alert("No se pudo eliminar la reserva.");
    }
  };

  if (loading) return <p className="text-center py-10">Cargando reservas...</p>;

  return (
    <section className="text-gray-600 body-font">
      <div className="container px-4 py-8 mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Reservas</h1>
            <p className="text-gray-500 text-sm mt-1">Listado de reservas registradas.</p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors self-start sm:self-auto"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exportar CSV
          </button>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 mb-6 items-center">
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[180px] focus:outline-none focus:ring-2 focus:ring-primary-300"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
          <select
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            value={filtroEstado}
            onChange={e => setFiltroEstado(e.target.value)}
          >
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="confirmada_usuario">Esp. seller</option>
            <option value="confirmada">Confirmada</option>
            <option value="pagada">Pagada</option>
            <option value="finalizada">Finalizada</option>
            <option value="cancelada">Cancelada</option>
          </select>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 whitespace-nowrap">Check-in desde:</label>
            <input
              type="date"
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              value={filtroDesde}
              onChange={e => setFiltroDesde(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 whitespace-nowrap">hasta:</label>
            <input
              type="date"
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              value={filtroHasta}
              onChange={e => setFiltroHasta(e.target.value)}
            />
          </div>
          <span className="text-sm text-gray-500 whitespace-nowrap">
            {reservasFiltradas.length} resultado/s
          </span>
          {hayFiltros && (
            <button className="text-sm text-primary-600 hover:underline" onClick={limpiarFiltros}>
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="w-full overflow-x-auto">
          <table className="table-auto w-full text-left border">
            <thead>
              <tr>
                <th className="px-4 py-2 bg-gray-100">Nombre</th>
                <th className="px-4 py-2 bg-gray-100">Email</th>
                <th className="px-4 py-2 bg-gray-100">Check-in</th>
                <th className="px-4 py-2 bg-gray-100">Check-out</th>
                <th className="px-4 py-2 bg-gray-100">Servicios</th>
                <th className="px-4 py-2 bg-gray-100">Estado</th>
                <th className="px-4 py-2 bg-gray-100 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {reservasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">
                    No hay reservas que coincidan con los filtros
                  </td>
                </tr>
              )}
              {reservasFiltradas.map(res => (
                <tr key={res.id} className="border-t">
                  <td className="px-4 py-2">{res.fullname}</td>
                  <td className="px-4 py-2">{res.email}</td>
                  <td className="px-4 py-2">{res.checkin}</td>
                  <td className="px-4 py-2">{res.checkout}</td>
                  <td className="px-4 py-2">{getServiciosNombres(res.servicios)}</td>
                  <td className="px-4 py-2"><EstadoBadge estado={res.estado} /></td>
                  <td className="px-4 py-2">
                    <div className="flex justify-center flex-wrap gap-1">
                      <select
                        value={res.estado || "pendiente"}
                        onChange={(e) => handleCambiarEstado(res.id, e.target.value)}
                        className="border rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white"
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="confirmada_usuario">Esp. seller</option>
                        <option value="confirmada">Confirmada</option>
                        <option value="pagada">Pagada</option>
                        <option value="finalizada">Finalizada</option>
                        <option value="cancelada">Cancelada</option>
                      </select>
                      <button className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs"
                        onClick={() => setReservaEditando(res)}>
                        Editar
                      </button>
                      <button className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                        onClick={() => setReservaEliminando(res)}>
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

      {/* MODAL EDITAR */}
      {reservaEditando && (
        <Modal onClose={() => setReservaEditando(null)}>
          <h2 className="text-xl font-semibold mb-4">Editar Reserva</h2>

          <label className="block mb-2">Nombre</label>
          <input type="text" className="border w-full p-2 mb-3 rounded" value={reservaEditando.fullname}
            onChange={e => setReservaEditando({ ...reservaEditando, fullname: e.target.value })} />

          <label className="block mb-2">Nota interna (solo visible para admins)</label>
          <textarea className="border w-full p-2 mb-3 rounded text-sm" rows={2}
            placeholder="Ej: El cliente solicitó horario especial..."
            value={reservaEditando.notaInterna || ""}
            onChange={e => setReservaEditando({ ...reservaEditando, notaInterna: e.target.value })} />

          <label className="block mb-2">Servicios actuales</label>
          {(!reservaEditando.servicios || reservaEditando.servicios.length === 0) && (
            <p className="text-gray-500 mb-3 text-sm">No hay servicios asociados.</p>
          )}
          {reservaEditando.servicios?.map(serv => (
            <div key={serv.id} className="flex justify-between items-center bg-gray-100 p-2 mb-2 rounded">
              <span>{serv.title}</span>
              <button className="text-red-600 hover:text-red-800 text-sm"
                onClick={() => setReservaEditando({ ...reservaEditando, servicios: reservaEditando.servicios.filter(s => s.id !== serv.id) })}>
                Eliminar
              </button>
            </div>
          ))}

          <label className="block mt-4 mb-2">Agregar servicios</label>
          <select className="border w-full p-2 mb-4 rounded"
            onChange={e => {
              const id = e.target.value;
              if (!id) return;
              const serv = servicios.find(s => s.id === id);
              if (!serv || reservaEditando.servicios?.some(ex => ex.id === id)) return;
              setReservaEditando({ ...reservaEditando, servicios: [...(reservaEditando.servicios || []), serv] });
            }}>
            <option value="">Seleccionar servicio…</option>
            {servicios.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>

          <button onClick={guardarEdicion} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
            Guardar Cambios
          </button>
        </Modal>
      )}

      {/* MODAL ELIMINAR */}
      {reservaEliminando && (
        <Modal onClose={() => setReservaEliminando(null)}>
          <h2 className="text-xl font-semibold mb-4 text-center">¿Eliminar esta reserva?</h2>
          <div className="bg-gray-100 p-4 rounded mb-4 text-sm">
            <p><strong>Nombre:</strong> {reservaEliminando.fullname}</p>
            <p><strong>Email:</strong> {reservaEliminando.email}</p>
            <p><strong>Check-in:</strong> {reservaEliminando.checkin}</p>
            <p><strong>Check-out:</strong> {reservaEliminando.checkout}</p>
            <p className="mt-2"><strong>Servicios:</strong></p>
            {Array.isArray(reservaEliminando.servicios) && reservaEliminando.servicios.length > 0 ? (
              <ul className="list-disc ml-5">
                {reservaEliminando.servicios.map(serv => <li key={serv.id}>{serv.title}</li>)}
              </ul>
            ) : (
              <p className="text-gray-500">Sin servicios asociados.</p>
            )}
          </div>
          <p className="text-center mb-4 text-red-600 font-medium">Esta acción no se puede deshacer.</p>
          <div className="flex justify-center space-x-4">
            <button onClick={confirmarEliminacion} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">
              Sí, eliminar
            </button>
            <button onClick={() => setReservaEliminando(null)} className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded">
              Cancelar
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
};

export default ReservasAdmin;
