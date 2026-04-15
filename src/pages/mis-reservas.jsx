import React, { useState } from "react";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import ModalReserva from "../components/ModalReserva";
import { useMisReservas } from "../hooks/useMisReservas";

// MEJORA (RF-03 / CP7 – Estado de reserva): Se muestra el estado (pendiente /
// confirmada / cancelada) de cada reserva con un badge de color, para que el
// turista sepa en qué estado está su solicitud sin tener que contactar al admin.

const EstadoBadge = ({ estado }) => {
  const colores = {
    pendiente: "bg-yellow-100 text-yellow-800",
    confirmada: "bg-green-100 text-green-700",
    cancelada: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-semibold capitalize ${
        colores[estado] || "bg-gray-100 text-gray-600"
      }`}
    >
      {estado || "pendiente"}
    </span>
  );
};

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
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-900">Mis Reservas</h1>

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
                {/* MEJORA: Badge de estado visible directamente en la card */}
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-semibold text-gray-800">
                    {reserva.fullname}
                  </h2>
                  <EstadoBadge estado={reserva.estado} />
                </div>

                <p className="text-gray-700 mb-1 text-sm">
                  <strong>Email:</strong> {reserva.email}
                </p>
                <p className="text-gray-700 mb-1 text-sm">
                  <strong>Check-in:</strong> {reserva.checkin}
                </p>
                <p className="text-gray-700 mb-1 text-sm">
                  <strong>Check-out:</strong> {reserva.checkout}
                </p>
                <div className="text-gray-700 mb-4 text-sm">
                  <strong>Servicios:</strong>
                  {reserva.servicios && reserva.servicios.length > 0 ? (
                    <ul className="list-disc list-inside mt-1">
                      {reserva.servicios.map((s, i) => (
                        <li key={i}>{s?.title || s?.nombre || s?.name || "Sin nombre"}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>No especificados</p>
                  )}
                </div>

                {/* Overlay con acciones al hover */}
                <div className="absolute inset-0 bg-white bg-opacity-90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center items-center gap-3 rounded-lg">
                  {/* Solo permitir editar si la reserva no está cancelada */}
                  {reserva.estado !== "cancelada" && (
                    <button
                      onClick={() => setReservaSeleccionada(reserva)}
                      className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
                    >
                      Revisar reserva
                    </button>
                  )}
                  {/* MEJORA: El botón "Pagar" solo aparece si la reserva está confirmada */}
                  {reserva.estado === "confirmada" && (
                    <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition">
                      Pagar
                    </button>
                  )}
                  {/* MEJORA: Mensaje informativo si la reserva está cancelada */}
                  {reserva.estado === "cancelada" && (
                    <p className="text-red-500 font-medium text-sm px-4 text-center">
                      Esta reserva fue cancelada.
                    </p>
                  )}
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
