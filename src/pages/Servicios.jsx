// src/pages/Servicios.jsx

import React, { useEffect, useState } from "react";
import { fetchServicios } from "../firebase/firestore";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { useNavigate } from "react-router-dom";

const Servicios = () => {
const [servicios, setServicios] = useState([]);
const navigate = useNavigate();

useEffect(() => {
    const obtenerServicios = async () => {
    try {
        const data = await fetchServicios();
        setServicios(data);
    } catch (err) {
        console.error("Error al obtener servicios:", err);
    }
    };
    obtenerServicios();
}, []);

return (
    <div className="flex flex-col min-h-screen">
    <Navbar />

    <main className="flex-grow bg-white py-16 px-4 sm:px-8 lg:px-16">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">Servicios Disponibles</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {servicios.map(({ id, title, description, image, price }) => (
            <div key={id} className="border rounded-lg shadow-sm overflow-hidden">
            <img
                src={image}
                alt={title}
                className="w-full h-48 object-cover"
            />
            <div className="p-4">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">{title}</h2>
                <p className="text-gray-600 text-sm mb-4">{description}</p>
                {price && <p className="text-indigo-600 font-bold mb-4">${price}</p>}
                <button
                className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded text-sm"
                onClick={() => navigate("/reservas")}
                >
                Reservar
                </button>
            </div>
            </div>
        ))}
        {servicios.length === 0 && (
            <p className="text-center col-span-3 text-gray-500">No hay servicios disponibles por el momento.</p>
        )}
        </div>
    </main>

    <Footer />
    </div>
);
};

export default Servicios;
