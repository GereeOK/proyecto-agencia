import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { useAuth } from "../context/authContext";
import { getFavoritos, toggleFavorito } from "../firebase/firestore";

const formatARS = (n) => Number(n || 0).toLocaleString("es-AR");

const Favoritos = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getFavoritos(user.uid)
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const handleQuitar = async (servicio) => {
    await toggleFavorito(user.uid, servicio);
    setItems((prev) => prev.filter((i) => i.id !== servicio.id));
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />

      <div className="bg-gray-900 text-white py-10 px-4 text-center">
        <h1 className="text-3xl font-bold mb-1">Mis Favoritos</h1>
        <p className="text-gray-400 text-sm mt-1">Las experiencias que guardaste para después</p>
      </div>

      <main className="flex-grow container mx-auto px-4 py-8 max-w-5xl">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
                <div className="w-full h-44 bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🤍</p>
            <p className="text-gray-600 text-lg font-medium mb-2">Todavía no guardaste nada</p>
            <p className="text-gray-400 text-sm mb-6">Tocá el corazón en cualquier experiencia para guardarla aquí</p>
            <Link
              to="/servicios"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Explorar experiencias →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((s) => (
              <div key={s.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  <img
                    src={s.image || "https://placehold.co/400x192?text=Sin+imagen"}
                    alt={s.title}
                    className="w-full h-44 object-cover"
                    onError={(e) => { e.target.src = "https://placehold.co/400x192?text=Sin+imagen"; }}
                  />
                  <button
                    onClick={() => handleQuitar(s)}
                    className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 shadow hover:bg-white"
                    title="Quitar de favoritos"
                  >
                    <svg className="w-4 h-4 text-red-500 fill-red-500" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                    </svg>
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{s.title}</h3>
                  <div className="flex gap-3 text-xs text-gray-400 mb-3">
                    {s.duracion && <span>⏱ {s.duracion}</span>}
                    {s.ubicacion && <span className="truncate">📍 {s.ubicacion}</span>}
                  </div>
                  {s.price && (
                    <p className="text-sm font-bold text-indigo-600 mb-3">
                      Desde ${formatARS(s.price)} <span className="font-normal text-gray-400">/ persona</span>
                    </p>
                  )}
                  <button
                    onClick={() => navigate("/servicios")}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2 rounded-xl transition-colors"
                  >
                    Reservar →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Favoritos;
