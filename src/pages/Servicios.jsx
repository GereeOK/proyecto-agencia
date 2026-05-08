// Servicios.jsx — Flujo TripAdvisor completo con carrito
// Paso 1: elegir fechas → Paso 2: ver servicios → Paso 3: modal detalle + mapa
// → Agregar al carrito → Paso 4: revisar carrito y confirmar

import React, { useEffect, useState, lazy, Suspense } from "react";
import { fetchServiciosActivos, saveReservaTransaccional, toggleFavorito, getFavoritos, fetchResenasExperiencias } from "../firebase/firestore";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { useAuth } from "../context/authContext";
import { useCarrito } from "../context/carritoContext";
import { useNavigate, Link } from "react-router-dom";
import { getLang, useLang } from "../utils/translate";

const MapaServicio = lazy(() => import("../components/MapaServicio"));

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────
const Stars = ({ rating, count }) => {
  if (!rating) return <span className="text-xs text-gray-400 italic">Sin reseñas</span>;
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} className={`w-4 h-4 ${i < full ? "text-green-600" : i === full && half ? "text-green-400" : "text-gray-300"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
      <span className="ml-1 text-sm text-gray-500">
        {rating.toFixed(1)}{count > 0 ? ` (${count})` : ""}
      </span>
    </span>
  );
};

// ─────────────────────────────────────────
// MODAL DE RESEÑAS DEL SERVICIO
// ─────────────────────────────────────────
const ModalResenas = ({ servicio, data, onClose }) => {
  const lang = useLang();
  return (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
        <div>
          <h3 className="font-bold text-gray-900 line-clamp-1">{getLang(servicio, "title", lang)}</h3>
          <p className="text-sm text-gray-500">
            {data.count} reseña{data.count !== 1 ? "s" : ""} · Promedio {data.avg.toFixed(1)} ⭐
          </p>
        </div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 flex-shrink-0 ml-3">
          <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {data.list.map((r, i) => (
          <div key={r.id || i} className="border-b border-gray-100 pb-4 last:border-0">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-sm text-gray-800">{r.userName || "Usuario"}</span>
              <span className="text-xs text-gray-400">
                {r.timestamp?.toDate?.().toLocaleDateString("es-AR") || ""}
              </span>
            </div>
            <Stars rating={r.estrellas}/>
            {r.texto && <p className="text-sm text-gray-600 mt-1">{r.texto}</p>}
          </div>
        ))}
      </div>
    </div>
  </div>
  );
};

const catColor = {
  tours: "bg-purple-100 text-purple-700",
  gastronomia: "bg-orange-100 text-orange-700",
  traslados: "bg-blue-100 text-blue-700",
  experiencias: "bg-pink-100 text-pink-700",
};
const normCat = (v) =>
  v?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "";

const CatBadge = ({ cat }) => (
  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wide ${catColor[normCat(cat)] || "bg-gray-100 text-gray-600"}`}>
    {cat || "Experiencia"}
  </span>
);

const formatARS = (n) => Number(n).toLocaleString("es-AR");

