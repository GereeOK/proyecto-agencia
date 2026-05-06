// PantallaPago.jsx
// Pantalla de selección de método de pago.
// Se accede desde el botón "Pagar" en Mis Reservas.
// Recibe la reserva via location.state (React Router).
//
// Flujo:
//   1. Usuario elige MercadoPago
//   2. Se llama a /api/crearPreferenciaMp (Vercel Serverless Function)
//   3. Se redirige a la URL de pago de MP
//   4. MP redirige de vuelta a /pago-exitoso o /pago-fallido

import React, { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
const formatARS = (n) => Number(n || 0).toLocaleString("es-AR");

// ── Calcular total de la reserva
const calcularTotal = (reserva) =>
  (reserva?.servicios || []).reduce(
    (acc, s) => acc + Number(s.price || 0) * Number(s.personas || reserva.personas || 1),
    0
  );

// ── Card de método de pago
const MetodoPagoCard = ({ id, logo, titulo, descripcion, seleccionado, onSelect }) => (
  <button
    onClick={() => onSelect(id)}
    className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 ${
      seleccionado
        ? "border-indigo-500 bg-indigo-50 shadow-md"
        : "border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm"
    }`}
  >
    <div className="flex items-center gap-4">
      {/* Radio visual */}
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
        seleccionado ? "border-indigo-500" : "border-gray-300"
      }`}>
        {seleccionado && <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />}
      </div>

      {/* Logo */}
      <div className="w-16 h-10 flex items-center justify-center flex-shrink-0">
        {logo}
      </div>

      {/* Info */}
      <div>
        <p className="font-bold text-gray-900 text-base">{titulo}</p>
        <p className="text-sm text-gray-500 mt-0.5">{descripcion}</p>
      </div>
    </div>
  </button>
);

// ── Logos SVG simples
const LogoMP = () => (
  <div className="w-14 h-9 bg-[#009EE3] rounded-lg flex items-center justify-center">
    <span className="text-white font-black text-xs tracking-tight">MP</span>
  </div>
);

const LogoPayPal = () => (
  <div className="w-14 h-9 bg-[#003087] rounded-lg flex items-center justify-center px-1">
    <span className="text-white font-black text-xs">Pay</span>
    <span className="text-[#009CDE] font-black text-xs">Pal</span>
  </div>
);

