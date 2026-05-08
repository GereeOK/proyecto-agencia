import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { useAuth } from "../context/authContext";

const Login = () => {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState(null);
  const [loading, setLoading]   = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState(false);

  const navigate = useNavigate();
  const { login, loginWithGoogle, user } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError("Completá todos los campos."); return; }
    setLoading(true);
    setError(null);
    try {
      setPendingRedirect(true);
      await login(email, password);
    } catch (err) {
      setPendingRedirect(false);
      setLoading(false);
      switch (err.code) {
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
          setError("Email o contraseña incorrectos."); break;
        case "auth/too-many-requests":
          setError("Demasiados intentos fallidos. Probá más tarde."); break;
        default:
          setError("Error al iniciar sesión. Intentá nuevamente.");
      }
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      setPendingRedirect(true);
      await loginWithGoogle();
    } catch {
      setPendingRedirect(false);
      setLoading(false);
      setError("No se pudo iniciar sesión con Google.");
    }
  };

  useEffect(() => {
    if (pendingRedirect && user) {
      navigate(user.role === "admin" ? "/admin" : "/servicios");
    }
  }, [pendingRedirect, user, navigate]);

  const inputCls =
    "w-full border-2 border-gray-200 focus:border-primary-400 rounded-xl px-3 py-2.5 text-sm outline-none transition-colors bg-white";

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />

      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">

          {/* Card header */}
          <div className="bg-primary-600 px-8 py-7 text-center text-white">
            <p className="text-4xl mb-2">🌆</p>
            <h1 className="text-2xl font-bold">Bienvenido de vuelta</h1>
            <p className="text-primary-200 text-sm mt-1">Iniciá sesión en tu cuenta</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="px-8 py-7 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@ejemplo.com"
                className={inputCls}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={inputCls}
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm disabled:opacity-50 transition-colors"
            >
              {loading ? "Entrando..." : "Iniciar sesión"}
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">o</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-sm font-semibold text-gray-700 disabled:opacity-50 transition-colors"
            >
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                alt="Google"
                className="w-4 h-4"
              />
              Continuar con Google
            </button>

            <p className="text-center text-sm text-gray-500">
              ¿No tenés cuenta?{" "}
              <Link to="/register" className="text-primary-600 hover:text-primary-700 font-semibold">
                Registrate
              </Link>
            </p>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Login;
