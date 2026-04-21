import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { useState, useEffect, useRef } from "react";

// MEJORA (RNF-01 – Responsive / RNF-02 – Navegación):
// El navbar original no era responsive: en pantallas pequeñas todos los botones
// quedaban apilados y desbordaban el layout (visible en la imagen adjunta).
// Nueva estructura:
//   MOBILE  → Hamburguesa (izquierda) + Logo (centro) + Avatar/Login (derecha)
//   DESKTOP → Logo (izquierda) + Nav links (centro) + Acciones usuario (derecha)
// El menú hamburguesa agrupa tanto los links de navegación como las acciones
// del usuario (Reservar, Mis Reservas, Panel, Perfil, Logout).

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);   // menú hamburguesa
  const [showDropdown, setShowDropdown] = useState(false); // dropdown avatar desktop
  const dropdownRef = useRef(null);

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    setMobileOpen(false);
    setShowDropdown(false);
  }, [location.pathname]);

  const handleNavClick = (id) => {
    setMobileOpen(false);
    if (location.pathname !== "/") {
      sessionStorage.setItem("scrollTo", id);
      navigate("/");
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleLogout = async () => {
    setMobileOpen(false);
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    }
  };

  // Links de navegación compartidos entre desktop y mobile
  const NAV_LINKS = [
    { label: "Nosotros", id: "nosotros" },
    { label: "Servicios", id: "servicios" },
    { label: "Opiniones", id: "opiniones" },
    { label: "Contacto", id: "contacto" },
  ];

  const avatarLetter = user?.displayName?.charAt(0).toUpperCase()
    || user?.email?.charAt(0).toUpperCase()
    || "U";

  return (
    <header className="bg-gray-900 text-gray-300 body-font relative z-50">
      {/* ── BARRA PRINCIPAL ─────────────────────────────────────── */}
      <div className="container mx-auto flex items-center justify-between px-5 py-4">

        {/* IZQUIERDA: Hamburguesa (solo mobile) */}
        <button
          className="md:hidden flex flex-col justify-center items-center w-9 h-9 rounded focus:outline-none"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Abrir menú"
        >
          <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${mobileOpen ? "rotate-45 translate-y-1.5" : ""}`} />
          <span className={`block w-6 h-0.5 bg-white my-1 transition-all duration-300 ${mobileOpen ? "opacity-0" : ""}`} />
          <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${mobileOpen ? "-rotate-45 -translate-y-1.5" : ""}`} />
        </button>

        {/* LOGO — centrado en mobile, a la izquierda en desktop */}
        <Link
          to="/"
          className="flex items-center text-white font-medium title-font
                     absolute left-1/2 -translate-x-1/2
                     md:static md:left-auto md:translate-x-0"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="w-9 h-9 text-white p-2 bg-indigo-500 rounded-full flex-shrink-0"
            viewBox="0 0 24 24"
          >
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
            <circle cx="12" cy="9" r="2.5" />
          </svg>
          <span className="ml-2 text-xl leading-tight">
            Baires<br className="hidden sm:block md:hidden" /> Essence
          </span>
        </Link>

        {/* CENTRO: Nav links (solo desktop) */}
        <nav className="hidden md:flex items-center gap-6 text-base">
          {NAV_LINKS.map(({ label, id }) => (
            <button
              key={id}
              onClick={() => handleNavClick(id)}
              className="hover:text-white transition-colors"
            >
              {label}
            </button>
          ))}
        </nav>

        {/* DERECHA: acciones de usuario */}
        <div className="flex items-center gap-2">
          {!user ? (
            <>
              {/* Desktop: botón completo */}
              <Link
                to="/login"
                className="hidden md:inline-flex items-center bg-indigo-500 hover:bg-indigo-600 text-white py-1.5 px-4 rounded text-sm transition-colors"
              >
                Iniciar Sesión
              </Link>
              {/* Mobile: icono persona */}
              <Link
                to="/login"
                className="md:hidden w-9 h-9 flex items-center justify-center bg-indigo-500 rounded-full text-white"
                aria-label="Iniciar sesión"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Link>
            </>
          ) : (
            <>
              {/* Desktop: botones de acción inline */}
              <div className="hidden md:flex items-center gap-2">
                <Link to="/servicios" className="bg-indigo-500 hover:bg-indigo-600 text-white py-1.5 px-3 rounded text-sm transition-colors">
                  Reservar
                </Link>
                <Link to="/mis-reservas" className="bg-indigo-500 hover:bg-indigo-600 text-white py-1.5 px-3 rounded text-sm transition-colors">
                  Mis Reservas
                </Link>
                {user.role === "seller" && (
                  <Link to="/seller" className="bg-indigo-500 hover:bg-indigo-600 text-white py-1.5 px-3 rounded text-sm transition-colors">
                    Panel Vendedor
                  </Link>
                )}
                {user.role === "admin" && (
                  <Link to="/admin" className="bg-indigo-500 hover:bg-indigo-600 text-white py-1.5 px-3 rounded text-sm transition-colors">
                    Panel Admin
                  </Link>
                )}
              </div>

              {/* Avatar con dropdown (visible en desktop) */}
              <div className="relative hidden md:block" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown((v) => !v)}
                  className="w-9 h-9 bg-white text-indigo-600 rounded-full flex items-center justify-center font-semibold hover:ring-2 hover:ring-indigo-400 transition text-sm"
                  aria-label="Menú de usuario"
                >
                  {avatarLetter}
                </button>
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-44 bg-white rounded-md shadow-lg py-1 text-sm text-gray-700">
                    <Link to="/perfil" className="block px-4 py-2 hover:bg-gray-100 hover:text-indigo-600 transition-colors">
                      Mi Perfil
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 hover:bg-red-500 hover:text-white transition-colors"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile: avatar solo muestra la letra (menú va en hamburguesa) */}
              <div className="md:hidden w-9 h-9 bg-white text-indigo-600 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
                {avatarLetter}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── MENÚ MOBILE (desplegable) ────────────────────────────── */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
        } bg-gray-800`}
      >
        <nav className="flex flex-col px-5 py-4 gap-1">

          {/* Sección: Navegación */}
          <p className="text-xs uppercase text-gray-500 font-semibold mb-1 tracking-widest">Navegación</p>
          {NAV_LINKS.map(({ label, id }) => (
            <button
              key={id}
              onClick={() => handleNavClick(id)}
              className="text-left text-gray-300 hover:text-white hover:bg-gray-700 px-3 py-2 rounded transition-colors"
            >
              {label}
            </button>
          ))}

          {/* Sección: Usuario */}
          {user && (
            <>
              <div className="border-t border-gray-700 my-3" />
              <p className="text-xs uppercase text-gray-500 font-semibold mb-1 tracking-widest">Mi cuenta</p>

              <Link to="/servicios" className="text-gray-300 hover:text-white hover:bg-gray-700 px-3 py-2 rounded transition-colors">
                Reservar
              </Link>
              <Link to="/mis-reservas" className="text-gray-300 hover:text-white hover:bg-gray-700 px-3 py-2 rounded transition-colors">
                Mis Reservas
              </Link>
              {user.role === "seller" && (
                <Link to="/seller" className="text-gray-300 hover:text-white hover:bg-gray-700 px-3 py-2 rounded transition-colors">
                  Panel de Vendedor
                </Link>
              )}
              {user.role === "admin" && (
                <Link to="/admin" className="text-gray-300 hover:text-white hover:bg-gray-700 px-3 py-2 rounded transition-colors">
                  Panel Admin
                </Link>
              )}
              <Link to="/perfil" className="text-gray-300 hover:text-white hover:bg-gray-700 px-3 py-2 rounded transition-colors">
                Mi Perfil
              </Link>
              <button
                onClick={handleLogout}
                className="text-left text-red-400 hover:text-white hover:bg-red-600 px-3 py-2 rounded transition-colors"
              >
                Cerrar sesión
              </button>
            </>
          )}

          {/* Si no hay usuario */}
          {!user && (
            <>
              <div className="border-t border-gray-700 my-3" />
              <Link to="/login" className="text-gray-300 hover:text-white hover:bg-gray-700 px-3 py-2 rounded transition-colors">
                Iniciar Sesión
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
