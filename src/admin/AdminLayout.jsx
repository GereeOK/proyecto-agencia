import React, { useState } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import Footer from "../components/footer";

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
        <div className="container mx-auto px-4 py-4 flex justify-end items-center">
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-10 h-10 bg-white text-indigo-600 rounded-full flex items-center justify-center font-semibold hover:ring-2 hover:ring-indigo-400 transition"
            >
              {user?.email?.charAt(0).toUpperCase()}
            </button>
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-50">
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:text-red-600"
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Contenedor principal con sidebar y contenido */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-100 p-4 border-r border-gray-300">
          <h2 className="text-xl font-bold mb-4 text-gray-700">Admin</h2>
          <nav className="flex flex-col space-y-2">
            <Link to="/admin/dashboard" className="hover:text-indigo-600">Inicio</Link>
            <Link to="/admin/usuarios" className="hover:text-indigo-600">Usuarios</Link>
            <Link to="/admin/servicios" className="hover:text-indigo-600">Servicios</Link>
            <Link to="/admin/reservas" className="hover:text-indigo-600">Reservas</Link>
            <Link to="/admin/consultas" className="hover:text-indigo-600">Consultas</Link>
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
