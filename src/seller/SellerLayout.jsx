// src/seller/SellerLayout.jsx

import React from "react";
import { Outlet, Link } from "react-router-dom";
import { useAuth } from "../context/authContext";

const SellerLayout = () => {
const { user, logout } = useAuth();

if (!user || user.role !== "seller") {
    return <p className="text-center mt-10 text-red-600">Acceso denegado.</p>;
}

return (
    <div className="min-h-screen flex flex-col">
      {/* HEADER */}
        <header className="bg-gray-900 text-white p-4 flex justify-between items-center">
        <div className="text-xl font-bold">
            {user.agencia || "Panel del Seller"}
        </div>
        <div className="flex items-center gap-4">
        <span className="hidden sm:inline">{user.email}</span>
            <button
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
            >
            Cerrar sesión
            </button>
        </div>
    </header>

      {/* MENU */}
    <nav className="bg-gray-100 p-4 flex gap-4 justify-center text-sm font-semibold">
        <Link to="/seller" className="hover:underline">Mis servicios</Link>
        <Link to="/seller/nuevo-servicio" className="hover:underline">Nuevo servicio</Link>
        <Link to="/seller/perfil" className="hover:underline">Mi perfil</Link>
    </nav>

      {/* CONTENIDO */}
        <main className="flex-grow p-6 bg-white">
        <Outlet />
        </main>

      {/* FOOTER opcional */}
        <footer className="bg-gray-900 text-white text-center py-4 text-sm">
        &copy; {new Date().getFullYear()} Baires Essence. Todos los derechos reservados.
        </footer>
    </div>
    );
};

export default SellerLayout;
