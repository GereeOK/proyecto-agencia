import React, { useEffect, useState } from "react";
import { useAuth } from "../context/authContext";
import {
  fetchServiciosByCompany,
  createServicio,
  updateServicio,
  deleteServicio
} from "../firebase/firestore";
import Navbar from "../components/navbar";
import Footer from "../components/footer";

const HomeSeller = () => {
  const { user } = useAuth();
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentService, setCurrentService] = useState(null);

  const cargarServicios = async () => {
    if (!user || !user.companyId) return;
    setLoading(true);
    try {
      const data = await fetchServiciosByCompany(user.companyId);
      console.log("Servicios cargados:", data);  // <--- Ver esto en consola
      setServicios(data);
    } catch (err) {
      console.error("Error cargando servicios:", err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    cargarServicios();
  }, [user]);

  const abrirAdd = () => {
    setCurrentService({ title: "", description: "", image: "" });
    setShowAddModal(true);
  };

  const abrirEdit = (servicio) => {
    setCurrentService(servicio);
    setShowEditModal(true);
  };

  const cerrarModales = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setCurrentService(null);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const newId = await createServicio({
        ...currentService,
        companyId: user.companyId,  // Asegurate de usar companyId
      });
      // Agregar el nuevo servicio directamente al estado
      setServicios(prev => [
        ...prev,
        {
          id: newId,
          ...currentService,
          companyId: user.companyId,
          timestamp: new Date()
        }
      ]);
      cerrarModales();
    } catch (err) {
      console.error("Error creando servicio:", err);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await updateServicio(currentService.id, {
        title: currentService.title,
        description: currentService.description,
        image: currentService.image,
      });
      // Actualizar servicio editado en el estado
      setServicios(prev =>
        prev.map(s => (s.id === currentService.id ? { ...s, ...currentService } : s))
      );
      cerrarModales();
    } catch (err) {
      console.error("Error actualizando servicio:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de que querés eliminar este servicio?")) return;
    try {
      await deleteServicio(id);
      // Remover servicio del estado
      setServicios(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error("Error al eliminar:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <p className="text-gray-600 text-lg">Cargando servicios...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <section className="text-gray-800 bg-white body-font">
          <div className="container px-5 py-24 mx-auto">
            <div className="flex flex-col text-center w-full mb-10">
              <h1 className="text-2xl font-medium title-font mb-4 text-gray-900 tracking-widest">
                MIS SERVICIOS
              </h1>
              <p className="lg:w-2/3 mx-auto leading-relaxed text-base">
                Esta es la lista de servicios que has publicado.
              </p>
            </div>

            <div className="flex justify-center mb-10">
              <button
                onClick={abrirAdd}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-full transition"
              >
                + Agregar servicio
              </button>
            </div>

            <div className="flex flex-wrap -m-4">
              {servicios.length === 0 ? (
                <p className="text-center w-full text-gray-500">
                  No tenés servicios publicados aún.
                </p>
              ) : (
                servicios.map(({ id, title, description, image }) => (
                  <div className="p-4 lg:w-1/2" key={id}>
                    <div className="h-full flex sm:flex-row flex-col items-center sm:justify-start justify-center text-center sm:text-left bg-gray-50 rounded-lg shadow-md p-4">
                      <img
                        alt={title}
                        className="flex-shrink-0 rounded-lg w-48 h-48 object-cover object-center sm:mb-0 mb-4"
                        src={image}
                      />
                      <div className="flex-grow sm:pl-8">
                        <h2 className="title-font font-medium text-lg text-gray-900">{title}</h2>
                        <p className="mb-4 text-gray-700">{description}</p>
                        <span className="inline-flex">
                          <button
                            className="text-blue-600 hover:underline text-sm"
                            onClick={() => abrirEdit({ id, title, description, image })}
                          >
                            Editar
                          </button>
                          <button
                            className="ml-4 text-red-600 hover:underline text-sm"
                            onClick={() => handleDelete(id)}
                          >
                            Eliminar
                          </button>
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />

      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <form
            onSubmit={showAddModal ? handleAdd : handleEdit}
            className="bg-white p-6 rounded shadow-lg w-full max-w-md"
          >
            <h2 className="text-xl mb-4">
              {showAddModal ? "Nuevo Servicio" : "Editar Servicio"}
            </h2>

            <label className="block mb-2">
              Título
              <input
                type="text"
                className="w-full border rounded p-2"
                value={currentService.title}
                onChange={(e) => setCurrentService({ ...currentService, title: e.target.value })}
                required
              />
            </label>

            <label className="block mb-2">
              Descripción
              <textarea
                className="w-full border rounded p-2"
                value={currentService.description}
                onChange={(e) => setCurrentService({ ...currentService, description: e.target.value })}
                required
              />
            </label>

            <label className="block mb-4">
              URL imagen
              <input
                type="text"
                className="w-full border rounded p-2"
                value={currentService.image}
                onChange={(e) => setCurrentService({ ...currentService, image: e.target.value })}
              />
            </label>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 bg-gray-300 rounded"
                onClick={cerrarModales}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded"
              >
                {showAddModal ? "Crear" : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default HomeSeller;
