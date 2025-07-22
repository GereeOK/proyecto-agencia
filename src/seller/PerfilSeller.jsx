// src/seller/PerfilSeller.jsx

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/authContext";
import { getFirestore, doc, updateDoc } from "firebase/firestore";
import { app } from "../firebase/config";

const db = getFirestore(app);

const PerfilSeller = () => {
const { user } = useAuth();

const [agencia, setAgencia] = useState("");
const [logo, setLogo] = useState("");
const [mensaje, setMensaje] = useState(null);
const [error, setError] = useState(null);

useEffect(() => {
    if (user && user.role === "seller") {
        setAgencia(user.agencia || "");
        setLogo(user.logo || "");
    }
}, [user]);

const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agencia) {
    setError("El nombre de la agencia es obligatorio.");
    return;
    }

    try {
        const ref = doc(db, "users", user.uid);
        await updateDoc(ref, {
        agencia,
        logo,
    });

        setMensaje("Perfil actualizado con éxito.");
        setError(null);
    } catch (err) {
        console.error("Error al actualizar el perfil:", err);
        setError("No se pudo actualizar el perfil. Intentá nuevamente.");
        setMensaje(null);
    }
};

return (
    <div className="max-w-xl mx-auto py-10">
    <h1 className="text-2xl font-bold mb-6 text-center">Mi perfil de agencia</h1>

    <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium text-gray-700">Nombre de la agencia *</label>
        <input
            type="text"
            value={agencia}
            onChange={(e) => setAgencia(e.target.value)}
            className="w-full border border-gray-300 rounded px-4 py-2"
            required
        />
        </div>

        <div>
        <label className="block font-medium text-gray-700">Logo de la agencia (URL)</label>
        <input
            type="url"
            value={logo}
            onChange={(e) => setLogo(e.target.value)}
            className="w-full border border-gray-300 rounded px-4 py-2"
        />
        </div>

        {logo && (
            <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">Previsualización del logo:</p>
            <img src={logo} alt="Logo de la agencia" className="w-32 h-32 object-contain border" />
            </div>
        )}

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {mensaje && <p className="text-green-600 text-sm">{mensaje}</p>}

        <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition w-full"
        >
        Guardar cambios
    </button>
    </form>
    </div>
    );
};

export default PerfilSeller;
