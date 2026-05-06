import React, { useState } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import Footer from "../components/footer";
import Dashboard from "./Dashboard";

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar superior */}
      <header className="bg-gray-900 text-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <span className="text-sm font-semibold text-gray-400 tracking-wide uppercase">Panel Admin</span>

          <div className="flex items-center gap-3">
            {/* Botón acceso rápido al panel seller */}
            <Link
              to="/seller"
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
              Panel Seller
            </Link>

            {/* Avatar + dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 hover:opacity-80 transition"
              >
                <div className="w-9 h-9 bg-white text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:flex flex-col items-start leading-tight">
                  <span className="text-xs text-gray-300 truncate max-w-[140px]">{user?.email}</span>
                  <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wide">Admin</span>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl z-50 overflow-hidden border border-gray-100">
                  {/* Info del usuario */}
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                    <p className="text-xs font-bold text-gray-900 truncate">{user?.email}</p>
                    <span className="inline-block mt-0.5 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      Administrador
                    </span>
                  </div>

                  <Link
                    to="/seller"
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                    </svg>
                    Panel Seller
                  </Link>

                  <Link
                    to="/"
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                    </svg>
                    Volver al inicio
                  </Link>

                  <div className="border-t border-gray-100">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                      </svg>
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Contenedor principal con sidebar y contenido */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-100 p-4 border-r border-gray-300">
          <h2 className="text-xl font-bold mb-4 text-gray-700">Admin</h2>
          <nav className="flex flex-col space-y-2">
            <Link to="/admin" className="hover:text-indigo-600">Inicio</Link>
            <Link to="/admin/usuarios" className="hover:text-indigo-600">Usuarios</Link>
            <Link to="/admin/servicios" className="hover:text-indigo-600">Servicios</Link>
            <Link to="/admin/reservas" className="hover:text-indigo-600">Reservas</Link>
            <Link to="/admin/consultas" className="hover:text-indigo-600">Consultas</Link>
            <Link to="/admin/resenas" className="hover:text-indigo-600">Reseñas</Link>
          </nav>
        </aside>

        {/* Contenido dinámico */}
        <main className="flex-1 p-6 bg-gray-50">
          <Outlet />
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default AdminLayout;
