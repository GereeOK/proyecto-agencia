// Servicios.jsx — UI estilo TripAdvisor + mapa Leaflet integrado
import React, { useEffect, useState, lazy, Suspense } from "react";
import { fetchServicios, saveReserva } from "../firebase/firestore";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { useAuth } from "../context/authContext";
import { useNavigate } from "react-router-dom";

// Lazy-load del mapa para no aumentar el bundle inicial (RNF-04 Rendimiento)
const MapaServicio = lazy(() => import("../components/MapaServicio"));

// ── Estrellas
const Stars = ({ rating = 4.5 }) => {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} className={`w-4 h-4 ${i < full ? "text-green-600" : i === full && half ? "text-green-400" : "text-gray-300"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="ml-1 text-sm text-gray-600 font-medium">{rating}</span>
    </span>
  );
};

// ── Badge de categoría
const CategoryBadge = ({ categoria }) => {
  const colores = {
    traslados: "bg-blue-100 text-blue-700",
    tours: "bg-purple-100 text-purple-700",
    gastronomia: "bg-orange-100 text-orange-700",
    experiencias: "bg-pink-100 text-pink-700",
  };
  const key = categoria?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "";
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${colores[key] || "bg-gray-100 text-gray-600"}`}>
      {categoria || "Experiencia"}
    </span>
  );
};

