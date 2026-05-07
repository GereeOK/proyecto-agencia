import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const LANGS = [
    { code: "es", label: "ES", flag: "🇦🇷" },
    { code: "en", label: "EN", flag: "🇺🇸" },
    { code: "fr", label: "FR", flag: "🇫🇷" },
    { code: "pt", label: "PT", flag: "🇧🇷" },
    { code: "it", label: "IT", flag: "🇮🇹" },
  ];

  const [showLangMenu, setShowLangMenu] = useState(false);
  const langRef = useRef(null);

  const currentLang = LANGS.find((l) => i18n.language?.startsWith(l.code)) ?? LANGS[0];

  useEffect(() => {
    const handler = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setShowDropdown(false);
    setShowLangMenu(false);
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

  const NAV_LINKS = [
    { label: t("nav.nosotros"),  id: "nosotros" },
    { label: t("nav.servicios"), id: "servicios" },
    { label: t("nav.opiniones"), id: "opiniones" },
    { label: t("nav.contacto"),  id: "contacto" },
  ];

  const avatarLetter = user?.displayName?.charAt(0).toUpperCase()
    || user?.email?.charAt(0).toUpperCase()
    || "U";

  return (
    <header className="bg-gray-900 text-gray-300 body-font relative z-50">
      {/* ── BARRA PRINCIPAL */}
      <div className="container mx-auto flex items-center justify-between px-5 py-4">

        {/* Hamburguesa (solo mobile) */}
        <button
          className="md:hidden flex flex-col justify-center items-center w-9 h-9 rounded focus:outline-none"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={t("nav.abrirMenu")}
        >
          <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${mobileOpen ? "rotate-45 translate-y-1.5" : ""}`} />
          <span className={`block w-6 h-0.5 bg-white my-1 transition-all duration-300 ${mobileOpen ? "opacity-0" : ""}`} />
          <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${mobileOpen ? "-rotate-45 -translate-y-1.5" : ""}`} />
        </button>

        {/* Logo */}
        <Link
          to="/"
          className="flex items-center text-white font-medium title-font
                     absolute left-1/2 -translate-x-1/2
                     md:static md:left-auto md:translate-x-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            className="w-9 h-9 text-white p-2 bg-indigo-500 rounded-full flex-shrink-0" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
            <circle cx="12" cy="9" r="2.5" />
          </svg>
          <span className="ml-2 text-xl leading-tight">
            Baires<br className="hidden sm:block md:hidden" /> Essence
          </span>
        </Link>

        {/* Nav links (desktop) */}
        <nav className="hidden md:flex items-center gap-6 text-base">
          {NAV_LINKS.map(({ label, id }) => (
            <button key={id} onClick={() => handleNavClick(id)} className="hover:text-white transition-colors">
              {label}
            </button>
          ))}
        </nav>

        {/* Acciones de usuario + toggle idioma */}
        <div className="flex items-center gap-2">

          {/* Selector idioma (desktop) */}
          <div className="relative hidden md:block" ref={langRef}>
            <button
              onClick={() => setShowLangMenu((v) => !v)}
              className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors text-white"
              title={t("nav.idioma")}
            >
              <span>{currentLang.flag}</span>
              <span>{currentLang.label}</span>
              <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showLangMenu && (
              <div className="absolute right-0 mt-2 w-28 bg-white rounded-md shadow-lg py-1 text-sm text-gray-700 z-50">
                {LANGS.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => { i18n.changeLanguage(lang.code); setShowLangMenu(false); }}
                    className={`w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-indigo-50 hover:text-indigo-600 transition-colors ${currentLang.code === lang.code ? "font-bold text-indigo-600 bg-indigo-50" : ""}`}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {!user ? (
            <>
              <Link to="/login" className="hidden md:inline-flex items-center bg-indigo-500 hover:bg-indigo-600 text-white py-1.5 px-4 rounded text-sm transition-colors">
                {t("nav.iniciarSesion")}
              </Link>
              <Link to="/login" className="md:hidden w-9 h-9 flex items-center justify-center bg-indigo-500 rounded-full text-white" aria-label={t("nav.iniciarSesion")}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Link>
            </>
          ) : (
            <>
              {/* Desktop: botones inline */}
              <div className="hidden md:flex items-center gap-2">
                <Link to="/servicios" className="bg-indigo-500 hover:bg-indigo-600 text-white py-1.5 px-3 rounded text-sm transition-colors">
                  {t("nav.reservar")}
                </Link>
                <Link to="/mis-reservas" className="bg-indigo-500 hover:bg-indigo-600 text-white py-1.5 px-3 rounded text-sm transition-colors">
                  {t("nav.misReservas")}
                </Link>
                {user.role === "seller" && (
                  <Link to="/seller" className="bg-indigo-500 hover:bg-indigo-600 text-white py-1.5 px-3 rounded text-sm transition-colors">
                    {t("nav.panelVendedor")}
                  </Link>
                )}
                {user.role === "admin" && (
                  <>
                    <Link to="/seller" className="bg-indigo-500 hover:bg-indigo-600 text-white py-1.5 px-3 rounded text-sm transition-colors">
                      {t("nav.panelSeller")}
                    </Link>
                    <Link to="/admin" className="bg-indigo-500 hover:bg-indigo-600 text-white py-1.5 px-3 rounded text-sm transition-colors">
                      {t("nav.panelAdmin")}
                    </Link>
                  </>
                )}
              </div>

              {/* Avatar con dropdown (desktop) */}
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
                      {t("nav.miPerfil")}
                    </Link>
                    <Link to="/favoritos" className="block px-4 py-2 hover:bg-gray-100 hover:text-indigo-600 transition-colors">
                      {t("nav.misFavoritos")}
                    </Link>
                    <button onClick={handleLogout} className="block w-full text-left px-4 py-2 hover:bg-red-500 hover:text-white transition-colors">
                      {t("nav.cerrarSesion")}
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile: avatar letra */}
              <div className="md:hidden w-9 h-9 bg-white text-indigo-600 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
                {avatarLetter}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── MENÚ MOBILE */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${mobileOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"} bg-gray-800`}>
        <nav className="flex flex-col px-5 py-4 gap-1">

          <p className="text-xs uppercase text-gray-500 font-semibold mb-1 tracking-widest">{t("nav.navegacion")}</p>
          {NAV_LINKS.map(({ label, id }) => (
            <button key={id} onClick={() => handleNavClick(id)}
              className="text-left text-gray-300 hover:text-white hover:bg-gray-700 px-3 py-2 rounded transition-colors">
              {label}
            </button>
          ))}

          {user && (
            <>
              <div className="border-t border-gray-700 my-3" />
              <p className="text-xs uppercase text-gray-500 font-semibold mb-1 tracking-widest">{t("nav.miCuenta")}</p>
              <Link to="/servicios" className="text-gray-300 hover:text-white hover:bg-gray-700 px-3 py-2 rounded transition-colors">
                {t("nav.reservar")}
              </Link>
              <Link to="/mis-reservas" className="text-gray-300 hover:text-white hover:bg-gray-700 px-3 py-2 rounded transition-colors">
                {t("nav.misReservas")}
              </Link>
              {user.role === "seller" && (
                <Link to="/seller" className="text-gray-300 hover:text-white hover:bg-gray-700 px-3 py-2 rounded transition-colors">
                  {t("nav.panelDeVendedor")}
                </Link>
              )}
              {user.role === "admin" && (
                <>
                  <Link to="/seller" className="text-gray-300 hover:text-white hover:bg-gray-700 px-3 py-2 rounded transition-colors">
                    {t("nav.panelSeller")}
                  </Link>
                  <Link to="/admin" className="text-gray-300 hover:text-white hover:bg-gray-700 px-3 py-2 rounded transition-colors">
                    {t("nav.panelAdmin")}
                  </Link>
                </>
              )}
              <Link to="/perfil" className="text-gray-300 hover:text-white hover:bg-gray-700 px-3 py-2 rounded transition-colors">
                {t("nav.miPerfil")}
              </Link>
              <button onClick={handleLogout} className="text-left text-red-400 hover:text-white hover:bg-red-600 px-3 py-2 rounded transition-colors">
                {t("nav.cerrarSesion")}
              </button>
            </>
          )}

          {!user && (
            <>
              <div className="border-t border-gray-700 my-3" />
              <Link to="/login" className="text-gray-300 hover:text-white hover:bg-gray-700 px-3 py-2 rounded transition-colors">
                {t("nav.iniciarSesion")}
              </Link>
            </>
          )}

          {/* Selector idioma (mobile) */}
          <div className="border-t border-gray-700 mt-3 pt-3">
            <p className="text-xs uppercase text-gray-500 font-semibold mb-2 tracking-widest">{t("nav.idioma")}</p>
            <div className="flex flex-wrap gap-2 px-1">
              {LANGS.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => { i18n.changeLanguage(lang.code); setMobileOpen(false); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${currentLang.code === lang.code ? "bg-indigo-500 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                </button>
              ))}
            </div>
          </div>

        </nav>
      </div>
    </header>
  );
};

export default Header;
