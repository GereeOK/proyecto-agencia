import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDoc, doc } from 'firebase/firestore';
import { updateServicio } from '../../firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/authContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const EditarServicio = () => {
const { id } = useParams();
const navigate = useNavigate();
const { user } = useAuth();
const [servicio, setServicio] = useState({
    title: '',
    description: '',
    image: '',
    price: ''
});
const [error, setError] = useState(null);
const [success, setSuccess] = useState(null);

useEffect(() => {
    const fetchServicio = async () => {
    try {
        const docRef = doc(db, 'servicios', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
        const data = docSnap.data();

          // Verifica que el servicio sea del seller actual
        if (user?.role === 'admin' || data.sellerId === user?.uid) {
            setServicio({
                title: data.title || '',
                description: data.description || '',
                image: data.image || '',
                price: data.price || ''
            });
        } else {
            setError('No tenés permiso para editar este servicio.');
        }
        } else {
            setError('Servicio no encontrado.');
        }
    } catch (err) {
        console.error(err);
        setError('Error al cargar el servicio.');
    }
    };
    fetchServicio();
}, [id, user]);

const handleChange = (e) => {
    setServicio({ ...servicio, [e.target.name]: e.target.value });
};

const handleSubmit = async (e) => {
    e.preventDefault();
    try {
    await updateServicio(id, servicio);
    setSuccess('Servicio actualizado con éxito.');
    setTimeout(() => navigate('/seller'), 1500);
    } catch (err) {
    console.error(err);
    setError('Error al actualizar el servicio.');
    }
};

return (
    <div className="flex flex-col min-h-screen">
    <Navbar />
    <main className="flex-grow py-10 px-4 md:px-20">
        <h1 className="text-2xl font-bold mb-6">Editar Servicio</h1>

        {error && <p className="text-red-500 mb-4">{error}</p>}
        {success && <p className="text-green-500 mb-4">{success}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
        <div>
            <label className="block text-sm font-medium">Título</label>
            <input
            name="title"
            value={servicio.title}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
            />
        </div>

        <div>
            <label className="block text-sm font-medium">Descripción</label>
            <textarea
            name="description"
            value={servicio.description}
            onChange={handleChange}
            rows="4"
            required
            className="w-full border p-2 rounded"
            />
        </div>

        <div>
            <label className="block text-sm font-medium">URL de Imagen</label>
            <input
            name="image"
            value={servicio.image}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            />
        </div>

        <div>
            <label className="block text-sm font-medium">Precio (opcional)</label>
            <input
            name="price"
            value={servicio.price}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            />
        </div>

        <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
            Guardar Cambios
            </button>
        </form>
        </main>
        <Footer />
    </div>
    );
};

export default EditarServicio;
