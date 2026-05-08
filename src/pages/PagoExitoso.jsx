// PagoExitoso.jsx
// Página de retorno cuando el pago fue aprobado por MP o PayPal.
// MP redirige aquí con ?collection_status=approved&external_reference=reservaId
// PayPal redirige aquí con ?token=...&PayerID=...
// La Cloud Function webhook ya actualizó el estado en Firestore.

import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "../components/navbar";
import Footer from "../components/footer";

const PagoExitoso = () => {
  const [searchParams] = useSearchParams();
  const reservaId = searchParams.get("external_reference") || searchParams.get("token");

  useEffect(() => {
    // El estado de la reserva ya fue actualizado por el webhook de la Cloud Function.
    // Aquí solo mostramos la confirmación visual.
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-900">
      <Navbar />
      <main className="flex-grow flex flex-col items-center justify-center text-center px-6 py-20">
        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-8 shadow-lg shadow-green-500/30">
          <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">¡Pago confirmado!</h1>
        <p className="text-gray-400 text-lg max-w-md mb-10">
          Tu pago fue procesado exitosamente. Tu reserva quedó confirmada y recibirás un email con los detalles.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link to="/mis-reservas"
            className="bg-primary-600 hover:bg-primary-700 text-white font-bold px-8 py-4 rounded-xl transition-colors shadow-lg">
            Ver mis reservas →
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

export default PagoExitoso;