// ── Modal de detalle + reserva + mapa
const DetalleModal = ({ servicio, onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checkin, setCheckin] = useState("");
  const [checkout, setCheckout] = useState("");
  const [personas, setPersonas] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const hoy = new Date().toISOString().split("T")[0];
  const desde = servicio.from?.toDate ? servicio.from.toDate().toISOString().split("T")[0] : hoy;
  const hasta = servicio.until?.toDate ? servicio.until.toDate().toISOString().split("T")[0] : "";

  const tieneUbicacion = servicio.lat && servicio.lng;

  const handleReservar = async () => {
    if (!user) { navigate("/login"); return; }
    if (!checkin) { setError("Seleccioná una fecha de inicio."); return; }
    if (!checkout) { setError("Seleccioná una fecha de fin."); return; }
    if (new Date(checkout) <= new Date(checkin)) { setError("La fecha de fin debe ser posterior al inicio."); return; }
    setError(null);
    setLoading(true);
    try {
      await saveReserva({
        fullname: user.displayName || user.email,
        email: user.email,
        checkin,
        checkout,
        personas,
        servicios: [{ id: servicio.id, title: servicio.title, image: servicio.image, lat: servicio.lat, lng: servicio.lng }],
        estado: "pendiente",
      });
      navigate("/reserva-exitosa");
    } catch (err) {
      console.error(err);
      setError("No se pudo completar la reserva. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Imagen hero */}
        <div className="relative">
          <img src={servicio.image} alt={servicio.title} className="w-full h-64 object-cover rounded-t-2xl"
            onError={(e) => { e.target.src = "https://placehold.co/800x256?text=Sin+imagen"; }} />
          <button onClick={onClose} className="absolute top-3 right-3 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-white transition">
            <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          {servicio.categoria && <div className="absolute bottom-3 left-3"><CategoryBadge categoria={servicio.categoria} /></div>}
        </div>

        <div className="flex flex-col md:flex-row">
          {/* Panel izquierdo */}
          <div className="flex-1 p-6 border-r border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{servicio.title}</h2>
            <Stars rating={servicio.rating || 4.5} />

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              {servicio.duracion && (
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-4 h-4 text-indigo-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  {servicio.duracion}
                </div>
              )}
              {servicio.idioma && (
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-4 h-4 text-indigo-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"/></svg>
                  {servicio.idioma}
                </div>
              )}
              {servicio.ubicacion && (
                <div className="flex items-center gap-2 text-gray-600 col-span-2">
                  <svg className="w-4 h-4 text-indigo-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  {servicio.ubicacion}
                </div>
              )}
            </div>

            <p className="mt-4 text-gray-600 text-sm leading-relaxed">{servicio.description}</p>

            {servicio.incluye && (
              <div className="mt-4">
                <p className="text-sm font-semibold text-gray-800 mb-1">¿Qué incluye?</p>
                <p className="text-sm text-gray-600">{servicio.incluye}</p>
              </div>
            )}

            {/* MAPA — solo si el servicio tiene coordenadas */}
            {tieneUbicacion && (
              <div className="mt-5">
                <p className="text-sm font-semibold text-gray-800 mb-2">📍 Punto de encuentro</p>
                <Suspense fallback={<div className="w-full h-48 bg-gray-100 rounded-xl animate-pulse flex items-center justify-center text-gray-400 text-sm">Cargando mapa...</div>}>
                  <MapaServicio
                    lat={servicio.lat}
                    lng={servicio.lng}
                    titulo={servicio.title}
                    height="200px"
                  />
                </Suspense>
              </div>
            )}
          </div>

          {/* Panel derecho: booking */}
          <div className="md:w-72 p-6 bg-gray-50 rounded-b-2xl md:rounded-r-2xl md:rounded-bl-none">
            <div className="mb-4">
              {servicio.price ? (
                <>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Desde</p>
                  <p className="text-3xl font-bold text-gray-900">${Number(servicio.price).toLocaleString("es-AR")}</p>
                  <p className="text-xs text-gray-500">por persona</p>
                </>
              ) : (
                <p className="text-sm text-gray-500">Precio a consultar</p>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Fecha de inicio</label>
                <input type="date" min={desde} max={hasta || undefined} value={checkin}
                  onChange={(e) => { setCheckin(e.target.value); setError(null); }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Fecha de fin</label>
                <input type="date" min={checkin || desde} max={hasta || undefined} value={checkout}
                  onChange={(e) => { setCheckout(e.target.value); setError(null); }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Personas</label>
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                  <button type="button" onClick={() => setPersonas(p => Math.max(1, p - 1))} className="px-3 py-2 text-lg text-gray-600 hover:bg-gray-100">−</button>
                  <span className="flex-1 text-center text-sm font-medium">{personas}</span>
                  <button type="button" onClick={() => setPersonas(p => p + 1)} className="px-3 py-2 text-lg text-gray-600 hover:bg-gray-100">+</button>
                </div>
              </div>

              {servicio.price && checkin && checkout && (
                <div className="bg-indigo-50 rounded-lg p-3 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>${Number(servicio.price).toLocaleString("es-AR")} × {personas}</span>
                    <span>${(Number(servicio.price) * personas).toLocaleString("es-AR")}</span>
                  </div>
                  <div className="border-t border-indigo-100 mt-2 pt-2 flex justify-between font-bold text-gray-900">
                    <span>Total</span>
                    <span>${(Number(servicio.price) * personas).toLocaleString("es-AR")}</span>
                  </div>
                </div>
              )}

              {error && <p className="text-red-500 text-xs">{error}</p>}

              <button onClick={handleReservar} disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors shadow-md">
                {loading ? "Procesando..." : user ? "Reservar ahora" : "Iniciá sesión para reservar"}
              </button>
              {!user && <p className="text-xs text-center text-gray-500">Necesitás una cuenta para reservar.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Card
const ServicioCard = ({ servicio, onClick }) => {
  const { title, description, image, price, categoria, rating, duracion, ubicacion } = servicio;
  return (
    <div onClick={onClick} className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100">
      <div className="relative overflow-hidden">
        <img src={image} alt={title}
          className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { e.target.src = "https://placehold.co/400x208?text=Sin+imagen"; }} />
        {categoria && <div className="absolute top-3 left-3"><CategoryBadge categoria={categoria} /></div>}
        {price && (
          <div className="absolute top-3 right-3 bg-white/95 rounded-full px-2.5 py-1 text-xs font-bold text-indigo-700 shadow">
            Desde ${Number(price).toLocaleString("es-AR")}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-base font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors line-clamp-1">{title}</h3>
        <Stars rating={rating || 4.5} />
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
          {duracion && <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>{duracion}
          </span>}
          {ubicacion && <span className="flex items-center gap-1 truncate">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg>{ubicacion}
          </span>}
        </div>
        <p className="text-gray-500 text-sm mt-2 line-clamp-2">{description}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-indigo-600 text-sm font-semibold group-hover:underline">Ver detalles →</span>
          {!price && <span className="text-xs text-gray-400">Precio a consultar</span>}
        </div>
      </div>
    </div>
  );
};

const CATEGORIAS = ["Todas", "Tours", "Gastronomia", "Traslados", "Experiencias"];

const Servicios = () => {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState("Todas");
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);

  useEffect(() => {
    fetchServicios()
      .then((data) => setServicios(data.filter((s) => s.activo !== false)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const serviciosFiltrados = servicios.filter((s) => {
    const matchBusqueda = s.title?.toLowerCase().includes(busqueda.toLowerCase()) || s.description?.toLowerCase().includes(busqueda.toLowerCase());
    const catNorm = (v) => v?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const matchCategoria = categoriaActiva === "Todas" || catNorm(s.categoria) === catNorm(categoriaActiva);
    return matchBusqueda && matchCategoria;
  });

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />

      <div className="bg-gray-900 text-white py-10 px-4 text-center">
        <h1 className="text-3xl font-bold mb-2">Experiencias en Buenos Aires</h1>
        <p className="text-gray-400 mb-6">Descubrí lo mejor de la ciudad con guías locales</p>
        <div className="max-w-xl mx-auto relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input type="text" placeholder="Buscá experiencias, tours, traslados..."
            value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-lg" />
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex gap-2 overflow-x-auto">
          {CATEGORIAS.map((cat) => (
            <button key={cat} onClick={() => setCategoriaActiva(cat)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                categoriaActiva === cat ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-300 hover:border-indigo-400 hover:text-indigo-600"
              }`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-grow container mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
                <div className="w-full h-52 bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : serviciosFiltrados.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No encontramos experiencias con ese filtro.</p>
            <button onClick={() => { setBusqueda(""); setCategoriaActiva("Todas"); }} className="mt-3 text-indigo-600 hover:underline text-sm">Limpiar filtros</button>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">{serviciosFiltrados.length} experiencia{serviciosFiltrados.length !== 1 ? "s" : ""} encontrada{serviciosFiltrados.length !== 1 ? "s" : ""}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {serviciosFiltrados.map((s) => <ServicioCard key={s.id} servicio={s} onClick={() => setServicioSeleccionado(s)} />)}
            </div>
          </>
        )}
      </main>

      <Footer />
      {servicioSeleccionado && <DetalleModal servicio={servicioSeleccionado} onClose={() => setServicioSeleccionado(null)} />}
    </div>
  );
};

export default Servicios;
