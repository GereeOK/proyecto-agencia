import React, { useEffect, useState, lazy, Suspense } from "react";
import { useAuth } from "../context/authContext";
import {
  fetchServiciosByCompany, fetchReservas,
  createServicio, updateServicio, deleteServicio,
  cambiarEstadoReserva,
} from "../firebase/firestore";
import { Timestamp } from "firebase/firestore";
import Navbar from "../components/navbar";
import Footer from "../components/footer";

const MapaServicio = lazy(() => import("../components/MapaServicio"));

const formatARS = (n) => Number(n || 0).toLocaleString("es-AR");

const CATEGORIAS = ["Tours", "Gastronomia", "Traslados", "Experiencias"];

// ── Stat card
const StatCard = ({ icon, label, value }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm text-center">
    <p className="text-3xl mb-1">{icon}</p>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-sm text-gray-500 mt-0.5">{label}</p>
  </div>
);

// ── Badge estado
const EstadoBadge = ({ activo }) => (
  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
    activo !== false ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
  }`}>
    {activo !== false ? "Activo" : "Inactivo"}
  </span>
);

// ── Modal de gestión de reserva (solo para seller/admin)
// El seller puede: confirmar la reserva, o cancelarla dejando un motivo
const ModalGestionReserva = ({ reserva, onClose, onUpdate }) => {
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);
  const [exito, setExito] = useState(null); // "confirmada" | "cancelada"

  const handleConfirmar = async () => {
    setLoading(true);
    try {
      await cambiarEstadoReserva(reserva.id, "confirmada");
      if (onUpdate) onUpdate({ ...reserva, estado: "confirmada" });
      setExito("confirmada");
      setTimeout(onClose, 1200);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCancelar = async () => {
    if (!motivo.trim()) return;
    setLoading(true);
    try {
      await cambiarEstadoReserva(reserva.id, "cancelada");
      // Guardar el motivo junto con el estado
      const { updateReserva } = await import("../firebase/firestore");
      await updateReserva({ ...reserva, estado: "cancelada", motivoCancelacion: motivo });
      if (onUpdate) onUpdate({ ...reserva, estado: "cancelada", motivoCancelacion: motivo });
      setExito("cancelada");
      setTimeout(onClose, 1200);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Gestionar Reserva</h2>
            <p className="text-sm text-gray-400 mt-0.5">{reserva.checkin} → {reserva.checkout}</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Info turista */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="font-semibold text-gray-900">{reserva.fullname}</p>
            <p className="text-sm text-gray-500">{reserva.email}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {(reserva.servicios || []).map((s, i) => (
                <span key={i} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                  {s.title} × {s.personas || reserva.personas || 1}
                </span>
              ))}
            </div>
          </div>

          {/* Feedback de éxito */}
          {exito === "confirmada" && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center text-green-700 font-semibold text-sm">
              ✅ Reserva confirmada
            </div>
          )}
          {exito === "cancelada" && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center text-red-700 font-semibold text-sm">
              ❌ Reserva cancelada
            </div>
          )}

          {/* Acciones según estado — solo si no hay resultado todavía y no está en form de cancelar */}
          {!exito && !showCancelForm && (
            <div className="space-y-2">
              {/* Confirmar — solo si está pendiente */}
              {reserva.estado === "pendiente" && (
                <button
                  onClick={handleConfirmar}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition-colors"
                >
                  {loading ? "Confirmando..." : "✅ Confirmar reserva"}
                </button>
              )}
              {/* Cancelar — disponible para pendiente y confirmada */}
              <button
                onClick={() => setShowCancelForm(true)}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl text-sm transition-colors"
              >
                ❌ Cancelar reserva
              </button>
              {reserva.estado === "confirmada" && (
                <p className="text-xs text-center text-gray-400">
                  Esta reserva ya está confirmada. Solo podés cancelarla.
                </p>
              )}
            </div>
          )}

          {/* Formulario de motivo de cancelación */}
          {!exito && showCancelForm && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700">
                Dejá un mensaje para el turista explicando el motivo:
              </p>
              <textarea
                rows={3}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ej: No hay disponibilidad para las fechas seleccionadas..."
                className="w-full border-2 border-gray-200 focus:border-red-400 rounded-xl px-3 py-2 text-sm outline-none transition-colors resize-none"
              />
              <div className="flex gap-2">
                <button onClick={() => setShowCancelForm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm">
                  Volver
                </button>
                <button onClick={handleCancelar}
                  disabled={loading || !motivo.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm disabled:opacity-50">
                  {loading ? "Cancelando..." : "Confirmar cancelación"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Formulario de servicio (modal)
const ModalServicio = ({ servicio, onClose, onSave }) => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: "", description: "", image: "", price: "",
    categoria: "", duracion: "", idioma: "", ubicacion: "",
    incluye: "", lat: "", lng: "",
    from: null, until: null, activo: true,
    ...servicio,
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("El título es obligatorio."); return; }
    setGuardando(true);
    setError(null);
    try {
      if (form.id) {
        await updateServicio(form.id, { ...form });
        onSave({ ...form });
      } else {
        const id = await createServicio({ ...form, companyId: user.companyId });
        onSave({ ...form, id });
      }
      onClose();
    } catch (err) {
      console.error(err);
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
      <form onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}>

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-900">
            {form.id ? "Editar experiencia" : "Nueva experiencia"}
          </h2>
          <button type="button" onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
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

          {/* Mapa interactivo */}
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
                  ...p, lat: lat.toFixed(6), lng: lng.toFixed(6)
                }))}
              />
            </Suspense>
          </div>

          {/* Activo toggle */}
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
            {guardando ? "Guardando..." : form.id ? "Guardar cambios" : "Crear experiencia"}
          </button>
        </div>
      </form>
    </div>
  );
};

// ── Página principal del Seller
const HomeSeller = () => {
  const { user } = useAuth();
  const [servicios, setServicios] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalServicio, setModalServicio] = useState(null);
  const [modalReserva, setModalReserva] = useState(null); // reserva seleccionada para gestionar
  const [tab, setTab] = useState("servicios"); // "servicios" | "reservas"

  useEffect(() => {
    const cargar = async () => {
      if (!user?.companyId) { setLoading(false); return; }
      try {
        const [svcs, ress] = await Promise.all([
          fetchServiciosByCompany(user.companyId),
          fetchReservas(),
        ]);
        setServicios(svcs);
        // Filtrar reservas que contienen servicios de esta empresa
        // y normalizar el campo estado (las reservas viejas no lo tienen)
        const svcsIds = new Set(svcs.map((s) => s.id));
        const reservasFiltradas = ress
          .filter((r) => (r.servicios || []).some((s) => svcsIds.has(s.id)))
          .map((r) => ({ ...r, estado: r.estado || "pendiente" }));
        setReservas(reservasFiltradas);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [user]);

  const handleToggle = async (s) => {
    await updateServicio(s.id, { activo: s.activo === false ? true : false });
    setServicios((prev) => prev.map((x) => x.id === s.id ? { ...x, activo: s.activo === false } : x));
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar esta experiencia?")) return;
    await deleteServicio(id);
    setServicios((prev) => prev.filter((x) => x.id !== id));
  };

  const activos   = servicios.filter((s) => s.activo !== false).length;
  const inactivos = servicios.length - activos;
  const pendientes = reservas.filter((r) => r.estado === "pendiente").length;

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

      {/* Hero */}
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
          <StatCard icon="✅" label="Activas" value={activos} />
          <StatCard icon="⏸️" label="Inactivas" value={inactivos} />
          <StatCard icon="📋" label="Reservas pendientes" value={pendientes} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {["servicios", "reservas"].map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-colors ${
                tab === t ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
              }`}>
              {t === "servicios" ? "Mis Experiencias" : "Reservas recibidas"}
            </button>
          ))}
        </div>

        {/* TAB: Servicios */}
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
                {[1,2,3].map((i) => (
                  <div key={i} className="bg-white rounded-2xl h-64 animate-pulse border border-gray-100" />
                ))}
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
                      <img src={s.image} alt={s.title}
                        className="w-full h-40 object-cover"
                        onError={(e) => { e.target.src = "https://placehold.co/400x160?text=Sin+imagen"; }} />
                      <div className="absolute top-2 right-2">
                        <EstadoBadge activo={s.activo} />
                      </div>
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

        {/* TAB: Reservas */}
        {tab === "reservas" && (
          <section>
            <p className="text-sm text-gray-500 mb-4">{reservas.length} reserva{reservas.length !== 1 ? "s" : ""} recibida{reservas.length !== 1 ? "s" : ""}</p>
            {reservas.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <p className="text-4xl mb-3">📋</p>
                <p className="text-gray-600 font-medium">No hay reservas todavía</p>
                <p className="text-gray-400 text-sm mt-1">Cuando los turistas reserven tus experiencias, aparecerán aquí</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reservas.map((r) => (
                  <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">{r.fullname}</p>
                        <p className="text-sm text-gray-500">{r.email}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          📅 {r.checkin} → {r.checkout}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {(r.servicios || []).map((s, i) => (
                            <span key={i} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                              {s.title} × {s.personas || r.personas || 1}
                            </span>
                          ))}
                        </div>
                        {/* Motivo de cancelación visible en la card */}
                        {r.estado === "cancelada" && r.motivoCancelacion && (
                          <p className="text-xs text-red-500 mt-2 bg-red-50 rounded-lg px-2 py-1">
                            ❌ {r.motivoCancelacion}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          r.estado === "confirmada" ? "bg-green-100 text-green-700" :
                          r.estado === "cancelada"  ? "bg-red-100 text-red-700"    :
                          "bg-yellow-100 text-yellow-700"
                        }`}>
                          {r.estado || "pendiente"}
                        </span>
                        {/* Botón gestionar — solo si no está cancelada */}
                        {r.estado !== "cancelada" && (
                          <button
                            onClick={() => setModalReserva(r)}
                            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3 py-1.5 rounded-xl transition-colors"
                          >
                            Gestionar →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      <Footer />

      {/* Modal gestionar reserva */}
      {modalReserva && (
        <ModalGestionReserva
          reserva={modalReserva}
          onClose={() => setModalReserva(null)}
          onUpdate={(r) => {
            setReservas((prev) => prev.map((x) => x.id === r.id ? r : x));
            setModalReserva(null);
          }}
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
