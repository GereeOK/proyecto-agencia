import React, { useEffect, useState, lazy, Suspense, useRef, useCallback } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { toast } from "sonner";
import { useAuth } from "../context/authContext";
import {
  fetchServiciosByCompany,
  createServicio,
  updateServicio,
  deleteServicio,
  cambiarEstadoReserva,
  updateReserva,
  sendMensaje,
  subscribeToMensajes,
  confirmarReservaPorSeller,
  cancelarReserva,
} from "../firebase/firestore";
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { app } from "../firebase/config";
import { Timestamp } from "firebase/firestore";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { translateServicio } from "../utils/translate";

const db = getFirestore(app);
const MapaServicio = lazy(() => import("../components/MapaServicio"));

const locales = { es };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const formatARS = (n) => Number(n || 0).toLocaleString("es-AR");
const CATEGORIAS = ["Tours", "Gastronomia", "Traslados", "Experiencias"];

const ESTADO_CFG = {
  pendiente:          { cls: "bg-yellow-100 text-yellow-700", label: "Pendiente", icon: "⏳" },
  confirmada_usuario: { cls: "bg-blue-100 text-blue-700",    label: "Esp. confirmación", icon: "👤" },
  confirmada:         { cls: "bg-green-100 text-green-700",  label: "Confirmada", icon: "✅" },
  cancelada:          { cls: "bg-red-100 text-red-700",      label: "Cancelada", icon: "❌" },
  pagada:             { cls: "bg-purple-100 text-purple-700",label: "Pagada", icon: "💳" },
  finalizada:         { cls: "bg-gray-100 text-gray-600",    label: "Finalizada", icon: "🏁" },
};

const ReservaEstadoBadge = ({ estado }) => {
  const cfg = ESTADO_CFG[estado] || ESTADO_CFG.pendiente;
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.cls}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
};

const StatCard = ({ icon, label, value }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm text-center">
    <p className="text-3xl mb-1">{icon}</p>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-sm text-gray-500 mt-0.5">{label}</p>
  </div>
);

