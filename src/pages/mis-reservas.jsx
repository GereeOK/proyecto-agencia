import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import { toast } from "sonner";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { useAuth } from "../context/authContext";
import { useMisReservas } from "../hooks/useMisReservas";
import {
  updateServiciosReserva,
  updatePasajeros,
  confirmarReservaPorUsuario,
  cancelarReserva,
  sendMensaje,
  subscribeToMensajes,
  getGrupoFamiliar,
  saveGrupoFamiliar,
  saveResena,
  getResenasByReserva,
} from "../firebase/firestore";
import { Link, useNavigate } from "react-router-dom";

const MapaServicio = lazy(() => import("../components/MapaServicio"));

const formatARS = (n) => Number(n || 0).toLocaleString("es-AR");

const ESTADO_CFG = {
  pendiente:          { cls: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: "⏳", bar: "bg-yellow-400", label: "Pendiente" },
  confirmada_usuario: { cls: "bg-blue-100 text-blue-700 border-blue-200",       icon: "🕐", bar: "bg-blue-400",   label: "Esperando seller" },
  confirmada:         { cls: "bg-green-100 text-green-700 border-green-200",    icon: "✅", bar: "bg-green-400",  label: "Confirmada" },
  cancelada:          { cls: "bg-red-100 text-red-700 border-red-200",          icon: "❌", bar: "bg-red-400",    label: "Cancelada" },
  pagada:             { cls: "bg-purple-100 text-purple-700 border-purple-200", icon: "💳", bar: "bg-purple-400", label: "Pagada" },
};

const EstadoBadge = ({ estado }) => {
  const cfg = ESTADO_CFG[estado] || { cls: "bg-gray-100 text-gray-600 border-gray-200", icon: "•", label: estado || "pendiente" };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${cfg.cls}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
};

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

