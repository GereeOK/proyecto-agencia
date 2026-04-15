import React, { useState, useEffect } from "react";
import {
  fetchReservas,
  deleteReserva,
  updateReserva,
  fetchServicios,
  cambiarEstadoReserva,
} from "../firebase/firestore";

// MEJORA (RF-09 – Gestión de Reservas): Se agrega la columna "Estado" en la
// tabla y la posibilidad de cambiar el estado (Confirmar/Cancelar) desde el
// panel admin, tal como indica RF-09: "Cambiar estado (Confirmar/Cancelar)."
// También se agrega filtrado por estado (RF-09: "Filtrar por experiencia,
// fecha o estado") para que el admin pueda ver solo las pendientes, etc.

// -------------------------------------------------------
// MODAL GENÉRICO
// -------------------------------------------------------
const Modal = ({ children, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg relative">
      <button className="absolute top-2 right-3 text-xl" onClick={onClose}>
        ✕
      </button>
      {children}
    </div>
  </div>
);

// Badge de estado con color
const EstadoBadge = ({ estado }) => {
  const colores = {
    pendiente: "bg-yellow-100 text-yellow-800",
    confirmada: "bg-green-100 text-green-700",
    cancelada: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`px-2 py-1 rounded text-xs font-semibold capitalize ${
        colores[estado] || "bg-gray-100 text-gray-600"
      }`}
    >
      {estado || "pendiente"}
    </span>
  );
};

