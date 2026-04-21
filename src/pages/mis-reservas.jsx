import React, { useState, lazy, Suspense } from "react";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { useMisReservas } from "../hooks/useMisReservas";
import { updateReserva, cambiarEstadoReserva } from "../firebase/firestore";
import { Link } from "react-router-dom";
import { useAuth } from "../context/authContext";
// useAuth se usa solo dentro de ModalDetalleReserva para detectar si es seller
// cuando el modal se reutiliza desde HomeSeller

// Lazy-load del mapa — solo se carga cuando se abre el modal
const MapaServicio = lazy(() => import("../components/MapaServicio"));

const formatARS = (n) => Number(n || 0).toLocaleString("es-AR");

// ── Badge de estado
const EstadoBadge = ({ estado }) => {
  const cfg = {
    pendiente:  { cls: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: "⏳" },
    confirmada: { cls: "bg-green-100  text-green-700  border-green-200",  icon: "✅" },
    cancelada:  { cls: "bg-red-100    text-red-700    border-red-200",    icon: "❌" },
  };
  const { cls, icon } = cfg[estado] || { cls: "bg-gray-100 text-gray-600 border-gray-200", icon: "•" };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${cls}`}>
      {icon} {estado || "pendiente"}
    </span>
  );
};

// ── Skeleton loader
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse border border-gray-100">
    <div className="h-1.5 bg-gray-200 w-full" />
    <div className="p-5 space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
      <div className="h-3 bg-gray-200 rounded w-full" />
    </div>
  </div>
);

// ══════════════════════════════════════════════════
// MODAL DE DETALLE — orden correcto:
//   1. Info del servicio (imagen, título, precio)
//   2. Selector de personas + datos de pasajeros
//   3. Mapa al final de cada servicio (NO duplicado)
// ══════════════════════════════════════════════════
// El prop isSeller lo pasa el padre — mis-reservas NUNCA lo pasa (false por defecto)
// Solo HomeSeller lo pasa como true cuando el seller gestiona desde su panel
const ModalDetalleReserva = ({ reserva, onClose, onUpdate, isSeller = false }) => {
  const { user } = useAuth();

  const [personasPorServicio, setPersonasPorServicio] = useState(
    Object.fromEntries(
      (reserva.servicios || []).map((s) => [s.id, s.personas || reserva.personas || 1])
    )
  );

  // Pre-cargar el pasajero 1 con los datos del usuario logueado.
  // Si ya hay pasajeros guardados en Firestore, usarlos. Si no, poner
  // el nombre del usuario en el primero y dejarlo editable.
  const inicializarPasajeros = (s) => {
    const cantInicial = s.personas || reserva.personas || 1;
    return Array.from({ length: cantInicial }, (_, i) => {
      const guardado = s.pasajeros?.[i];
      if (guardado?.nombre) return guardado; // ya tiene datos guardados
      if (i === 0) {
        // Primer pasajero: pre-cargar con datos del usuario logueado
        return {
          nombre: user?.displayName || reserva.fullname || "",
          dni: "",
          email: "", // email adicional (opcional, para invitación)
          esUsuario: true, // flag para identificarlo visualmente
        };
      }
      return { nombre: "", dni: "", email: "" };
    });
  };

  const [datosPersonas, setDatosPersonas] = useState(
    Object.fromEntries(
      (reserva.servicios || []).map((s) => [s.id, inicializarPasajeros(s)])
    )
  );
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState(false);

  // Para seller: cancelar con motivo
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [motivoCancelacion, setMotivoCancelacion] = useState("");
  const [cancelando, setCancelando] = useState(false);

  const actualizarPersonas = (servicioId, cantidad) => {
    const cant = Math.max(1, cantidad);
    setPersonasPorServicio((prev) => ({ ...prev, [servicioId]: cant }));
    setDatosPersonas((prev) => {
      const actual = prev[servicioId] || [];
      if (cant > actual.length) {
        // Agregar pasajeros nuevos vacíos (con campo email opcional)
        const nuevos = Array.from(
          { length: cant - actual.length },
          () => ({ nombre: "", dni: "", email: "" })
        );
        return { ...prev, [servicioId]: [...actual, ...nuevos] };
      }
      return { ...prev, [servicioId]: actual.slice(0, cant) };
    });
  };

  const actualizarDato = (servicioId, idx, campo, valor) => {
    setDatosPersonas((prev) => {
      const arr = [...(prev[servicioId] || [])];
      arr[idx] = { ...arr[idx], [campo]: valor };
      return { ...prev, [servicioId]: arr };
    });
  };

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      const serviciosActualizados = reserva.servicios.map((s) => ({
        ...s,
        personas:  personasPorServicio[s.id] || 1,
        pasajeros: datosPersonas[s.id] || [],
      }));
      const reservaActualizada = { ...reserva, servicios: serviciosActualizados };
      await updateReserva(reservaActualizada);
      if (onUpdate) onUpdate(reservaActualizada);
      setExito(true);
      setTimeout(onClose, 1200);
    } catch (err) {
      console.error(err);
    } finally {
      setGuardando(false);
    }
  };

  // Seller: confirmar reserva
  const handleConfirmar = async () => {
    try {
      await cambiarEstadoReserva(reserva.id, "confirmada");
      if (onUpdate) onUpdate({ ...reserva, estado: "confirmada" });
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  // Seller: cancelar con motivo
  const handleCancelar = async () => {
    if (!motivoCancelacion.trim()) return;
    setCancelando(true);
    try {
      await cambiarEstadoReserva(reserva.id, "cancelada");
      await updateReserva({ ...reserva, estado: "cancelada", motivoCancelacion });
      if (onUpdate) onUpdate({ ...reserva, estado: "cancelada", motivoCancelacion });
      setShowCancelModal(false);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setCancelando(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[88vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Detalle de Reserva</h2>
              <p className="text-sm text-gray-400 mt-0.5">
                {reserva.checkin} → {reserva.checkout}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <EstadoBadge estado={reserva.estado} />
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 ml-1"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="px-6 py-5 space-y-5">
            {/* Datos del turista */}
            <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600">
              <span className="font-semibold text-gray-800">👤 {reserva.fullname}</span>
              <span className="mx-2 text-gray-300">|</span>
              {reserva.email}
            </div>

            {/* ── Un bloque por servicio ── */}
            {(reserva.servicios || []).map((s) => {
              const personas = personasPorServicio[s.id] || 1;
              const pasajeros = datosPersonas[s.id] || [];
              return (
                <div
                  key={s.id}
                  className="border border-gray-200 rounded-2xl overflow-hidden"
                >
                  {/* 1. Info del servicio */}
                  <div className="flex gap-3 p-4 bg-gray-50 border-b border-gray-100">
                    {s.image && (
                      <img
                        src={s.image}
                        alt={s.title}
                        className="w-20 h-16 object-cover rounded-xl flex-shrink-0"
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{s.title}</p>
                      {s.ubicacion && (
                        <p className="text-xs text-gray-500 mt-0.5">📍 {s.ubicacion}</p>
                      )}
                      {s.price && (
                        <p className="text-sm font-bold text-indigo-600 mt-1">
                          ${formatARS(s.price)} × {personas} = ${formatARS(Number(s.price) * personas)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 2. Selector de personas + datos de pasajeros */}
                  {reserva.estado !== "cancelada" && (
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-gray-700">Cantidad de personas</p>
                        <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                          <button
                            onClick={() => actualizarPersonas(s.id, personas - 1)}
                            className="px-3 py-1.5 text-lg text-gray-500 hover:bg-gray-100"
                          >−</button>
                          <span className="px-4 font-bold text-gray-900 text-sm">{personas}</span>
                          <button
                            onClick={() => actualizarPersonas(s.id, personas + 1)}
                            className="px-3 py-1.5 text-lg text-gray-500 hover:bg-gray-100"
                          >+</button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {Array.from({ length: personas }, (_, i) => {
                          const p = pasajeros[i] || {};
                          const esPrimero = i === 0;
                          return (
                            <div key={i} className={`rounded-xl border p-3 ${esPrimero ? "border-indigo-200 bg-indigo-50/50" : "border-gray-100 bg-gray-50"}`}>
                              {/* Label de pasajero con badge "Vos" para el primero */}
                              <div className="flex items-center gap-2 mb-2">
                                <p className="text-xs font-semibold text-gray-600">
                                  Pasajero {i + 1}
                                </p>
                                {esPrimero && (
                                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                                    Vos
                                  </span>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-xs text-gray-400 mb-0.5">Nombre completo *</label>
                                  <input
                                    type="text"
                                    placeholder="Juan Pérez"
                                    value={p.nombre || ""}
                                    onChange={(e) => actualizarDato(s.id, i, "nombre", e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-300 outline-none bg-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-400 mb-0.5">DNI / Pasaporte *</label>
                                  <input
                                    type="text"
                                    placeholder="12345678"
                                    value={p.dni || ""}
                                    onChange={(e) => actualizarDato(s.id, i, "dni", e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-300 outline-none bg-white"
                                  />
                                </div>
                              </div>
                              {/* Email adicional — solo para pasajeros secundarios (opcional) */}
                              {!esPrimero && (
                                <div className="mt-2">
                                  <label className="block text-xs text-gray-400 mb-0.5">
                                    Email (opcional — para enviarle la invitación)
                                  </label>
                                  <input
                                    type="email"
                                    placeholder="acompañante@email.com"
                                    value={p.email || ""}
                                    onChange={(e) => actualizarDato(s.id, i, "email", e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-300 outline-none bg-white"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 3. Mapa — AL FINAL del bloque, no entre campos */}
                  {s.lat && s.lng && (
                    <div className="p-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        📍 Punto de encuentro
                      </p>
                      {/* 
                        FIX: Se usa un div con position:relative e isolation:isolate
                        para que el z-index del tile layer de Leaflet no se escape
                        del contenedor y cause el mapa duplicado / superpuesto.
                      */}
                      <div style={{ position: "relative", isolation: "isolate" }}>
                        <Suspense fallback={
                          <div className="w-full h-40 bg-gray-100 rounded-xl animate-pulse" />
                        }>
                          <MapaServicio
                            lat={s.lat}
                            lng={s.lng}
                            titulo={s.title}
                            height="160px"
                          />
                        </Suspense>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Motivo de cancelación (solo lectura si ya fue cancelada) */}
            {reserva.estado === "cancelada" && reserva.motivoCancelacion && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-red-600 mb-1">Motivo de cancelación</p>
                <p className="text-sm text-red-700">{reserva.motivoCancelacion}</p>
              </div>
            )}

            {/* Botones de acción */}
            <div className="space-y-2 pt-1">
              {/* Turista: guardar cambios */}
              {!isSeller && reserva.estado !== "cancelada" && (
                <button
                  onClick={handleGuardar}
                  disabled={guardando}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-colors shadow-md ${
                    exito
                      ? "bg-green-500 text-white"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
                  }`}
                >
                  {exito ? "✅ Guardado" : guardando ? "Guardando..." : "Guardar cambios"}
                </button>
              )}

              {/* Seller / Admin: confirmar o cancelar */}
              {isSeller && reserva.estado === "pendiente" && (
                <div className="flex gap-2">
                  <button
                    onClick={handleConfirmar}
                    className="flex-1 py-3 rounded-xl font-bold text-sm bg-green-600 hover:bg-green-700 text-white transition-colors"
                  >
                    ✅ Confirmar reserva
                  </button>
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="flex-1 py-3 rounded-xl font-bold text-sm bg-red-500 hover:bg-red-600 text-white transition-colors"
                  >
                    ❌ Cancelar reserva
                  </button>
                </div>
              )}
              {isSeller && reserva.estado === "confirmada" && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="w-full py-3 rounded-xl font-bold text-sm bg-red-500 hover:bg-red-600 text-white transition-colors"
                >
                  ❌ Cancelar reserva
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-modal: motivo de cancelación */}
      {showCancelModal && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"
          onClick={() => setShowCancelModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 mb-1">Cancelar reserva</h3>
            <p className="text-sm text-gray-500 mb-4">
              Dejá un mensaje para el turista explicando el motivo.
            </p>
            <textarea
              rows={3}
              value={motivoCancelacion}
              onChange={(e) => setMotivoCancelacion(e.target.value)}
              placeholder="Ej: No hay disponibilidad para la fecha seleccionada..."
              className="w-full border-2 border-gray-200 focus:border-red-400 rounded-xl px-3 py-2 text-sm outline-none transition-colors resize-none mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm"
              >
                Volver
              </button>
              <button
                onClick={handleCancelar}
                disabled={cancelando || !motivoCancelacion.trim()}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm disabled:opacity-50"
              >
                {cancelando ? "Cancelando..." : "Confirmar cancelación"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ══════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ══════════════════════════════════════════════════
const MisReservas = () => {
  const { reservas, loading, error, handleUpdate, handleDelete } = useMisReservas();
  const [reservaAbierta, setReservaAbierta] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero */}
      <div className="bg-gray-900 text-white py-10 px-4 text-center">
        <h1 className="text-3xl font-bold mb-1">Mis Reservas</h1>
        <p className="text-gray-400 text-sm mt-1">
          Revisá el estado y completá los datos de los pasajeros
        </p>
      </div>

      <main className="flex-grow container mx-auto px-4 py-8 max-w-5xl">
        {loading ? (
          <div className="grid gap-5 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500">{error}</p>
          </div>
        ) : reservas.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-5xl mb-4">🧳</p>
            <p className="text-gray-600 text-lg font-medium mb-2">No hay reservas todavía</p>
            <p className="text-gray-400 text-sm mb-6">Explorá nuestras experiencias y armá tu viaje</p>
            <Link to="/servicios" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
              Ver experiencias →
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {reservas.map((reserva) => {
              const total = (reserva.servicios || []).reduce((acc, s) => {
                return acc + Number(s.price || 0) * Number(s.personas || reserva.personas || 1);
              }, 0);

              return (
                <div
                  key={reserva.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Barra de color según estado */}
                  <div className={`h-1.5 w-full ${
                    reserva.estado === "confirmada" ? "bg-green-400" :
                    reserva.estado === "cancelada"  ? "bg-red-400"   : "bg-yellow-400"
                  }`} />

                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-bold text-gray-900">{reserva.checkin} → {reserva.checkout}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{reserva.email}</p>
                      </div>
                      <EstadoBadge estado={reserva.estado} />
                    </div>

                    {/* Servicios */}
                    <div className="flex gap-2 mb-4 flex-wrap">
                      {(reserva.servicios || []).map((s, i) => (
                        <div key={i} className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2 py-1">
                          {s.image && (
                            <img src={s.image} alt=""
                              className="w-6 h-6 rounded object-cover"
                              onError={(e) => { e.target.style.display = "none"; }}
                            />
                          )}
                          <span className="text-xs text-gray-700 font-medium">
                            {s.title || "Experiencia"}
                          </span>
                          <span className="text-xs text-gray-400">
                            × {s.personas || reserva.personas || 1}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Motivo cancelación (visible en la card si existe) */}
                    {reserva.estado === "cancelada" && reserva.motivoCancelacion && (
                      <p className="text-xs text-red-500 mb-3 bg-red-50 rounded-lg px-3 py-2">
                        ❌ {reserva.motivoCancelacion}
                      </p>
                    )}

                    {total > 0 && (
                      <p className="text-sm font-bold text-indigo-600 mb-4">
                        Total: ${formatARS(total)}
                      </p>
                    )}

                    {/* Acciones */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setReservaAbierta(reserva)}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2 rounded-xl transition-colors"
                      >
                        Ver detalle →
                      </button>
                      {reserva.estado === "confirmada" && (
                        <button className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2 rounded-xl transition-colors">
                          Pagar
                        </button>
                      )}
                      {reserva.estado === "cancelada" && (
                        <button
                          onClick={() => setConfirmDelete(reserva.id)}
                          className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors text-sm font-semibold"
                        >
                          🗑
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />

      {/* Modal detalle */}
      {reservaAbierta && (
        <ModalDetalleReserva
          reserva={reservaAbierta}
          onClose={() => setReservaAbierta(null)}
          onUpdate={(r) => {
            setReservaAbierta(null);
            handleUpdate(r);
          }}
        />
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
            <p className="text-lg font-bold text-gray-900 mb-2">¿Eliminar esta reserva?</p>
            <p className="text-gray-500 text-sm mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={() => { handleDelete(confirmDelete); setConfirmDelete(null); }}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MisReservas;