// ─── Mini calendario de eventos ──────────────────────────────────────────────
const CalendarioEventos = ({ servicios, checkin, checkout }) => {
  const eventos = [...servicios]
    .filter(s => s.fecha)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  const fmtFecha = (f) => {
    const d = new Date(f + "T12:00:00");
    return {
      dia:  d.getDate(),
      mes:  d.toLocaleString("es", { month: "short" }).toUpperCase(),
      dow:  d.toLocaleString("es", { weekday: "short" }),
    };
  };

  if (eventos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-3">📅</p>
        <p className="text-sm font-medium text-gray-600">Sin fechas asignadas</p>
        <p className="text-xs text-gray-400 mt-1">Asigná una fecha a cada actividad en la pestaña Detalle.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-4">
        {eventos.length} actividad/es programada/s
      </p>
      {eventos.map((s, i) => {
        const { dia, mes, dow } = fmtFecha(s.fecha);
        return (
          <div key={i} className="flex items-center gap-4 bg-indigo-50 border border-indigo-100 rounded-xl p-3">
            <div className="flex-shrink-0 w-12 text-center">
              <p className="text-xs font-semibold text-indigo-400">{mes}</p>
              <p className="text-2xl font-bold text-indigo-700 leading-none">{dia}</p>
              <p className="text-xs text-indigo-400">{dow}</p>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">{s.title}</p>
              <div className="flex gap-3 mt-0.5">
                {s.horario && <span className="text-xs text-gray-500">🕐 {s.horario}</span>}
                {s.ubicacion && <span className="text-xs text-gray-500 truncate">📍 {s.ubicacion}</span>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Tab de consultas (chat) ──────────────────────────────────────────────────
const TabConsultas = ({ reservaId, user }) => {
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    const unsub = subscribeToMensajes(reservaId, setMensajes);
    return unsub;
  }, [reservaId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  const handleEnviar = async (e) => {
    e.preventDefault();
    if (!texto.trim()) return;
    setEnviando(true);
    try {
      await sendMensaje(reservaId, {
        texto: texto.trim(),
        autorId: user.uid,
        autorNombre: user.displayName || user.email?.split("@")[0] || "Tú",
        autorRol: "usuario",
      });
      setTexto("");
    } catch {
      toast.error("No se pudo enviar el mensaje");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {mensajes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
          <p className="text-4xl mb-3">💬</p>
          <p className="text-sm font-medium text-gray-600">Sin mensajes todavía</p>
          <p className="text-xs text-gray-400 mt-1">Hacé preguntas al seller sobre tus actividades.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3 pb-3 pr-1" style={{ maxHeight: 280 }}>
          {mensajes.map(m => {
            const esPropio = m.autorRol === "usuario";
            const fecha = m.timestamp?.toDate?.();
            return (
              <div key={m.id} className={`flex ${esPropio ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm ${
                  esPropio
                    ? "bg-indigo-600 text-white rounded-br-sm"
                    : "bg-gray-100 text-gray-800 rounded-bl-sm"
                }`}>
                  {!esPropio && (
                    <p className="text-xs font-semibold text-indigo-500 mb-0.5">{m.autorNombre}</p>
                  )}
                  <p className="leading-snug">{m.texto}</p>
                  {fecha && (
                    <p className={`text-xs mt-1 ${esPropio ? "text-indigo-200" : "text-gray-400"}`}>
                      {fecha.toLocaleString("es", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      )}

      <form onSubmit={handleEnviar} className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
        <input
          value={texto}
          onChange={e => setTexto(e.target.value)}
          placeholder="Escribí tu consulta..."
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <button
          type="submit"
          disabled={enviando || !texto.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-40 transition-colors"
        >
          {enviando ? "..." : "Enviar"}
        </button>
      </form>
    </div>
  );
};

// ─── Tab de pasajeros ─────────────────────────────────────────────────────────
const TabPasajeros = ({ pasajeros, onChange, bloqueado, userId }) => {
  const [grupoFamiliar, setGrupoFamiliar] = useState([]);
  const [mostrarGrupo, setMostrarGrupo] = useState(false);

  useEffect(() => {
    if (userId) getGrupoFamiliar(userId).then(setGrupoFamiliar);
  }, [userId]);

  const setPasajero = (idx, campo, valor) => {
    const nuevo = pasajeros.map((p, i) => i === idx ? { ...p, [campo]: valor } : p);
    onChange(nuevo);
  };

  const agregarPasajero = () => {
    onChange([...pasajeros, { nombre: "", dni: "", fechaNacimiento: "" }]);
  };

  const quitarPasajero = (idx) => {
    if (pasajeros.length <= 1) return;
    onChange(pasajeros.filter((_, i) => i !== idx));
  };

  const cargarDesdeFamiliar = (miembro) => {
    const yaEsta = pasajeros.some(p => p.dni && p.dni === miembro.dni);
    if (yaEsta) { toast.info(`${miembro.nombre} ya está en la lista`); return; }
    onChange([...pasajeros, { nombre: miembro.nombre, dni: miembro.dni || "", fechaNacimiento: miembro.fechaNacimiento || "" }]);
    toast.success("Pasajero agregado", { description: miembro.nombre });
    setMostrarGrupo(false);
  };

  const guardarEnFamiliar = async (pasajero) => {
    if (!userId || !pasajero.nombre) return;
    const yaEsta = grupoFamiliar.some(m => m.dni && m.dni === pasajero.dni);
    if (yaEsta) { toast.info(`${pasajero.nombre} ya está en el grupo familiar`); return; }
    const nuevo = { ...pasajero, id: `${Date.now()}`, relacion: "" };
    const nuevos = [...grupoFamiliar, nuevo];
    await saveGrupoFamiliar(userId, nuevos);
    setGrupoFamiliar(nuevos);
    toast.success("Guardado en grupo familiar", { description: pasajero.nombre });
  };

  const disponiblesEnFamiliar = grupoFamiliar.filter(
    m => !pasajeros.some(p => p.dni && p.dni === m.dni)
  );

  return (
    <div className="space-y-4">
      {/* Cargar del grupo familiar */}
      {!bloqueado && grupoFamiliar.length > 0 && (
        <div>
          <button
            onClick={() => setMostrarGrupo(v => !v)}
            className="flex items-center gap-2 text-sm text-indigo-600 font-semibold hover:underline"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
            </svg>
            Cargar del grupo familiar
          </button>
          {mostrarGrupo && (
            <div className="mt-2 bg-indigo-50 rounded-xl p-3 space-y-1.5">
              {disponiblesEnFamiliar.length === 0 ? (
                <p className="text-xs text-gray-400">Todos los integrantes ya están en la lista.</p>
              ) : (
                disponiblesEnFamiliar.map(m => (
                  <button
                    key={m.id}
                    onClick={() => cargarDesdeFamiliar(m)}
                    className="w-full flex items-center justify-between bg-white rounded-lg px-3 py-2 text-sm hover:bg-indigo-100 transition-colors"
                  >
                    <span className="font-medium text-gray-800">{m.nombre}</span>
                    <span className="text-xs text-gray-400">{m.relacion || (m.dni ? `DNI ${m.dni}` : "")}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Lista de pasajeros */}
      <div className="space-y-3">
        {pasajeros.map((p, i) => (
          <div key={i} className={`rounded-xl border p-3 ${i === 0 ? "border-indigo-200 bg-indigo-50/40" : "border-gray-200 bg-gray-50"}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500">Pasajero {i + 1}</span>
                {i === 0 && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Titular</span>}
              </div>
              <div className="flex gap-1">
                {!bloqueado && p.nombre && (
                  <button
                    onClick={() => guardarEnFamiliar(p)}
                    title="Guardar en grupo familiar"
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-indigo-100 text-gray-400 hover:text-indigo-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
                    </svg>
                  </button>
                )}
                {!bloqueado && i > 0 && (
                  <button
                    onClick={() => quitarPasajero(i)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-400 mb-0.5">Nombre y apellido *</label>
                <input
                  value={p.nombre || ""}
                  onChange={e => setPasajero(i, "nombre", e.target.value)}
                  disabled={bloqueado}
                  placeholder="Juan García"
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-300 outline-none disabled:bg-gray-100 disabled:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-0.5">DNI / Pasaporte *</label>
                <input
                  value={p.dni || ""}
                  onChange={e => setPasajero(i, "dni", e.target.value)}
                  disabled={bloqueado}
                  placeholder="30.123.456"
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-300 outline-none disabled:bg-gray-100 disabled:text-gray-400"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-400 mb-0.5">Fecha de nacimiento</label>
                <input
                  type="date"
                  value={p.fechaNacimiento || ""}
                  onChange={e => setPasajero(i, "fechaNacimiento", e.target.value)}
                  disabled={bloqueado}
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-300 outline-none disabled:bg-gray-100 disabled:text-gray-400"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {!bloqueado && (
        <button
          onClick={agregarPasajero}
          className="w-full border-2 border-dashed border-gray-200 hover:border-indigo-300 text-gray-400 hover:text-indigo-500 rounded-xl py-2.5 text-sm font-medium transition-colors"
        >
          + Agregar pasajero
        </button>
      )}
    </div>
  );
};

// ─── MODAL PRINCIPAL ──────────────────────────────────────────────────────────
const ModalDetalleReserva = ({ reserva: inicial, onClose, onUpdate }) => {
  const { user } = useAuth();
  const [tab, setTab] = useState("detalle");
  const [servicios, setServicios] = useState(inicial.servicios || []);
  const [pasajeros, setPasajeros] = useState(
    inicial.pasajeros?.length
      ? inicial.pasajeros
      : [{ nombre: inicial.fullname || "", dni: "", fechaNacimiento: "" }]
  );
  const [guardando, setGuardando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  const bloqueado = inicial.estado !== "pendiente";

  const setServicioField = (idx, campo, valor) =>
    setServicios(prev => prev.map((s, i) => i === idx ? { ...s, [campo]: valor } : s));

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      await updateServiciosReserva(inicial.id, servicios);
      await updatePasajeros(inicial.id, pasajeros);
      const actualizada = { ...inicial, servicios, pasajeros };
      onUpdate?.(actualizada);
      toast.success("Cambios guardados");
    } catch {
      toast.error("No se pudieron guardar los cambios");
    } finally {
      setGuardando(false);
    }
  };

  const handleConfirmar = async () => {
    const sinFecha = servicios.filter(s => !s.fecha);
    if (sinFecha.length > 0) {
      toast.error(`Falta fecha en: ${sinFecha.map(s => s.title).join(", ")}`);
      setTab("detalle");
      return;
    }
    if (!pasajeros[0]?.nombre || !pasajeros[0]?.dni) {
      toast.error("Completá nombre y DNI del titular");
      setTab("pasajeros");
      return;
    }
    setConfirmando(true);
    try {
      await updateServiciosReserva(inicial.id, servicios);
      await updatePasajeros(inicial.id, pasajeros);
      await confirmarReservaPorUsuario(inicial.id);
      const actualizada = { ...inicial, servicios, pasajeros, estado: "confirmada_usuario", confirmadoPorUsuario: true };
      onUpdate?.(actualizada);
      toast.success("Reserva confirmada. El seller verificará y habilitará el pago.");
      setTimeout(onClose, 2000);
    } catch {
      toast.error("Error al confirmar la reserva");
    } finally {
      setConfirmando(false);
    }
  };

  const TABS = [
    { id: "detalle",    label: "Detalle" },
    { id: "pasajeros",  label: "Pasajeros" },
    { id: "consultas",  label: "Consultas" },
    { id: "calendario", label: "Calendario" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col"
        style={{ maxHeight: "92vh" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gray-900 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-base font-bold">Detalle de Reserva</h2>
            <p className="text-xs text-gray-400 mt-0.5">{inicial.checkin} → {inicial.checkout}</p>
          </div>
          <div className="flex items-center gap-3">
            <EstadoBadge estado={inicial.estado} />
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 flex-shrink-0 bg-white">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-3 text-xs font-semibold transition-colors ${
                tab === t.id
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-400 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* ── DETALLE ── */}
          {tab === "detalle" && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-600 flex items-center gap-2">
                <span className="font-semibold text-gray-800">👤 {inicial.fullname}</span>
                <span className="text-gray-300">|</span>
                <span>{inicial.email}</span>
              </div>

              {servicios.map((s, idx) => (
                <div key={s.id || idx} className="border border-gray-200 rounded-2xl overflow-hidden">
                  {/* Card servicio */}
                  <div className="flex gap-3 p-4 bg-gray-50 border-b border-gray-100">
                    {s.image && (
                      <img src={s.image} alt={s.title}
                        className="w-20 h-16 object-cover rounded-xl flex-shrink-0"
                        onError={e => { e.target.style.display = "none"; }} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{s.title}</p>
                      {s.ubicacion && <p className="text-xs text-gray-500 mt-0.5">📍 {s.ubicacion}</p>}
                      {s.price && (
                        <p className="text-sm font-bold text-indigo-600 mt-1">
                          ${formatARS(s.price)} × {s.personas || 1} = ${formatARS(Number(s.price) * (s.personas || 1))}
                        </p>
                      )}
                    </div>
                    {/* Contador personas inline */}
                    {!bloqueado && (
                      <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden h-8 self-center flex-shrink-0">
                        <button onClick={() => setServicioField(idx, "personas", Math.max(1, (s.personas || 1) - 1))}
                          className="px-2 text-gray-500 hover:bg-gray-100 h-full">−</button>
                        <span className="px-2 text-sm font-bold text-gray-900">{s.personas || 1}</span>
                        <button onClick={() => setServicioField(idx, "personas", (s.personas || 1) + 1)}
                          className="px-2 text-gray-500 hover:bg-gray-100 h-full">+</button>
                      </div>
                    )}
                  </div>

                  {/* Fecha + horario */}
                  <div className="px-4 py-3 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Fecha de la actividad *</label>
                      <input
                        type="date"
                        value={s.fecha || ""}
                        onChange={e => setServicioField(idx, "fecha", e.target.value)}
                        disabled={bloqueado}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 outline-none disabled:bg-gray-50 disabled:text-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Horario preferido</label>
                      <input
                        type="time"
                        value={s.horario || ""}
                        onChange={e => setServicioField(idx, "horario", e.target.value)}
                        disabled={bloqueado}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 outline-none disabled:bg-gray-50 disabled:text-gray-400"
                      />
                    </div>
                  </div>

                  {/* Contacto guía */}
                  {(inicial.estado === "confirmada" || inicial.estado === "pagada") &&
                    (s.whatsapp || s.emailContacto) && (
                    <div className="px-4 pb-3 flex gap-2 flex-wrap">
                      {s.whatsapp && (
                        <a href={`https://wa.me/${s.whatsapp}?text=Hola%2C+tengo+una+reserva+para+${encodeURIComponent(s.title)}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                            <path d="M11.999 2C6.477 2 2 6.484 2 12.017c0 1.987.537 3.84 1.473 5.426L2.05 22l4.646-1.37A9.96 9.96 0 0012 22.034C17.522 22.034 22 17.55 22 12.017 22 6.484 17.522 2 12 2h-.001z"/>
                          </svg>
                          WhatsApp
                        </a>
                      )}
                      {s.emailContacto && (
                        <a href={`mailto:${s.emailContacto}?subject=Reserva%20${encodeURIComponent(s.title)}`}
                          className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                          </svg>
                          Email
                        </a>
                      )}
                    </div>
                  )}

                  {/* Mapa */}
                  {s.lat && s.lng && (
                    <div className="px-4 pb-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">📍 Punto de encuentro</p>
                      <div style={{ isolation: "isolate" }}>
                        <Suspense fallback={<div className="w-full h-36 bg-gray-100 rounded-xl animate-pulse" />}>
                          <MapaServicio lat={s.lat} lng={s.lng} titulo={s.title} height="144px" />
                        </Suspense>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {inicial.estado === "cancelada" && inicial.motivoCancelacion && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-red-600 mb-1">Motivo de cancelación</p>
                  <p className="text-sm text-red-700">{inicial.motivoCancelacion}</p>
                </div>
              )}

              {inicial.estado === "confirmada_usuario" && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
                  🕐 Confirmaste tu parte. Estamos esperando que el seller confirme para habilitar el pago.
                </div>
              )}
            </div>
          )}

          {/* ── PASAJEROS ── */}
          {tab === "pasajeros" && (
            <TabPasajeros
              pasajeros={pasajeros}
              onChange={setPasajeros}
              bloqueado={bloqueado}
              userId={user?.uid}
            />
          )}

          {/* ── CONSULTAS ── */}
          {tab === "consultas" && (
            <TabConsultas reservaId={inicial.id} user={user} />
          )}

          {/* ── CALENDARIO ── */}
          {tab === "calendario" && (
            <CalendarioEventos
              servicios={servicios}
              checkin={inicial.checkin}
              checkout={inicial.checkout}
            />
          )}
        </div>

        {/* Footer */}
        {!bloqueado && (
          <div className="px-6 py-4 bg-gray-50 rounded-b-2xl border-t border-gray-100 flex gap-3 flex-shrink-0">
            <button
              onClick={handleGuardar}
              disabled={guardando}
              className="flex-1 py-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 font-semibold text-sm transition-colors disabled:opacity-50"
            >
              {guardando ? "Guardando..." : "Guardar cambios"}
            </button>
            <button
              onClick={handleConfirmar}
              disabled={confirmando}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors disabled:opacity-50"
            >
              {confirmando ? "Confirmando..." : "✅ Confirmar mi parte"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Estrellas clickeables ────────────────────────────────────────────────────
const StarPicker = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        onClick={() => onChange(n)}
        className={`text-2xl transition-colors ${n <= value ? "text-yellow-400" : "text-gray-200 hover:text-yellow-300"}`}
      >
        ★
      </button>
    ))}
  </div>
);

// ─── Modal de reseñas ─────────────────────────────────────────────────────────
const ModalResena = ({ reserva, user, onClose }) => {
  const [existentes, setExistentes] = useState([]);
  const [ratings, setRatings] = useState({});   // key → { estrellas, texto }
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  // Servicios únicos de la reserva
  const servicios = reserva.servicios || [];

  // companyId del primer servicio que lo tenga
  const companyId = servicios.find((s) => s.companyId)?.companyId || null;

  // Secciones a reseñar
  const secciones = [
    ...servicios.map((s) => ({
      key:    `exp-${s.id || s.title}`,
      tipo:   "experiencia",
      refId:  s.id || s.title,
      nombre: s.title || "Experiencia",
    })),
    ...(companyId ? [{
      key:    `emp-${companyId}`,
      tipo:   "empresa",
      refId:  companyId,
      nombre: "Empresa organizadora",
    }] : []),
    {
      key:    "plataforma",
      tipo:   "plataforma",
      refId:  "baires-essence",
      nombre: "Baires Essence (plataforma)",
    },
  ];

  useEffect(() => {
    getResenasByReserva(reserva.id).then(setExistentes).catch(console.error);
  }, [reserva.id]);

  const yaReseno = (key) => {
    const sec = secciones.find((s) => s.key === key);
    if (!sec) return false;
    return existentes.some((r) => r.tipo === sec.tipo && r.referenciaId === sec.refId);
  };

  const setRating = (key, field, val) =>
    setRatings((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), [field]: val } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const pendientes = secciones.filter(
      (sec) => !yaReseno(sec.key) && (ratings[sec.key]?.estrellas || 0) > 0
    );
    if (pendientes.length === 0) {
      toast.error("Asigná al menos una estrella en alguna sección");
      return;
    }
    setEnviando(true);
    try {
      await Promise.all(
        pendientes.map((sec) =>
          saveResena({
            tipo:            sec.tipo,
            referenciaId:    sec.refId,
            referenciaNombre: sec.nombre,
            reservaId:       reserva.id,
            userId:          user.uid,
            userName:        user.displayName || user.email?.split("@")[0] || "Anónimo",
            estrellas:       ratings[sec.key].estrellas,
            texto:           (ratings[sec.key].texto || "").slice(0, 140),
          })
        )
      );
      setEnviado(true);
      toast.success("¡Gracias por tu reseña!");
      setTimeout(onClose, 1800);
    } catch {
      toast.error("No se pudieron guardar las reseñas");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Calificá tu experiencia</h2>
            <p className="text-sm text-gray-400">
              Reserva del {reserva.checkin}
              {reserva.checkout && reserva.checkout !== reserva.checkin ? ` al ${reserva.checkout}` : ""}
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-4 space-y-5">
            {enviado ? (
              <div className="text-center py-10">
                <p className="text-5xl mb-3">🌟</p>
                <p className="font-bold text-gray-900 text-lg">¡Gracias por tu opinión!</p>
                <p className="text-gray-400 text-sm mt-1">Tu reseña ayuda a otros viajeros</p>
              </div>
            ) : (
              secciones.map((sec) => {
                const done = yaReseno(sec.key);
                const existing = existentes.find((r) => r.tipo === sec.tipo && r.referenciaId === sec.refId);
                const r = ratings[sec.key] || {};

                return (
                  <div key={sec.key} className={`rounded-xl border p-4 ${done ? "bg-gray-50 border-gray-100" : "border-gray-200"}`}>
                    <p className="text-sm font-semibold text-gray-700 mb-2">{sec.nombre}</p>

                    {done ? (
                      <div className="space-y-1">
                        <div className="flex gap-0.5 text-yellow-400 text-lg">
                          {"★".repeat(existing.estrellas)}{"☆".repeat(5 - existing.estrellas)}
                        </div>
                        {existing.texto && (
                          <p className="text-xs text-gray-500 italic">"{existing.texto}"</p>
                        )}
                        <p className="text-xs text-green-600 font-medium">✓ Ya calificaste esto</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <StarPicker
                          value={r.estrellas || 0}
                          onChange={(v) => setRating(sec.key, "estrellas", v)}
                        />
                        <div className="relative">
                          <textarea
                            rows={2}
                            maxLength={140}
                            placeholder="Contá tu experiencia (opcional)..."
                            value={r.texto || ""}
                            onChange={(e) => setRating(sec.key, "texto", e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 transition-colors resize-none"
                          />
                          <span className="absolute bottom-2 right-3 text-xs text-gray-300">
                            {(r.texto || "").length}/140
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {!enviado && (
            <div className="px-6 py-4 border-t border-gray-100">
              <button
                type="submit"
                disabled={enviando}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-sm disabled:opacity-50 transition-colors"
              >
                {enviando ? "Enviando..." : "Enviar reseñas"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────────────────────
const MisReservas = () => {
  const { user } = useAuth();
  const { reservas, loading, error, handleUpdate, handleDelete } = useMisReservas();
  const [reservaAbierta, setReservaAbierta] = useState(null);
  const [reservaParaResena, setReservaParaResena] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />

      <div className="bg-gray-900 text-white py-10 px-4 text-center">
        <h1 className="text-3xl font-bold mb-1">Mis Reservas</h1>
        <p className="text-gray-400 text-sm mt-1">Revisá el estado, cargá pasajeros y coordiná tus actividades</p>
      </div>

      <main className="flex-grow container mx-auto px-4 py-8 max-w-5xl">
        {loading ? (
          <div className="grid gap-5 md:grid-cols-2">
            {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <div className="text-center py-20"><p className="text-red-500">{error}</p></div>
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
            {reservas.map(reserva => {
              const total = (reserva.servicios || []).reduce(
                (acc, s) => acc + Number(s.price || 0) * Number(s.personas || reserva.personas || 1), 0
              );
              const barColor = ESTADO_CFG[reserva.estado]?.bar || "bg-yellow-400";

              return (
                <div key={reserva.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
                  <div className={`h-1.5 w-full ${barColor}`} />
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-bold text-gray-900">{reserva.checkin} → {reserva.checkout}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{reserva.email}</p>
                      </div>
                      <EstadoBadge estado={reserva.estado} />
                    </div>

                    <div className="flex gap-2 mb-4 flex-wrap">
                      {(reserva.servicios || []).map((s, i) => (
                        <div key={i} className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2 py-1">
                          {s.image && (
                            <img src={s.image} alt="" className="w-6 h-6 rounded object-cover"
                              onError={e => { e.target.style.display = "none"; }} />
                          )}
                          <span className="text-xs text-gray-700 font-medium">{s.title || "Experiencia"}</span>
                          <span className="text-xs text-gray-400">× {s.personas || reserva.personas || 1}</span>
                          {s.fecha && <span className="text-xs text-indigo-500 font-medium">{s.fecha}</span>}
                        </div>
                      ))}
                    </div>

                    {total > 0 && (
                      <p className="text-sm font-bold text-indigo-600 mb-4">Total: ${formatARS(total)}</p>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => setReservaAbierta(reserva)}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2 rounded-xl transition-colors"
                      >
                        Ver detalle →
                      </button>
                      {reserva.estado === "confirmada" && (
                        <button
                          onClick={() => navigate("/pagar", { state: { reserva } })}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2 rounded-xl transition-colors"
                        >
                          💳 Pagar
                        </button>
                      )}
                      {(reserva.estado === "pagada" || reserva.estado === "confirmada") && (
                        <button
                          onClick={() => setReservaParaResena(reserva)}
                          className="px-4 py-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded-xl text-sm font-semibold transition-colors"
                          title="Dejar reseña"
                        >
                          ⭐
                        </button>
                      )}
                      {reserva.estado === "cancelada" && (
                        <button
                          onClick={() => setConfirmDelete(reserva.id)}
                          className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-semibold"
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

      {reservaAbierta && (
        <ModalDetalleReserva
          reserva={reservaAbierta}
          onClose={() => setReservaAbierta(null)}
          onUpdate={r => { setReservaAbierta(null); handleUpdate(r); }}
        />
      )}

      {reservaParaResena && (
        <ModalResena
          reserva={reservaParaResena}
          user={user}
          onClose={() => setReservaParaResena(null)}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
            <p className="text-lg font-bold text-gray-900 mb-2">¿Eliminar esta reserva?</p>
            <p className="text-gray-500 text-sm mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm">
                Cancelar
              </button>
              <button onClick={() => { handleDelete(confirmDelete); setConfirmDelete(null); }}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm">
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
