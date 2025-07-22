// src/seller/CrearServicio.jsx

import React, { useState } from "react";
import { useAuth } from "../context/authContext";
import { createServicio } from "../firebase/firestore";
import { useNavigate } from "react-router-dom";

const CrearServicio = () => {
const { user } = useAuth();
const navigate = useNavigate();

const [title, setTitle] = useState("");
const [description, setDescription] = useState("");
const [image, setImage] = useState("");

const [error, setError] = useState(null);
const [success, setSuccess] = useState(null);

const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !description || !image) {
    setError("Por favor completá todos los campos obligatorios.");
        return;
    }

    try {
    const servicio = {
        title,
        description,
        image,
        sellerId: user.uid,
        agencia: user.agencia || "",
        logoAgencia: user.logo || "",
    };

    await createServicio(servicio);
    setSuccess("Servicio creado con éxito.");
    setError(null);

      // Redireccionar al home del seller
    setTimeout(() => {
        navigate("/seller");
    }, 1500);
    } catch (err) {
        console.error("Error al crear servicio:", err);
        setError("Ocurrió un error al guardar el servicio.");
        setSuccess(null);
    }
};

return (
    <div className="max-w-xl mx-auto py-10">
    <h1 className="text-2xl font-bold mb-6 text-center">Crear nuevo servicio</h1>

    <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium text-gray-700">Título *</label>
            <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded px-4 py-2"
            required
            />
        </div>

        <div>
          <label className="block font-medium text-gray-700">Descripción *</label>
            <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-gray-300 rounded px-4 py-2"
            rows="4"
            required
            />
        </div>

        <div>
          <label className="block font-medium text-gray-700">Imagen (URL) *</label>
        <input
            type="url"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            className="w-full border border-gray-300 rounded px-4 py-2"
            required
            />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">{success}</p>}

        <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition w-full"
        >
        Publicar servicio
        </button>
        </form>
        </div>
    );
};

export default CrearServicio;