// ────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ────────────────────────────────────────────────────────────
const PantallaPago = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // La reserva llega por React Router state desde Mis Reservas:
  // navigate("/pagar", { state: { reserva } })
  const reserva = location.state?.reserva;

  const [metodo, setMetodo] = useState(null); // "mp" | "paypal"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Si no hay reserva en el state, redirigir
  if (!reserva) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar />
        <main className="flex-grow flex items-center justify-center text-center px-4">
          <div>
            <p className="text-gray-500 text-lg mb-4">No se encontró la reserva.</p>
            <Link to="/mis-reservas"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold">
              Volver a Mis Reservas
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const total = calcularTotal(reserva);

  // ── MercadoPago
  const pagarConMP = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/crearPreferenciaMp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservaId: reserva.id,
          items: (reserva.servicios || []).map((s) => ({
            title: s.title || "Experiencia",
            price: Number(s.price || 0),
            personas: Number(s.personas || reserva.personas || 1),
          })),
          email: reserva.email,
        }),
      });

      if (!response.ok) throw new Error("Error del servidor al crear el pago.");
      const data = await response.json();

      const url = data.sandbox_init_point || data.init_point;
      if (!url) throw new Error("No se recibió URL de pago de MercadoPago.");
      window.location.href = url;
    } catch (err) {
      console.error("Error MP:", err);
      setError(
        err.message.includes("No se recibió") || err.message.includes("Error del servidor")
          ? err.message
          : "No se pudo iniciar el pago con MercadoPago. Verificá tu conexión e intentá de nuevo."
      );
      setLoading(false);
    }
  };

  // PayPal temporalmente deshabilitado — descomentar cuando se tengan las credenciales
  // const pagarConPayPal = async () => {
  //   setLoading(true);
  //   setError(null);
  //   try {
  //     const crearOrder = httpsCallable(functions, "crearOrderPaypal");
  //     const result = await crearOrder({
  //       reservaId: reserva.id,
  //       items: (reserva.servicios || []).map((s) => ({
  //         title: s.title || "Experiencia",
  //         price: Number(s.price || 0),
  //         personas: Number(s.personas || reserva.personas || 1),
  //       })),
  //     });
  //     const url = result.data?.approveUrl;
  //     if (!url) throw new Error("No se recibió URL de pago de PayPal.");
  //     window.location.href = url;
  //   } catch (err) {
  //     console.error("Error PayPal:", err);
  //     setError(
  //       err.message.includes("No se recibió")
  //         ? err.message
  //         : "No se pudo iniciar el pago con PayPal. Verificá tu conexión e intentá de nuevo."
  //     );
  //     setLoading(false);
  //   }
  // };

  const handlePagar = () => {
    if (!metodo) { setError("Seleccioná un método de pago."); return; }
    // PayPal deshabilitado temporalmente
    if (metodo === "mp") pagarConMP();
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero */}
      <div className="bg-gray-900 text-white py-10 px-4 text-center">
        <h1 className="text-3xl font-bold mb-1">Completar pago</h1>
        <p className="text-gray-400 text-sm">Elegí cómo querés pagar tu reserva</p>
      </div>

      <main className="flex-grow container mx-auto px-4 py-8 max-w-2xl">
        <div className="grid md:grid-cols-5 gap-6">

          {/* ── Columna izquierda: métodos de pago */}
          <div className="md:col-span-3 space-y-4">
            <h2 className="text-base font-bold text-gray-900 mb-3">Método de pago</h2>

            <MetodoPagoCard
              id="mp"
              logo={<LogoMP />}
              titulo="MercadoPago"
              descripcion="Tarjetas, cuotas, efectivo, billetera MP"
              seleccionado={metodo === "mp"}
              onSelect={setMetodo}
            />

            {/* PayPal temporalmente deshabilitado — descomentar cuando se tengan las credenciales
            <MetodoPagoCard
              id="paypal"
              logo={<LogoPayPal />}
              titulo="PayPal"
              descripcion="Tarjetas internacionales y cuenta PayPal (USD)"
              seleccionado={metodo === "paypal"}
              onSelect={setMetodo}
            />
            */}

            {/* Info según método seleccionado */}
            {metodo === "mp" && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
                <p className="font-semibold mb-1">💳 Pagás en pesos argentinos (ARS)</p>
                <p>Aceptamos todas las tarjetas de crédito y débito, cuotas sin interés, Rapipago, PagoFácil y billetera MercadoPago.</p>
              </div>
            )}
            {/* PayPal info — descomentar cuando esté habilitado
            {metodo === "paypal" && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
                <p className="font-semibold mb-1">💵 Pagás en dólares estadounidenses (USD)</p>
                <p>Ideal para turistas internacionales. El monto se convierte aproximadamente según el tipo de cambio actual.</p>
              </div>
            )}
            */}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                ⚠️ {error}
              </div>
            )}
          </div>

          {/* ── Columna derecha: resumen de la reserva */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-4">
              <h2 className="text-base font-bold text-gray-900 mb-4">Tu reserva</h2>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Período</span>
                  <span className="font-medium text-gray-700">{reserva.checkin} → {reserva.checkout}</span>
                </div>
              </div>

              {/* Servicios */}
              <div className="space-y-2 border-t border-gray-100 pt-3 mb-4">
                {(reserva.servicios || []).map((s, i) => {
                  const personas = Number(s.personas || reserva.personas || 1);
                  const subtotal = Number(s.price || 0) * personas;
                  return (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-600 flex-1 pr-2 truncate">
                        {s.title} × {personas}
                      </span>
                      <span className="font-medium text-gray-800 flex-shrink-0">
                        {subtotal > 0 ? `$${formatARS(subtotal)}` : "—"}
                      </span>
                    </div>
                  );
                })}
              </div>

                <div className="border-t border-gray-100 pt-3 mb-5">
                  <div className="flex justify-between font-bold text-gray-900 text-base">
                    <span>Total</span>
                    <span>{total > 0 ? `$${formatARS(total)}` : "A consultar"}</span>
                  </div>
                </div>

              <button
                onClick={handlePagar}
                disabled={loading || !metodo}
                className={`w-full py-4 rounded-xl font-bold text-sm transition-all ${
                  loading
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : !metodo
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-[#009EE3] hover:bg-[#007fc0] text-white shadow-md"
                }`}
              >
                {loading
                  ? "Redirigiendo al pago..."
                  : !metodo
                  ? "Seleccioná un método"
                  : "Pagar con MercadoPago →"}
              </button>

              <Link
                to="/mis-reservas"
                className="block text-center text-sm text-gray-400 hover:text-gray-600 mt-3 transition-colors"
              >
                ← Volver a mis reservas
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PantallaPago;