// ─────────────────────────────────────────
// PASO 1 — SELECTOR DE FECHAS
// ─────────────────────────────────────────
const SelectorFechas = ({ onConfirmar }) => {
  const { carrito, setFechas } = useCarrito();
  const [checkin, setCheckin] = useState(carrito.checkin || "");
  const [checkout, setCheckout] = useState(carrito.checkout || "");
  const [error, setError] = useState("");
  const hoy = new Date().toISOString().split("T")[0];

  const confirmar = () => {
    if (!checkin) return setError("Seleccioná una fecha de inicio.");
    if (!checkout) return setError("Seleccioná una fecha de fin.");
    if (checkout <= checkin) return setError("La fecha de fin debe ser posterior al inicio.");
    setFechas(checkin, checkout);
    onConfirmar();
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center px-4">
      {/* Logo / branding */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-white tracking-tight">Baires Essence</h1>
        <p className="text-gray-400 mt-2 text-lg">Experiencias únicas en Buenos Aires</p>
      </div>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">¿Cuándo viajás?</h2>
        <p className="text-gray-500 text-sm mb-6">Elegí tus fechas para ver los servicios disponibles</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Llegada</label>
            <input type="date" min={hoy} value={checkin}
              onChange={(e) => { setCheckin(e.target.value); setError(""); }}
              className="w-full border-2 border-gray-200 focus:border-primary-500 rounded-xl px-4 py-3 text-gray-900 text-sm outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Salida</label>
            <input type="date" min={checkin || hoy} value={checkout}
              onChange={(e) => { setCheckout(e.target.value); setError(""); }}
              className="w-full border-2 border-gray-200 focus:border-primary-500 rounded-xl px-4 py-3 text-gray-900 text-sm outline-none transition-colors" />
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <button onClick={confirmar}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl text-base transition-colors shadow-lg">
          Ver experiencias disponibles →
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────
// MODAL DE DETALLE DEL SERVICIO
// ─────────────────────────────────────────
const ModalDetalle = ({ servicio, onClose, resenas, onVerResenas }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const lang = useLang();
  const { carrito, agregarItem, quitarItem, estaEnCarrito } = useCarrito();
  const [personasModal, setPersonasModal] = useState(carrito.personas || 1);
  const enCarrito = estaEnCarrito(servicio.id);

  const subtotal = servicio.price ? Number(servicio.price) * personasModal : null;

  const handleAgregar = () => {
    if (!user) { navigate("/login"); return; }
    agregarItem({ ...servicio, personasSeleccionadas: personasModal });
    onClose();
  };

  const handleQuitar = () => {
    quitarItem(servicio.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>

        {/* Imagen hero */}
        <div className="relative">
          <img src={servicio.image} alt={getLang(servicio, "title", lang)}
            className="w-full h-64 object-cover rounded-t-2xl"
            onError={(e) => { e.target.src = "https://placehold.co/800x256?text=Sin+imagen"; }} />
          <button onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-white">
            <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
          {servicio.categoria && (
            <div className="absolute bottom-3 left-3"><CatBadge cat={servicio.categoria}/></div>
          )}
        </div>

        <div className="flex flex-col md:flex-row">
          {/* ── Info */}
          <div className="flex-1 p-6 border-r border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">{getLang(servicio, "title", lang)}</h2>
            <div className="flex items-center gap-3 flex-wrap">
              <Stars rating={resenas?.avg} count={resenas?.count}/>
              {resenas?.count > 0 && (
                <button type="button" onClick={onVerResenas}
                  className="text-xs text-primary-600 hover:underline font-medium">
                  Ver {resenas.count} reseña{resenas.count !== 1 ? "s" : ""} →
                </button>
              )}
            </div>

            {/* Detalles rápidos */}
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
              {servicio.duracion && (
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  {servicio.duracion}
                </span>
              )}
              {servicio.idioma && (
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10"/></svg>
                  {servicio.idioma}
                </span>
              )}
              {servicio.ubicacion && (
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-primary-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg>
                  {servicio.ubicacion}
                </span>
              )}
            </div>

            {/* Disponibilidad */}
            {(servicio.from || servicio.until) && (
              <div className="mt-3 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                📅 Disponible:{" "}
                {servicio.from?.toDate ? servicio.from.toDate().toLocaleDateString("es-AR") : ""}
                {servicio.from && servicio.until && " → "}
                {servicio.until?.toDate ? servicio.until.toDate().toLocaleDateString("es-AR") : ""}
              </div>
            )}

            <p className="mt-4 text-gray-600 text-sm leading-relaxed">{getLang(servicio, "description", lang)}</p>

            {servicio.incluye && (
              <div className="mt-4 bg-primary-50 rounded-xl p-4">
                <p className="text-sm font-semibold text-primary-800 mb-1">✅ ¿Qué incluye?</p>
                <p className="text-sm text-primary-700">{getLang(servicio, "incluye", lang)}</p>
              </div>
            )}

            {/* Mapa */}
            {servicio.lat && servicio.lng && (
              <div className="mt-5">
                <p className="text-sm font-semibold text-gray-700 mb-2">📍 Punto de encuentro</p>
                <Suspense fallback={<div className="w-full h-48 bg-gray-100 rounded-xl animate-pulse"/>}>
                  <MapaServicio lat={servicio.lat} lng={servicio.lng} titulo={servicio.title} height="200px"/>
                </Suspense>
              </div>
            )}
          </div>

          {/* ── Panel de acción */}
          <div className="md:w-72 p-6 bg-gray-50 rounded-b-2xl md:rounded-r-2xl md:rounded-bl-none flex flex-col gap-4">
            {/* Precio */}
            <div>
              {servicio.price ? (
                <>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Desde</p>
                  <p className="text-3xl font-bold text-gray-900">${formatARS(servicio.price)}</p>
                  <p className="text-xs text-gray-500">por persona</p>
                </>
              ) : (
                <p className="text-sm text-gray-500 italic">Precio a consultar</p>
              )}
            </div>

            {/* Personas */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Cantidad de personas</label>
              <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                <button onClick={() => setPersonasModal((p) => Math.max(1, p - 1))}
                  className="px-4 py-3 text-xl text-gray-500 hover:bg-gray-100 transition-colors">−</button>
                <span className="flex-1 text-center font-bold text-gray-900">{personasModal}</span>
                <button onClick={() => setPersonasModal((p) => p + 1)}
                  className="px-4 py-3 text-xl text-gray-500 hover:bg-gray-100 transition-colors">+</button>
              </div>
            </div>

            {/* Fechas del carrito */}
            <div className="bg-white border border-gray-200 rounded-xl p-3 text-sm text-gray-600">
              <p className="font-semibold text-gray-800 mb-1">Tu viaje</p>
              <p>📅 {carrito.checkin} → {carrito.checkout}</p>
            </div>

            {/* Subtotal */}
            {subtotal && (
              <div className="bg-primary-50 rounded-xl p-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>${formatARS(servicio.price)} × {personasModal}</span>
                  <span>${formatARS(subtotal)}</span>
                </div>
                <div className="border-t border-primary-100 mt-2 pt-2 flex justify-between font-bold text-gray-900">
                  <span>Subtotal</span>
                  <span>${formatARS(subtotal)}</span>
                </div>
              </div>
            )}

            {/* Botón agregar / quitar */}
            {!user ? (
              <Link to="/login"
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl text-sm text-center transition-colors">
                Iniciá sesión para reservar
              </Link>
            ) : enCarrito ? (
              <div className="flex flex-col gap-2">
                <div className="w-full bg-green-100 text-green-700 font-semibold py-3 rounded-xl text-sm text-center">
                  ✅ Agregado al carrito
                </div>
                <button onClick={handleQuitar}
                  className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-medium py-2 rounded-xl text-sm transition-colors">
                  Quitar del carrito
                </button>
              </div>
            ) : (
              <button onClick={handleAgregar}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl text-sm transition-colors shadow-md">
                + Agregar al carrito
              </button>
            )}

            {/* Contacto con el guía */}
            {(servicio.whatsapp || servicio.emailContacto) && (
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contactar al guía</p>
                {servicio.whatsapp && (
                  <a
                    href={`https://wa.me/${servicio.whatsapp}?text=Hola%2C+me+interesa+la+experiencia+${encodeURIComponent(getLang(servicio, "title", lang))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.999 2C6.477 2 2 6.484 2 12.017c0 1.987.537 3.84 1.473 5.426L2.05 22l4.646-1.37A9.96 9.96 0 0012 22.034C17.522 22.034 22 17.55 22 12.017 22 6.484 17.522 2 12 2h-.001zm.001 18.034a7.97 7.97 0 01-4.073-1.113l-.292-.174-3.03.894.898-3.02-.19-.31A7.994 7.994 0 014 12.017C4 7.589 7.582 4 12 4s8 3.589 8 8.017c0 4.428-3.582 8.017-8 8.017z"/></svg>
                    Consultar por WhatsApp
                  </a>
                )}
                {servicio.emailContacto && (
                  <a
                    href={`mailto:${servicio.emailContacto}?subject=Consulta%20sobre%20${encodeURIComponent(getLang(servicio, "title", lang))}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-center gap-2 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl text-sm transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                    Enviar email
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────
// CARRITO — panel lateral deslizable
// ─────────────────────────────────────────
const PanelCarrito = ({ open, onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const lang = useLang();
  const { carrito, quitarItem, limpiarCarrito } = useCarrito();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const total = carrito.items.reduce((acc, s) => {
    const p = Number(s.price || 0);
    const per = Number(s.personasSeleccionadas || carrito.personas || 1);
    return acc + p * per;
  }, 0);

  const confirmar = async () => {
    if (!user) { navigate("/login"); return; }
    if (carrito.items.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      await saveReservaTransaccional({
        fullname: user.displayName || user.email,
        email: user.email,
        checkin: carrito.checkin,
        checkout: carrito.checkout,
        personas: carrito.personas,
        servicios: carrito.items.map((s) => ({
          id: s.id,
          title: s.title,
          image: s.image,
          price: s.price,
          lat: s.lat || null,
          lng: s.lng || null,
          personas: s.personasSeleccionadas || carrito.personas,
        })),
        total,
      });
      limpiarCarrito();
      navigate("/reserva-exitosa");
    } catch (err) {
      console.error(err);
      setError("No se pudo confirmar la reserva. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      {open && <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose}/>}

      {/* Panel */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            🛒 Mi reserva
            {carrito.items.length > 0 && (
              <span className="ml-2 bg-primary-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {carrito.items.length}
              </span>
            )}
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Fechas */}
        <div className="px-5 py-3 bg-primary-50 border-b border-primary-100 text-sm text-primary-800">
          📅 {carrito.checkin || "—"} → {carrito.checkout || "—"}
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {carrito.items.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 text-4xl mb-3">🧳</p>
              <p className="text-gray-500">Tu carrito está vacío.</p>
              <p className="text-gray-400 text-sm mt-1">Agregá experiencias para armar tu viaje.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {carrito.items.map((s) => {
                const personas = s.personasSeleccionadas || carrito.personas || 1;
                const subtotal = s.price ? Number(s.price) * personas : null;
                return (
                  <li key={s.id} className="flex gap-3 bg-gray-50 rounded-xl p-3">
                    <img src={s.image} alt={getLang(s, "title", lang)}
                      className="w-20 h-16 object-cover rounded-lg flex-shrink-0"
                      onError={(e) => { e.target.src = "https://placehold.co/80x64?text=img"; }}/>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm truncate">{getLang(s, "title", lang)}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{personas} persona{personas > 1 ? "s" : ""}</p>
                      {subtotal && (
                        <p className="text-sm font-bold text-primary-600 mt-0.5">${formatARS(subtotal)}</p>
                      )}
                    </div>
                    <button onClick={() => quitarItem(s.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0 self-start mt-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer con total y confirmar */}
        {carrito.items.length > 0 && (
          <div className="px-5 py-4 border-t border-gray-100 space-y-3">
            {total > 0 && (
              <div className="flex justify-between text-gray-900 font-bold text-base">
                <span>Total estimado</span>
                <span>${formatARS(total)}</span>
              </div>
            )}
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button onClick={confirmar} disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl text-sm transition-colors shadow-md">
              {loading ? "Procesando..." : "Confirmar reserva →"}
            </button>
            <button onClick={limpiarCarrito}
              className="w-full text-gray-400 hover:text-red-500 text-xs text-center transition-colors py-1">
              Vaciar carrito
            </button>
          </div>
        )}
      </div>
    </>
  );
};

// ─────────────────────────────────────────
// CATÁLOGO DE SERVICIOS (Paso 2)
// ─────────────────────────────────────────
const CATEGORIAS = ["Todas", "Tours", "Gastronomia", "Traslados", "Experiencias"];

const Catalogo = ({ onCambiarFechas }) => {
  const { user } = useAuth();
  const lang = useLang();
  const { carrito, estaEnCarrito } = useCarrito();
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [catActiva, setCatActiva] = useState("Todas");
  const [seleccionado, setSeleccionado] = useState(null);
  const [carritoOpen, setCarritoOpen] = useState(false);
  const [favs, setFavs] = useState(new Set());
  const [resenasMap, setResenasMap] = useState({});
  const [verResenas, setVerResenas] = useState(null);

  useEffect(() => {
    fetchServiciosActivos()
      .then(setServicios)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchResenasExperiencias().then((resenas) => {
      const acc = {};
      resenas.forEach((r) => {
        if (!r.referenciaId) return;
        if (!acc[r.referenciaId]) acc[r.referenciaId] = { total: 0, count: 0, list: [] };
        acc[r.referenciaId].total += Number(r.estrellas || 0);
        acc[r.referenciaId].count += 1;
        acc[r.referenciaId].list.push(r);
      });
      const result = {};
      Object.entries(acc).forEach(([id, d]) => {
        result[id] = { avg: d.total / d.count, count: d.count, list: d.list };
      });
      setResenasMap(result);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!user) { setFavs(new Set()); return; }
    getFavoritos(user.uid).then((items) => setFavs(new Set(items.map((i) => i.id))));
  }, [user]);

  const handleToggleFav = async (e, servicio) => {
    e.stopPropagation();
    if (!user) return;
    const added = await toggleFavorito(user.uid, servicio);
    setFavs((prev) => {
      const next = new Set(prev);
      added ? next.add(servicio.id) : next.delete(servicio.id);
      return next;
    });
  };

  const filtrados = servicios.filter((s) => {
    const q = busqueda.toLowerCase();
    const matchQ = getLang(s, "title", lang).toLowerCase().includes(q) ||
      getLang(s, "description", lang).toLowerCase().includes(q);
    const matchCat = catActiva === "Todas" || normCat(s.categoria) === normCat(catActiva);
    return matchQ && matchCat;
  });

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero con fechas seleccionadas + búsqueda */}
      <div className="bg-gray-900 text-white py-8 px-4">
        <div className="container mx-auto">
          {/* Fechas seleccionadas — clickeables para cambiar */}
          <div className="flex items-center justify-center gap-3 mb-5">
            <button onClick={onCambiarFechas}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-4 py-2 text-sm transition-colors">
              <svg className="w-4 h-4 text-primary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              <span className="text-white font-medium">{carrito.checkin}</span>
              <span className="text-gray-400">→</span>
              <span className="text-white font-medium">{carrito.checkout}</span>
              <span className="text-gray-400 text-xs ml-1">✏️ Cambiar</span>
            </button>
          </div>

          <h1 className="text-2xl font-bold text-center mb-1">Experiencias disponibles</h1>
          <p className="text-gray-400 text-center text-sm mb-5">Elegí las que te interesan y armalas en tu carrito</p>

          {/* Búsqueda */}
          <div className="max-w-lg mx-auto relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input type="text" placeholder="Buscar experiencias..."
              value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 shadow-lg"/>
          </div>
        </div>
      </div>

      {/* Filtros por categoría — sticky */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="container mx-auto px-4 py-2.5 flex items-center justify-between gap-2">
          <div className="flex gap-2 overflow-x-auto">
            {CATEGORIAS.map((cat) => (
              <button key={cat} onClick={() => setCatActiva(cat)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  catActiva === cat
                    ? "bg-primary-600 text-white border-primary-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-primary-400"}`}>
                {cat}
              </button>
            ))}
          </div>

          {/* Botón carrito flotante en la barra */}
          <button onClick={() => setCarritoOpen(true)}
            className="flex-shrink-0 flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-1.5 rounded-full text-sm font-semibold transition-colors shadow-md">
            🛒
            {carrito.items.length > 0 && (
              <span className="bg-white text-primary-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
                {carrito.items.length}
              </span>
            )}
            <span className="hidden sm:inline">Mi reserva</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      <main className="flex-grow container mx-auto px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1,2,3,4,5,6].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
                <div className="w-full h-48 bg-gray-200"/>
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"/>
                  <div className="h-3 bg-gray-200 rounded w-1/2"/>
                </div>
              </div>
            ))}
          </div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-5xl mb-4">🔍</p>
            <p className="text-gray-500">No encontramos experiencias con ese filtro.</p>
            <button onClick={() => { setBusqueda(""); setCatActiva("Todas"); }}
              className="mt-3 text-primary-600 hover:underline text-sm">Limpiar filtros</button>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-400 mb-4">
              {filtrados.length} experiencia{filtrados.length !== 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtrados.map((s) => {
                const enCarrito = estaEnCarrito(s.id);
                return (
                  <div key={s.id}
                    className={`group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border-2 ${enCarrito ? "border-primary-400" : "border-transparent"}`}
                    onClick={() => setSeleccionado(s)}>
                    <div className="relative overflow-hidden">
                      <img src={s.image} alt={getLang(s, "title", lang)}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { e.target.src = "https://placehold.co/400x192?text=Sin+imagen"; }}/>
                      {s.categoria && <div className="absolute top-3 left-3"><CatBadge cat={s.categoria}/></div>}
                      {s.price && (
                        <div className="absolute top-3 right-3 bg-white/95 rounded-full px-2.5 py-1 text-xs font-bold text-primary-700 shadow">
                          ${formatARS(s.price)}
                        </div>
                      )}
                      {/* Favorito */}
                      {user && (
                        <button
                          onClick={(e) => handleToggleFav(e, s)}
                          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 shadow hover:bg-white transition-colors z-10"
                          title={favs.has(s.id) ? "Quitar de favoritos" : "Guardar"}
                        >
                          <svg className={`w-4 h-4 transition-colors ${favs.has(s.id) ? "text-red-500 fill-red-500" : "text-gray-400"}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} fill="none">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                          </svg>
                        </button>
                      )}
                      {/* Badge "En carrito" */}
                      {enCarrito && (
                        <div className="absolute bottom-3 right-3 bg-primary-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
                          ✅ Agregado
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors line-clamp-1">
                        {getLang(s, "title", lang)}
                      </h3>
                      <div className="flex items-center gap-3 flex-wrap">
                        <Stars rating={resenasMap[s.id]?.avg} count={resenasMap[s.id]?.count}/>
                        {resenasMap[s.id]?.count > 0 && (
                          <button type="button"
                            onClick={(e) => { e.stopPropagation(); setVerResenas({ servicio: s, data: resenasMap[s.id] }); }}
                            className="text-xs text-primary-600 hover:underline font-medium">
                            Ver {resenasMap[s.id].count} reseña{resenasMap[s.id].count !== 1 ? "s" : ""} →
                          </button>
                        )}
                      </div>
                      <div className="flex gap-3 mt-2 text-xs text-gray-400">
                        {s.duracion && <span>⏱ {s.duracion}</span>}
                        {s.ubicacion && <span className="truncate">📍 {s.ubicacion}</span>}
                      </div>
                      <p className="text-gray-500 text-sm mt-2 line-clamp-2">{getLang(s, "description", lang)}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-primary-600 text-sm font-semibold group-hover:underline">
                          Ver detalles →
                        </span>
                        {!s.price && <span className="text-xs text-gray-400">A consultar</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

      <Footer/>

      {/* Modal de detalle */}
      {seleccionado && (
        <ModalDetalle
          servicio={seleccionado}
          onClose={() => setSeleccionado(null)}
          resenas={resenasMap[seleccionado.id]}
          onVerResenas={() => setVerResenas({ servicio: seleccionado, data: resenasMap[seleccionado.id] })}
        />
      )}

      {/* Modal de reseñas */}
      {verResenas && (
        <ModalResenas
          servicio={verResenas.servicio}
          data={verResenas.data}
          onClose={() => setVerResenas(null)}
        />
      )}

      {/* Panel carrito */}
      <PanelCarrito open={carritoOpen} onClose={() => setCarritoOpen(false)}/>
    </div>
  );
};

// ─────────────────────────────────────────
// PÁGINA PRINCIPAL — orquesta los pasos
// ─────────────────────────────────────────
const Servicios = () => {
  const { carrito } = useCarrito();
  // Si ya hay fechas cargadas, ir directo al catálogo
  const [paso, setPaso] = useState(
    carrito.checkin && carrito.checkout ? "catalogo" : "fechas"
  );

  return paso === "fechas"
    ? <SelectorFechas onConfirmar={() => setPaso("catalogo")}/>
    : <Catalogo onCambiarFechas={() => setPaso("fechas")}/>;
};

export default Servicios;
