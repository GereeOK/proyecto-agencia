// PagoFallido.jsx
// Página de retorno cuando el pago fue rechazado o cancelado.

import { Link, useSearchParams } from "react-router-dom";
import Navbar from "../components/navbar";
import Footer from "../components/footer";

const PagoFallido = () => {
  const [searchParams] = useSearchParams();
  const motivo = searchParams.get("collection_status") || "rejected";

  const mensajes = {
    rejected: "El pago fue rechazado por la plataforma. Podés intentar con otro método o tarjeta.",
    cancelled: "Cancelaste el proceso de pago. Tu reserva sigue pendiente.",
    pending: "El pago está pendiente de acreditación. Te avisaremos cuando se confirme.",
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-900">
      <Navbar />
      <main className="flex-grow flex flex-col items-center justify-center text-center px-6 py-20">
        <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center mb-8 shadow-lg shadow-red-500/30">
          <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">
          {motivo === "cancelled" ? "Pago cancelado" :
           motivo === "pending"   ? "Pago pendiente" : "Pago rechazado"}
        </h1>
        <p className="text-gray-400 text-lg max-w-md mb-10">
          {mensajes[motivo] || mensajes.rejected}
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link to="/mis-reservas"
            className="bg-primary-600 hover:bg-primary-700 text-white font-bold px-8 py-4 rounded-xl transition-colors shadow-lg">
            Intentar de nuevo
          </Link>
          <Link to="/"
            className="text-gray-500 hover:text-gray-300 font-medium px-8 py-4 rounded-xl transition-colors">
            Volver al inicio
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PagoFallido;
