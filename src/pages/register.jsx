import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { useRegister } from "../hooks/useRegister";

const Register = () => {
  const {
    fullname, setFullname,
    email,    setEmail,
    password, setPassword,
    error, success, loading, register,
  } = useRegister();

  const [isSeller,    setIsSeller]    = useState(false);
  const [agencia,     setAgencia]     = useState("");
  const [logoAgencia, setLogoAgencia] = useState("");

  const handleRegister = () => register({ isSeller, agencia, logoAgencia });

  const inputCls =
    "w-full border-2 border-gray-200 focus:border-primary-400 rounded-xl px-3 py-2.5 text-sm outline-none transition-colors bg-white";

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />

      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden">

          {/* Card header */}
          <div className="bg-primary-600 px-8 py-7 text-center text-white">
            <p className="text-4xl mb-2">✈️</p>
            <h1 className="text-2xl font-bold">Crear una cuenta</h1>
            <p className="text-primary-200 text-sm mt-1">Descubrí experiencias únicas en Buenos Aires</p>
          </div>

          <div className="px-8 py-7 space-y-4">

            {/* Role toggle */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Tipo de cuenta</label>
              <div className="flex rounded-xl border-2 border-gray-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsSeller(false)}
                  className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                    !isSeller
                      ? "bg-primary-600 text-white"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  🧳 Turista
                </button>
                <button
                  type="button"
                  onClick={() => setIsSeller(true)}
                  className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                    isSeller
                      ? "bg-primary-600 text-white"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  🏪 Empresa / Agencia
                </button>
              </div>
            </div>

            {/* Common fields */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre completo</label>
              <input
                type="text"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                placeholder="Juan García"
                className={inputCls}
                required
              />
            </div>
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
                placeholder="Mínimo 6 caracteres"
                className={inputCls}
                required
              />
            </div>

            {/* Seller-specific fields */}
            {isSeller && (
              <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 space-y-3">
                <p className="text-xs font-bold text-primary-700 uppercase tracking-wide">
                  Datos de la empresa
                </p>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Nombre de la agencia / empresa
                  </label>
                  <input
                    type="text"
                    value={agencia}
                    onChange={(e) => setAgencia(e.target.value)}
                    placeholder="Ej: BA Tours"
                    className={inputCls}
                    required={isSeller}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Logo (URL, opcional)
                  </label>
                  <input
                    type="text"
                    value={logoAgencia}
                    onChange={(e) => setLogoAgencia(e.target.value)}
                    placeholder="https://..."
                    className={inputCls}
                  />
                </div>
              </div>
            )}

            {/* Feedback banners */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-3 py-2">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-3 py-2">
                {success}
              </div>
            )}

            <button
              onClick={handleRegister}
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm disabled:opacity-50 transition-colors"
            >
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>

            <p className="text-center text-sm text-gray-500">
              ¿Ya tenés cuenta?{" "}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
                Iniciá sesión
              </Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Register;
