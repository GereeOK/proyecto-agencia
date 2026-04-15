import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { useAuth } from "../context/authContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [pendingRedirect, setPendingRedirect] = useState(false);

  const navigate = useNavigate();
  const { login, loginWithGoogle, user } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Por favor completá todos los campos.");
      return;
    }

    try {
      setPendingRedirect(true); // señal para esperar el efecto
      await login(email, password);
    } catch (err) {
      setPendingRedirect(false);
      switch (err.code) {
        case "auth/user-not-found":
        case "auth/wrong-password":
          setError("Usuario o contraseña incorrectos.");
          break;
        case "auth/too-many-requests":
          setError("Demasiados intentos fallidos, probá más tarde.");
          break;
        default:
          setError("Error al iniciar sesión, intentá nuevamente.");
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setPendingRedirect(true);
      await loginWithGoogle();
    } catch (err) {
      setPendingRedirect(false);
      setError("No se pudo iniciar sesión con Google.");
    }
  };

  // Espera a que el contexto tenga datos del usuario y lo redirige según rol
  useEffect(() => {
    if (pendingRedirect && user) {
      navigate(user.role === "admin" ? "/admin" : "/reservas");
    }
  }, [pendingRedirect, user, navigate]);


  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow">
        <section className="text-gray-600 body-font">
          <div className="container mx-auto flex px-5 py-24 md:flex-row flex-col items-center">
            <div className="lg:flex-grow md:w-1/2 lg:pr-24 md:pr-16 flex flex-col md:items-start md:text-left mb-16 md:mb-0 items-center text-center">
              <h1 className="title-font sm:text-4xl text-3xl mb-4 font-medium text-gray-900">
                Iniciar Sesión
              </h1>
              <p className="mb-8 leading-relaxed">
                Accedé a tu cuenta para gestionar reservas y descubrir experiencias exclusivas.
              </p>
              <div className="flex w-full md:justify-start justify-center items-end space-x-4">
                <div className="relative md:w-1/2 w-full">
                  <label htmlFor="email" className="leading-7 text-sm text-gray-600">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-100 rounded border border-gray-300 focus:ring-2 focus:ring-indigo-200 focus:bg-transparent focus:border-indigo-500 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                  />
                </div>
                <div className="relative md:w-1/2 w-full">
                  <label htmlFor="password" className="leading-7 text-sm text-gray-600">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-100 rounded border border-gray-300 focus:ring-2 focus:ring-indigo-200 focus:bg-transparent focus:border-indigo-500 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                  />
                </div>
              </div>
              <button
                onClick={handleLogin}
                className="mt-6 inline-flex text-white bg-indigo-500 border-0 py-2 px-6 focus:outline-none hover:bg-indigo-600 rounded text-lg"
              >
                Entrar
              </button>

              {error && <p className="text-red-500 mt-4">{error}</p>}

              <p className="text-sm mt-4 text-gray-500 mb-8 w-full">
                ¿No tenés cuenta? Registrate desde
                <Link to="/register" className="text-indigo-500 hover:underline">
                  {" "}acá
                </Link>.
              </p>

              <button
                onClick={handleGoogleLogin}
                className="bg-white border border-gray-300 py-2 px-5 rounded-lg items-center flex hover:bg-gray-100 focus:outline-none"
              >
                <img
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  alt="Google"
                  className="w-5 h-5 mr-2"
                />
                <span className="text-gray-700 font-medium">
                  Continuar con Google
                </span>
              </button>
            </div>

            <div className="lg:max-w-lg lg:w-full md:w-1/2 w-5/6">
              <img
                className="object-cover object-center rounded"
                alt="hero"
                src="../img/login.jpg"
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Login;
