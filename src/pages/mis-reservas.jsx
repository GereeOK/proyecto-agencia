import React, { useState } from "react";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import ModalReserva from "../components/ModalReserva";
import { useMisReservas } from "../hooks/useMisReservas";

const MisReservas = () => {
  const {
    reservas,
    serviciosDisponibles,
    loading,
    error,
    handleUpdate,
    handleDelete,
  } = useMisReservas();

  const [reservaSeleccionada, setReservaSeleccionada] = useState(null);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-900">
          Mis Reservas
        </h1>

        {loading ? (
          <p className="text-center text-gray-600">Cargando tus reservas...</p>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : reservas.length === 0 ? (
          <p className="text-center text-gray-700">No tenés reservas aún.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reservas.map((reserva) => (
              <div
                key={reserva.id}
                className="border rounded-lg p-6 shadow hover:shadow-xl transition relative group bg-white"
              >
                <h2 className="text-xl font-semibold mb-2">
                  Reserva a nombre de: {reserva.fullname}
                </h2>
                <p className="text-gray-700 mb-1">
                  <strong>Email de confirmación: </strong> {reserva.email}
                </p>
                <p className="text-gray-700 mb-1">
                  <strong>Check-in:</strong> {reserva.checkin}
                </p>
                <p className="text-gray-700 mb-1">
                  <strong>Check-out:</strong> {reserva.checkout}
                </p>
                <div className="text-gray-700 mb-4">
                  <strong>Servicios:</strong>
                  {reserva.servicios && reserva.servicios.length > 0 ? (
                    <ul className="list-disc list-inside mt-1">
                      {reserva.servicios.map((s, i) => (
                        <li key={i}>{s.title || s.nombre || s.name || "Sin nombre"}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>No especificados</p>
                  )}
                </div>

                <div className="absolute inset-0 bg-white bg-opacity-90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center items-center gap-3 rounded-lg">
                  <button
                    onClick={() => setReservaSeleccionada(reserva)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
                  >
                    Revisar reserva
                  </button>
                  <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition">
                    Pagar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {reservaSeleccionada && (
        <ModalReserva
          reserva={reservaSeleccionada}
          serviciosDisponibles={serviciosDisponibles}
          onClose={() => setReservaSeleccionada(null)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}

      <Footer />
    </div>
  );
};

export default MisReservas;