// -------------------------------------------------------
// COMPONENTE PRINCIPAL
// -------------------------------------------------------
const ReservasAdmin = () => {
  const [reservas, setReservas] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);

  const [reservaEditando, setReservaEditando] = useState(null);
  const [reservaEliminando, setReservaEliminando] = useState(null);

  // MEJORA (RF-09): Filtro por estado
  const [filtroEstado, setFiltroEstado] = useState("todos");

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
    return serviciosArray.map((s) => s?.title || "Desconocido").join(", ");
  };

  // MEJORA (RF-09): Filtra las reservas según el estado seleccionado
  const reservasFiltradas =
    filtroEstado === "todos"
      ? reservas
      : reservas.filter((r) => (r.estado || "pendiente") === filtroEstado);

  const guardarEdicion = async () => {
    try {
      await updateReserva(reservaEditando);
      setReservas((prev) =>
        prev.map((r) => (r.id === reservaEditando.id ? reservaEditando : r))
      );
      setReservaEditando(null);
    } catch (error) {
      console.error("Error actualizando reserva:", error);
      alert("No se pudo actualizar la reserva.");
    }
  };

  // MEJORA (RF-09): Cambiar estado de una reserva directamente desde la tabla
  const handleCambiarEstado = async (reservaId, nuevoEstado) => {
    try {
      await cambiarEstadoReserva(reservaId, nuevoEstado);
      setReservas((prev) =>
        prev.map((r) =>
          r.id === reservaId ? { ...r, estado: nuevoEstado } : r
        )
      );
    } catch (error) {
      console.error("Error cambiando estado:", error);
      alert("No se pudo cambiar el estado de la reserva.");
    }
  };

  const confirmarEliminacion = async () => {
    try {
      await deleteReserva(reservaEliminando.id);
      setReservas((prev) => prev.filter((r) => r.id !== reservaEliminando.id));
      setReservaEliminando(null);
    } catch (error) {
      console.error("Error eliminando reserva:", error);
      alert("No se pudo eliminar la reserva.");
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
          <p className="text-gray-600 text-base">Listado de reservas registradas.</p>
        </div>

        {/* MEJORA (RF-09): Filtro por estado */}
        <div className="mb-4 flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Filtrar por estado:</label>
          <select
            className="border rounded px-3 py-1 text-sm"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="confirmada">Confirmada</option>
            <option value="cancelada">Cancelada</option>
          </select>
          <span className="text-sm text-gray-500">
            ({reservasFiltradas.length} resultado/s)
          </span>
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
                {/* MEJORA: Columna de estado con badge de color */}
                <th className="px-4 py-2 bg-gray-100">Estado</th>
                <th className="px-4 py-2 bg-gray-100 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {reservasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-4">
                    No hay reservas para el filtro seleccionado.
                  </td>
                </tr>
              )}
              {reservasFiltradas.map((res) => (
                <tr key={res.id} className="border-t">
                  <td className="px-4 py-2">{res.fullname}</td>
                  <td className="px-4 py-2">{res.email}</td>
                  <td className="px-4 py-2">{res.checkin}</td>
                  <td className="px-4 py-2">{res.checkout}</td>
                  <td className="px-4 py-2">{getServiciosNombres(res.servicios)}</td>
                  <td className="px-4 py-2">
                    <EstadoBadge estado={res.estado} />
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex justify-center flex-wrap gap-1">
                      {/* MEJORA (RF-09): Botones de Confirmar/Cancelar inline */}
                      {res.estado !== "confirmada" && (
                        <button
                          className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs"
                          onClick={() => handleCambiarEstado(res.id, "confirmada")}
                        >
                          Confirmar
                        </button>
                      )}
                      {res.estado !== "cancelada" && (
                        <button
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs"
                          onClick={() => handleCambiarEstado(res.id, "cancelada")}
                        >
                          Cancelar
                        </button>
                      )}
                      <button
                        className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs"
                        onClick={() => setReservaEditando(res)}
                      >
                        Editar
                      </button>
                      <button
                        className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                        onClick={() => setReservaEliminando(res)}
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

      {/* MODAL EDITAR */}
      {reservaEditando && (
        <Modal onClose={() => setReservaEditando(null)}>
          <h2 className="text-xl font-semibold mb-4">Editar Reserva</h2>

          <label className="block mb-2">Nombre</label>
          <input
            type="text"
            className="border w-full p-2 mb-3 rounded"
            value={reservaEditando.fullname}
            onChange={(e) =>
              setReservaEditando({ ...reservaEditando, fullname: e.target.value })
            }
          />

          {/* MEJORA: Campo para agregar una nota interna (RF-09: "Agregar nota interna") */}
          <label className="block mb-2">Nota interna (solo visible para admins)</label>
          <textarea
            className="border w-full p-2 mb-3 rounded text-sm"
            rows={2}
            placeholder="Ej: El cliente solicitó horario especial..."
            value={reservaEditando.notaInterna || ""}
            onChange={(e) =>
              setReservaEditando({ ...reservaEditando, notaInterna: e.target.value })
            }
          />

          <label className="block mb-2">Servicios actuales</label>
          {(!reservaEditando.servicios || reservaEditando.servicios.length === 0) && (
            <p className="text-gray-500 mb-3 text-sm">No hay servicios asociados.</p>
          )}
          {reservaEditando.servicios?.map((serv) => (
            <div
              key={serv.id}
              className="flex justify-between items-center bg-gray-100 p-2 mb-2 rounded"
            >
              <span>{serv.title}</span>
              <button
                className="text-red-600 hover:text-red-800 text-sm"
                onClick={() =>
                  setReservaEditando({
                    ...reservaEditando,
                    servicios: reservaEditando.servicios.filter((s) => s.id !== serv.id),
                  })
                }
              >
                Eliminar
              </button>
            </div>
          ))}

          <label className="block mt-4 mb-2">Agregar servicios</label>
          <select
            className="border w-full p-2 mb-4 rounded"
            onChange={(e) => {
              const id = e.target.value;
              if (!id) return;
              const serv = servicios.find((s) => s.id === id);
              if (!serv) return;
              if (reservaEditando.servicios?.some((ex) => ex.id === id)) return;
              setReservaEditando({
                ...reservaEditando,
                servicios: [...(reservaEditando.servicios || []), serv],
              });
            }}
          >
            <option value="">Seleccionar servicio…</option>
            {servicios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>

          <button
            onClick={guardarEdicion}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            Guardar Cambios
          </button>
        </Modal>
      )}

      {/* MODAL ELIMINAR */}
      {reservaEliminando && (
        <Modal onClose={() => setReservaEliminando(null)}>
          <h2 className="text-xl font-semibold mb-4 text-center">
            ¿Eliminar esta reserva?
          </h2>
          <div className="bg-gray-100 p-4 rounded mb-4 text-sm">
            <p><strong>Nombre:</strong> {reservaEliminando.fullname}</p>
            <p><strong>Email:</strong> {reservaEliminando.email}</p>
            <p><strong>Check-in:</strong> {reservaEliminando.checkin}</p>
            <p><strong>Check-out:</strong> {reservaEliminando.checkout}</p>
            <p className="mt-2"><strong>Servicios:</strong></p>
            {Array.isArray(reservaEliminando.servicios) &&
            reservaEliminando.servicios.length > 0 ? (
              <ul className="list-disc ml-5">
                {reservaEliminando.servicios.map((serv) => (
                  <li key={serv.id}>{serv.title}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">Sin servicios asociados.</p>
            )}
          </div>
          <p className="text-center mb-4 text-red-600 font-medium">
            Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={confirmarEliminacion}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              Sí, eliminar
            </button>
            <button
              onClick={() => setReservaEliminando(null)}
              className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
            >
              Cancelar
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
};

export default ReservasAdmin;