const EstadoBadge = ({ activo }) => (
  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
    activo !== false ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
  }`}>
    {activo !== false ? "Activo" : "Inactivo"}
  </span>
);

// ── Chat tab inside the reservation modal
const TabChatSeller = ({ reserva, user }) => {
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    const unsub = subscribeToMensajes(reserva.id, setMensajes);
    return unsub;
  }, [reserva.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  const handleEnviar = async (e) => {
    e.preventDefault();
    if (!texto.trim() || enviando) return;
    setEnviando(true);
    try {
      await sendMensaje(reserva.id, {
        texto: texto.trim(),
        autorId: user.uid,
        autorNombre: user.fullname || user.email,
        autorRol: "seller",
      });
      setTexto("");
    } catch {
      toast.error("No se pudo enviar el mensaje");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="flex flex-col h-72">
      <div className="flex-1 overflow-y-auto space-y-2 p-3 bg-gray-50 rounded-xl mb-2">
        {mensajes.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-6">No hay mensajes todavía.</p>
        )}
        {mensajes.map((msg) => (
          <div key={msg.id} className={`flex ${msg.autorRol === "seller" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-xs px-3 py-2 rounded-2xl text-sm shadow-sm ${
              msg.autorRol === "seller"
                ? "bg-indigo-600 text-white"
                : "bg-white border border-gray-200 text-gray-800"
            }`}>
              <p className="text-xs font-semibold mb-0.5 opacity-70">{msg.autorNombre}</p>
              <p className="leading-relaxed">{msg.texto}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleEnviar} className="flex gap-2">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escribí tu respuesta..."
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 transition-colors"
        />
        <button
          type="submit"
          disabled={!texto.trim() || enviando}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
        >
          Enviar
        </button>
      </form>
    </div>
  );
};

// ── Reservation management modal with tabs
const ModalGestionReserva = ({ reserva, onClose, initialTab = "detalle" }) => {
  const { user } = useAuth();
  const [tab, setTab] = useState(initialTab);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);

  const canConfirm = reserva.estado === "confirmada_usuario";
  const canCancel = !["cancelada", "pagada"].includes(reserva.estado);

  const handleConfirmar = async () => {
    setLoading(true);
    try {
      await confirmarReservaPorSeller(reserva.id);
      toast.success("Reserva confirmada");
      onClose();
    } catch {
      toast.error("No se pudo confirmar la reserva");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = async () => {
    if (!motivo.trim()) return;
    setLoading(true);
    try {
      await cancelarReserva(reserva.id);
      if (motivo.trim()) {
        await updateReserva({ ...reserva, motivoCancelacion: motivo });
      }
      toast.success("Reserva cancelada");
      onClose();
    } catch {
      toast.error("No se pudo cancelar la reserva");
    } finally {
      setLoading(false);
    }
  };

  const TABS = [
    { id: "detalle",   label: "Detalle" },
    { id: "chat",      label: "Chat" },
    { id: "pasajeros", label: "Pasajeros" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{reserva.fullname}</h2>
            <p className="text-sm text-gray-400">{reserva.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <ReservaEstadoBadge estado={reserva.estado} />
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 border-b border-gray-100">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                tab === t.id
                  ? "text-indigo-700 border-indigo-600"
                  : "text-gray-500 border-transparent hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">

          {/* ── Detalle tab */}
          {tab === "detalle" && (
            <div className="space-y-4">
              {/* Services list */}
              <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Actividades</p>
                {(reserva.servicios || []).map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 bg-indigo-400 rounded-full flex-shrink-0" />
                    <span className="flex-1 font-medium text-gray-800">{s.title || s}</span>
                    {s.fecha && <span className="text-xs text-gray-400">📅 {s.fecha}</span>}
                    {s.horario && <span className="text-xs text-gray-400">🕐 {s.horario}</span>}
                    <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                      {s.personas || 1} pax
                    </span>
                  </div>
                ))}
              </div>

              {/* Confirmation / status section */}
              {canConfirm && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                  <p className="text-sm text-blue-800 font-medium">
                    👤 El turista ya confirmó su parte. Confirmá vos para finalizar.
                  </p>
                  <button
                    onClick={handleConfirmar}
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-50 transition-colors"
                  >
                    {loading ? "Confirmando..." : "✅ Confirmar reserva"}
                  </button>
                </div>
              )}

              {reserva.estado === "pendiente" && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-800">
                  ⏳ Esperando que el turista complete y confirme los datos.
                </div>
              )}

              {reserva.estado === "confirmada" && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800 font-medium">
                  ✅ Reserva confirmada. Esperando el pago del turista.
                </div>
              )}

              {reserva.estado === "pagada" && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-sm text-purple-800 font-medium">
                  💳 Reserva pagada. ¡Todo listo!
                </div>
              )}

              {/* Cancel */}
              {canCancel && !showCancelForm && (
                <button
                  onClick={() => setShowCancelForm(true)}
                  className="w-full text-red-600 border border-red-200 hover:bg-red-50 font-semibold py-2.5 rounded-xl text-sm transition-colors"
                >
                  Cancelar reserva
                </button>
              )}

              {canCancel && showCancelForm && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700">Motivo de la cancelación:</p>
                  <textarea
                    rows={3}
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Ej: No hay disponibilidad para las fechas seleccionadas..."
                    className="w-full border-2 border-gray-200 focus:border-red-400 rounded-xl px-3 py-2 text-sm outline-none transition-colors resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCancelForm(false)}
                      className="flex-1 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm"
                    >
                      Volver
                    </button>
                    <button
                      onClick={handleCancelar}
                      disabled={loading || !motivo.trim()}
                      className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm disabled:opacity-50"
                    >
                      {loading ? "Cancelando..." : "Confirmar cancelación"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Chat tab */}
          {tab === "chat" && <TabChatSeller reserva={reserva} user={user} />}

          {/* ── Pasajeros tab */}
          {tab === "pasajeros" && (
            <div className="space-y-2">
              {(reserva.pasajeros || []).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  El turista aún no cargó los pasajeros.
                </p>
              ) : (
                (reserva.pasajeros || []).map((p, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-3 text-sm">
                    <p className="font-semibold text-gray-800">{p.nombre}</p>
                    {p.dni && <p className="text-gray-500 text-xs mt-0.5">DNI: {p.dni}</p>}
                    {p.fechaNacimiento && (
                      <p className="text-gray-500 text-xs mt-0.5">Nacimiento: {p.fechaNacimiento}</p>
                    )}
                    {i === 0 && <span className="inline-block mt-1 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Titular</span>}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Service create/edit modal
const ModalServicio = ({ servicio, onClose, onSave }) => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: "", description: "", image: "", price: "",
    categoria: "", duracion: "", idioma: "", ubicacion: "",
    incluye: "", lat: "", lng: "",
    from: null, until: null, activo: true,
    whatsapp: "", emailContacto: "",
    ...servicio,
  });
  const [guardando, setGuardando] = useState(false);
  const [traduciendo, setTraduciendo] = useState(false);
  const [error, setError] = useState(null);

  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("El título es obligatorio."); return; }
    setGuardando(true);
    setTraduciendo(true);
    setError(null);
    try {
      const traducciones = await translateServicio(form);
      setTraduciendo(false);
      const dataToSave = { ...form, ...traducciones };
      if (form.id) {
        await updateServicio(form.id, dataToSave);
        onSave(dataToSave);
      } else {
        const id = await createServicio({ ...dataToSave, companyId: user.companyId });
        onSave({ ...dataToSave, id });
      }
      onClose();
    } catch {
      setError("No se pudo guardar. Intentá de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  const dateToString = (val) => {
    if (!val) return "";
    if (val.toDate) return val.toDate().toISOString().split("T")[0];
    if (val instanceof Date) return val.toISOString().split("T")[0];
    return "";
  };

  const inputCls = "w-full border-2 border-gray-200 focus:border-indigo-400 rounded-xl px-3 py-2 text-sm outline-none transition-colors";

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-900">
            {form.id ? "Editar experiencia" : "Nueva experiencia"}
          </h2>
          <button type="button" onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Título *</label>
            <input type="text" value={form.title} onChange={(e) => set("title", e.target.value)}
              placeholder="Ej: Tour de Grafitis en Barracas" className={inputCls} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Descripción *</label>
            <textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)}
              placeholder="Describí la experiencia..." className={inputCls} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">URL de imagen</label>
            <input type="text" value={form.image} onChange={(e) => set("image", e.target.value)}
              placeholder="https://..." className={inputCls} />
            {form.image && (
              <img src={form.image} alt="" className="mt-2 w-full h-32 object-cover rounded-xl"
                onError={(e) => { e.target.style.display = "none"; }} />
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Precio (ARS)</label>
              <input type="number" min="0" value={form.price} onChange={(e) => set("price", e.target.value)}
                placeholder="15000" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Categoría</label>
              <select value={form.categoria} onChange={(e) => set("categoria", e.target.value)} className={inputCls}>
                <option value="">Sin categoría</option>
                {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Duración</label>
              <input type="text" value={form.duracion} onChange={(e) => set("duracion", e.target.value)}
                placeholder="3 horas" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Idioma</label>
              <input type="text" value={form.idioma} onChange={(e) => set("idioma", e.target.value)}
                placeholder="Español, Inglés" className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Ubicación (texto)</label>
            <input type="text" value={form.ubicacion} onChange={(e) => set("ubicacion", e.target.value)}
              placeholder="Barracas, CABA" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">¿Qué incluye?</label>
            <textarea rows={2} value={form.incluye} onChange={(e) => set("incluye", e.target.value)}
              placeholder="Guía local, traslado, entrada..." className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">WhatsApp de contacto</label>
              <input type="text" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)}
                placeholder="5491112345678" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Email de contacto</label>
              <input type="email" value={form.emailContacto} onChange={(e) => set("emailContacto", e.target.value)}
                placeholder="guia@email.com" className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Disponible desde</label>
              <input type="date" value={dateToString(form.from)}
                onChange={(e) => set("from", e.target.value ? Timestamp.fromDate(new Date(e.target.value)) : null)}
                className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Hasta</label>
              <input type="date" value={dateToString(form.until)}
                onChange={(e) => set("until", e.target.value ? Timestamp.fromDate(new Date(e.target.value)) : null)}
                className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Ubicación en el mapa</label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input type="number" step="any" value={form.lat} onChange={(e) => set("lat", e.target.value)}
                placeholder="Latitud: -34.6037" className={inputCls} />
              <input type="number" step="any" value={form.lng} onChange={(e) => set("lng", e.target.value)}
                placeholder="Longitud: -58.3816" className={inputCls} />
            </div>
            <Suspense fallback={<div className="w-full h-40 bg-gray-100 rounded-xl animate-pulse" />}>
              <MapaServicio
                lat={form.lat} lng={form.lng}
                titulo={form.title || "Nueva experiencia"}
                editable height="180px"
                onChangeCoords={(lat, lng) => setForm((p) => ({
                  ...p, lat: lat.toFixed(6), lng: lng.toFixed(6),
                }))}
              />
            </Suspense>
          </div>

          {form.id && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.activo !== false}
                onChange={(e) => set("activo", e.target.checked)}
                className="w-4 h-4 accent-indigo-600" />
              <span className="text-sm text-gray-700">Servicio activo (visible para turistas)</span>
            </label>
          )}
        </div>

        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

        <div className="flex gap-3 mt-5">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm">
            Cancelar
          </button>
          <button type="submit" disabled={guardando}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm disabled:opacity-50">
            {traduciendo ? "Traduciendo..." : guardando ? "Guardando..." : form.id ? "Guardar cambios" : "Crear experiencia"}
          </button>
        </div>
      </form>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// MAIN PAGE
// ────────────────────────────────────────────────────────────
const HomeSeller = () => {
  const { user } = useAuth();
  const [servicios, setServicios] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingReservas, setLoadingReservas] = useState(true);
  const [modalServicio, setModalServicio] = useState(null);
  const [modalReserva, setModalReserva] = useState(null);
  const [modalTab, setModalTab] = useState("detalle");
  const [tab, setTab] = useState("servicios");

  useEffect(() => {
    if (!user?.companyId) { setLoading(false); return; }
    fetchServiciosByCompany(user.companyId)
      .then(setServicios)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!user?.companyId || servicios.length === 0) {
      setLoadingReservas(false);
      return;
    }

    const svcsIds = servicios.map((s) => s.id);
    const chunks = [];
    for (let i = 0; i < svcsIds.length; i += 10) chunks.push(svcsIds.slice(i, i + 10));

    const reservasMap = new Map();
    const unsubs = chunks.map((chunk) => {
      const q = query(collection(db, "reservas"), where("servicios", "array-contains-any", chunk));
      return onSnapshot(q, (snapshot) => {
        snapshot.docs.forEach((doc) => {
          const r = { id: doc.id, ...doc.data() };
          const belongs = (r.servicios || []).some((s) =>
            typeof s === "string" ? svcsIds.includes(s) : svcsIds.includes(s?.id)
          );
          if (belongs) reservasMap.set(doc.id, { ...r, estado: r.estado || "pendiente" });
        });
        setReservas([...reservasMap.values()]);
        setLoadingReservas(false);
      }, (err) => {
        console.error("Error en onSnapshot reservas:", err);
        setLoadingReservas(false);
      });
    });

    return () => unsubs.forEach((u) => u());
  }, [servicios, user]);

  const openModal = (reserva, tabName = "detalle") => {
    setModalReserva(reserva);
    setModalTab(tabName);
  };

  const handleToggle = async (s) => {
    await updateServicio(s.id, { activo: s.activo === false ? true : false });
    setServicios((prev) => prev.map((x) => x.id === s.id ? { ...x, activo: s.activo === false } : x));
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar esta experiencia?")) return;
    await deleteServicio(id);
    setServicios((prev) => prev.filter((x) => x.id !== id));
  };

  const exportCSV = () => {
    if (reservas.length === 0) { toast.error("No hay reservas para exportar"); return; }
    const rows = reservas.map((r) => ({
      Nombre: r.fullname || "",
      Email: r.email || "",
      Estado: r.estado || "",
      Actividades: (r.servicios || []).map((s) => s.title || s).join(" | "),
      Personas: (r.servicios || []).reduce((a, s) => a + (s.personas || 1), 0),
      "Ingreso estimado": (r.servicios || []).reduce((a, s) => a + parseFloat(s.price || 0) * (s.personas || 1), 0),
      "Fecha checkin": r.checkin || "",
    }));
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(","),
      ...rows.map((row) => headers.map((h) => `"${String(row[h]).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reservas-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado");
  };

  // Calendar events
  const parseLocalDate = (fechaStr) => {
    if (!fechaStr) return null;
    const parts = fechaStr.split("-").map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  };

  const calendarEvents = reservas.flatMap((r) =>
    (r.servicios || [])
      .filter((s) => s.fecha)
      .map((s) => ({
        id: `${r.id}-${s.title}`,
        title: `${s.title} — ${r.fullname}`,
        start: parseLocalDate(s.fecha),
        end: parseLocalDate(s.fecha),
        allDay: true,
        resource: r,
      }))
  );

  // Stats
  const activos = servicios.filter((s) => s.activo !== false).length;
  const pendientes = reservas.filter((r) => r.estado === "pendiente").length;
  const esperandoConfirmar = reservas.filter((r) => r.estado === "confirmada_usuario").length;
  const confirmadas = reservas.filter((r) => r.estado === "confirmada" || r.estado === "pagada").length;

  if (!loading && !user?.companyId) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <p className="text-red-500 text-center px-4">
            Tu cuenta no tiene empresa asociada. Contactá al administrador.
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />

      <div className="bg-gray-900 text-white px-4 py-10">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold mb-1">Panel de Vendedor</h1>
          <p className="text-gray-400 text-sm">Gestioná tus experiencias y reservas</p>
        </div>
      </div>

      <main className="flex-grow container mx-auto px-4 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon="🎯" label="Experiencias" value={servicios.length} />
          <StatCard icon="⏳" label="Pendientes" value={pendientes} />
          <StatCard icon="👤" label="Esperando tu OK" value={esperandoConfirmar} />
          <StatCard icon="✅" label="Confirmadas" value={confirmadas} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
          {[
            { id: "servicios",  label: "Mis Experiencias" },
            { id: "reservas",   label: "Reservas" },
            { id: "mensajes",   label: "Mensajes" },
            { id: "calendario", label: "Calendario" },
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors relative ${
                tab === t.id ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
              }`}>
              {t.label}
              {t.id === "reservas" && pendientes > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {pendientes}
                </span>
              )}
              {t.id === "mensajes" && esperandoConfirmar > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {esperandoConfirmar}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── TAB: Servicios */}
        {tab === "servicios" && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">{servicios.length} experiencia{servicios.length !== 1 ? "s" : ""}</p>
              <button onClick={() => setModalServicio({})}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                + Nueva experiencia
              </button>
            </div>

            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3].map((i) => <div key={i} className="bg-white rounded-2xl h-64 animate-pulse border border-gray-100" />)}
              </div>
            ) : servicios.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <p className="text-4xl mb-3">🎭</p>
                <p className="text-gray-600 font-medium mb-1">Todavía no cargaste experiencias</p>
                <p className="text-gray-400 text-sm mb-4">Creá tu primera experiencia para comenzar a recibir reservas</p>
                <button onClick={() => setModalServicio({})}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold">
                  Crear experiencia
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {servicios.map((s) => (
                  <div key={s.id}
                    className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden transition-all ${
                      s.activo !== false ? "border-transparent" : "border-gray-200 opacity-60"
                    }`}>
                    <div className="relative">
                      <img src={s.image} alt={s.title} className="w-full h-40 object-cover"
                        onError={(e) => { e.target.src = "https://placehold.co/400x160?text=Sin+imagen"; }} />
                      <div className="absolute top-2 right-2"><EstadoBadge activo={s.activo} /></div>
                      {s.price && (
                        <div className="absolute bottom-2 left-2 bg-white/90 rounded-full px-2.5 py-0.5 text-xs font-bold text-indigo-700">
                          ${formatARS(s.price)}
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="font-bold text-gray-900 truncate mb-1">{s.title}</p>
                      {s.categoria && <p className="text-xs text-gray-400 mb-1">{s.categoria}</p>}
                      <p className="text-xs text-gray-500 line-clamp-2 mb-3">{s.description}</p>
                      <div className="flex gap-2">
                        <button onClick={() => setModalServicio(s)}
                          className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold py-2 rounded-xl transition-colors">
                          Editar
                        </button>
                        <button onClick={() => handleToggle(s)}
                          className={`flex-1 text-xs font-semibold py-2 rounded-xl transition-colors ${
                            s.activo !== false
                              ? "bg-yellow-50 hover:bg-yellow-100 text-yellow-700"
                              : "bg-green-50 hover:bg-green-100 text-green-700"
                          }`}>
                          {s.activo !== false ? "Desactivar" : "Activar"}
                        </button>
                        <button onClick={() => handleDelete(s.id)}
                          className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors text-xs">
                          🗑
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── TAB: Reservas */}
        {tab === "reservas" && (
          <section>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <p className="text-sm text-gray-500">
                {reservas.length} reserva{reservas.length !== 1 ? "s" : ""}
                {loadingReservas && " · actualizando..."}
              </p>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Tiempo real
                </span>
                <button
                  onClick={exportCSV}
                  className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                >
                  ⬇ Exportar CSV
                </button>
              </div>
            </div>

            {loadingReservas ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="bg-white rounded-2xl h-24 animate-pulse border border-gray-100" />)}
              </div>
            ) : reservas.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <p className="text-4xl mb-3">📋</p>
                <p className="text-gray-600 font-medium">No hay reservas todavía</p>
                <p className="text-gray-400 text-sm mt-1">
                  Cuando los turistas reserven tus experiencias, aparecerán aquí automáticamente
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {reservas
                  .slice()
                  .sort((a, b) => {
                    const order = { confirmada_usuario: 0, pendiente: 1, confirmada: 2, pagada: 3, cancelada: 4 };
                    return (order[a.estado] ?? 5) - (order[b.estado] ?? 5);
                  })
                  .map((r) => (
                    <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900">{r.fullname}</p>
                          <p className="text-sm text-gray-500">{r.email}</p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {(r.servicios || []).map((s, i) => (
                              <span key={i} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                                {s.title || s} × {s.personas || r.personas || 1}
                                {s.fecha ? ` · ${s.fecha}` : ""}
                              </span>
                            ))}
                          </div>
                          {r.estado === "cancelada" && r.motivoCancelacion && (
                            <p className="text-xs text-red-500 mt-2 bg-red-50 rounded-lg px-2 py-1">
                              ❌ {r.motivoCancelacion}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <ReservaEstadoBadge estado={r.estado} />
                          <div className="flex gap-1.5">
                            {r.estado !== "cancelada" && (
                              <button
                                onClick={() => openModal(r, "chat")}
                                className="text-xs border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold px-2.5 py-1.5 rounded-xl transition-colors"
                                title="Ver chat"
                              >
                                💬
                              </button>
                            )}
                            {r.estado !== "cancelada" && r.estado !== "pagada" && (
                              <button
                                onClick={() => openModal(r, "detalle")}
                                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3 py-1.5 rounded-xl transition-colors"
                              >
                                Gestionar →
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </section>
        )}

        {/* ── TAB: Mensajes */}
        {tab === "mensajes" && (
          <section>
            <p className="text-sm text-gray-500 mb-4">
              Hacé clic en una reserva para ver el chat con el turista
            </p>
            {reservas.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <p className="text-4xl mb-3">💬</p>
                <p className="text-gray-600 font-medium">No hay conversaciones todavía</p>
              </div>
            ) : (
              <div className="space-y-2">
                {reservas
                  .filter((r) => r.estado !== "cancelada")
                  .map((r) => (
                    <button
                      key={r.id}
                      onClick={() => openModal(r, "chat")}
                      className="w-full text-left bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900">{r.fullname}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {(r.servicios || []).map((s) => s.title || s).join(", ")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <ReservaEstadoBadge estado={r.estado} />
                          <span className="text-indigo-600 text-sm">→</span>
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </section>
        )}

        {/* ── TAB: Calendario */}
        {tab === "calendario" && (
          <section>
            <p className="text-sm text-gray-500 mb-4">
              Actividades con fecha confirmada por los turistas
            </p>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm"
              style={{ height: "600px" }}>
              <Calendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                culture="es"
                messages={{
                  next: "Sig",
                  previous: "Ant",
                  today: "Hoy",
                  month: "Mes",
                  week: "Semana",
                  day: "Día",
                  agenda: "Agenda",
                  noEventsInRange: "Sin actividades en este período",
                  showMore: (total) => `+${total} más`,
                }}
                eventPropGetter={() => ({
                  style: { backgroundColor: "#4f46e5", borderRadius: "6px", border: "none", fontSize: "12px" },
                })}
                onSelectEvent={(event) => openModal(event.resource, "detalle")}
              />
            </div>
          </section>
        )}
      </main>

      <Footer />

      {/* Modal gestionar reserva */}
      {modalReserva && (
        <ModalGestionReserva
          reserva={modalReserva}
          initialTab={modalTab}
          onClose={() => setModalReserva(null)}
        />
      )}

      {/* Modal crear/editar servicio */}
      {modalServicio !== null && (
        <ModalServicio
          servicio={modalServicio.id ? modalServicio : null}
          onClose={() => setModalServicio(null)}
          onSave={(s) => {
            setServicios((prev) =>
              prev.find((x) => x.id === s.id)
                ? prev.map((x) => x.id === s.id ? s : x)
                : [s, ...prev]
            );
          }}
        />
      )}
    </div>
  );
};

export default HomeSeller;
