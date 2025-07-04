import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleNavClick = (id) => {
    if (location.pathname !== "/") {
      sessionStorage.setItem("scrollTo", id);
      navigate("/");
    } else {
      scrollToSection(id);
    }
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    }
  };

  return (
    <header className="text-gray-400 bg-gray-900 body-font">
      <div className="container mx-auto flex flex-wrap p-5 flex-col md:flex-row items-center">
        <Link
          to="/"
          className="flex title-font font-medium items-center text-white mb-4 md:mb-0"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="w-10 h-10 text-white p-2 bg-indigo-500 rounded-full"
            viewBox="0 0 24 24"
          >
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
            <circle cx="12" cy="9" r="2.5" />
          </svg>
          <span className="ml-3 text-xl">Baires Essence</span>
        </Link>

        <nav className="md:mr-auto md:ml-4 md:py-1 md:pl-4 md:border-l md:border-gray-700 flex flex-wrap items-center text-base justify-center">
          <button onClick={() => handleNavClick("nosotros")} className="mr-5 hover:text-white">
            Nosotros
          </button>
          <button onClick={() => handleNavClick("servicios")} className="mr-5 hover:text-white">
            Servicios
          </button>
          <button onClick={() => handleNavClick("opiniones")} className="mr-5 hover:text-white">
            Opiniones
          </button>
          <button onClick={() => handleNavClick("contacto")} className="mr-5 hover:text-white">
            Contacto
          </button>
        </nav>

        {!user ? (
          <Link
            to="/login"
            className="inline-flex items-center bg-indigo-500 hover:bg-indigo-600 text-white border-0 py-1 px-3 focus:outline-none rounded text-sm mt-4 md:mt-0"
          >
            Iniciar Sesión
          </Link>
        ) : (
          <div className="flex items-center space-x-2">
            <Link
              to="/reservas"
              className="inline-flex items-center bg-indigo-500 hover:bg-indigo-600 text-white border-0 py-1 px-3 focus:outline-none rounded text-sm mt-4 md:mt-0"
            >
              Mis Reservas
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center bg-red-500 hover:bg-red-600 text-white border-0 py-1 px-3 focus:outline-none rounded text-sm mt-4 md:mt-0"
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
