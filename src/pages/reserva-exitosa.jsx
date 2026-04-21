import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { Link } from "react-router-dom";

const ReservaExitosa = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-900">
      <Navbar />

      <main className="flex-grow flex flex-col items-center justify-center text-center px-6 py-20">
        {/* Ícono animado */}
        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-8 shadow-lg shadow-green-500/30">
          <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
          ¡Reserva confirmada!
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mb-3">
          Gracias por elegir <span className="text-indigo-400 font-semibold">Baires Essence</span>.
          Recibiste un email de confirmación con todos los detalles.
        </p>
        <p className="text-gray-500 text-sm mb-10">
          Un asesor te contactará para coordinar los detalles de cada experiencia.
        </p>

        {/* Dos acciones */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/mis-reservas"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-4 rounded-xl transition-colors shadow-lg text-base"
          >
            Ver mis reservas →
          </Link>
          <Link
            to="/servicios"
            className="bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-xl transition-colors border border-white/20 text-base"
          >
            Agregar más experiencias
          </Link>
          <Link
            to="/"
            className="text-gray-500 hover:text-gray-300 font-medium px-8 py-4 rounded-xl transition-colors text-base"
          >
            Volver al inicio
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ReservaExitosa;
