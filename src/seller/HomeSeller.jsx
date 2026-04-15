import React, { useEffect, useState } from "react";
import { useAuth } from "../context/authContext";
import {
  fetchServiciosByCompany,
  createServicio,
  updateServicio,
  deleteServicio,
} from "../firebase/firestore";
import { Timestamp } from "firebase/firestore";
import Navbar from "../components/navbar";
import Footer from "../components/footer";

// MEJORA (RF-04 – Gestión de Experiencias – Seller): Se agregan campos de
// fecha (from/until) y precio al formulario del seller, que antes solo tenía
// título, descripción e imagen. El seller necesita gestionar disponibilidad
// según RF-04: "Gestionar cupos máximos y disponibles."
// También se agrega toggle de activar/desactivar sin eliminar.

const HomeSeller = () => {
  const { user } = useAuth();
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentService, setCurrentService] = useState(null);

  // MEJORA: Estado de feedback para operaciones de crear/editar
  const [opFeedback, setOpFeedback] = useState(null);

  const cargarServicios = async () => {
    if (!user || !user.companyId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchServiciosByCompany(user.companyId);
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
    setCurrentService({
      title: "",
      description: "",
      image: "",
      price: "",
      from: null,
      until: null,
      activo: true,
    });
    setOpFeedback(null);
    setShowAddModal(true);
  };

  const abrirEdit = (servicio) => {
    setCurrentService({ ...servicio, price: servicio.price || "" });
    setOpFeedback(null);
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
        companyId: user.companyId,
      });
      setServicios((prev) => [
        ...prev,
        {
          id: newId,
          ...currentService,
          companyId: user.companyId,
          timestamp: new Date(),
        },
      ]);
      cerrarModales();
    } catch (err) {
      console.error("Error creando servicio:", err);
      setOpFeedback("No se pudo crear el servicio. Intentá nuevamente.");
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await updateServicio(currentService.id, {
        title: currentService.title,
        description: currentService.description,
        image: currentService.image,
        price: currentService.price,
        from: currentService.from,
        until: currentService.until,
        activo: currentService.activo,
      });
      setServicios((prev) =>
        prev.map((s) => (s.id === currentService.id ? { ...s, ...currentService } : s))
      );
      cerrarModales();
    } catch (err) {
      console.error("Error actualizando servicio:", err);
      setOpFeedback("No se pudo actualizar el servicio.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de que querés eliminar este servicio?")) return;
    try {
      await deleteServicio(id);
      setServicios((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error("Error al eliminar:", err);
    }
  };

  // MEJORA (RF-04): Desactivar/activar servicio sin eliminarlo
  const handleToggleActivo = async (servicio) => {
    const nuevoEstado = servicio.activo !== false ? false : true;
    try {
      await updateServicio(servicio.id, { activo: nuevoEstado });
      setServicios((prev) =>
        prev.map((s) => (s.id === servicio.id ? { ...s, activo: nuevoEstado } : s))
      );
    } catch (err) {
      console.error("Error cambiando estado:", err);
    }
  };

  // MEJORA: Advertencia si el seller no tiene companyId asignado
  if (!loading && (!user?.companyId)) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <p className="text-red-500 text-center px-4">
            Tu cuenta no tiene una empresa asociada. Contactá al administrador.
          </p>
        </main>
        <Footer />
      </div>
    );
  }

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
                Esta es la lista de servicios que has publicado. Podés activarlos, desactivarlos o editarlos.
              </p>
            </div>

            <div className="flex justify-center mb-10">
              <button
                onClick={abrirAdd}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-full transition"
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
                servicios.map((servicio) => {
                  const { id, title, description, image, price, activo } = servicio;
                  return (
                    <div className="p-4 lg:w-1/2" key={id}>
                      <div
                        className={`h-full flex sm:flex-row flex-col items-center sm:justify-start justify-center text-center sm:text-left rounded-lg shadow-md p-4 transition ${
                          activo === false ? "bg-gray-100 opacity-60" : "bg-gray-50"
                        }`}
                      >
                        <img
                          alt={title}
                          className="flex-shrink-0 rounded-lg w-48 h-48 object-cover object-center sm:mb-0 mb-4"
                          src={image}
                        />
                        <div className="flex-grow sm:pl-8">
                          <div className="flex items-center gap-2 mb-1">
                            <h2 className="title-font font-medium text-lg text-gray-900">{title}</h2>
                            {/* MEJORA: Badge de estado activo/inactivo en la card */}
                            <span
                              className={`text-xs px-2 py-0.5 rounded font-semibold ${
                                activo !== false
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {activo !== false ? "Activo" : "Inactivo"}
                            </span>
                          </div>
                          <p className="mb-2 text-gray-700 text-sm">{description}</p>
                          {price && (
                            <p className="text-indigo-600 font-bold mb-2 text-sm">${price}</p>
                          )}
                          <span className="inline-flex gap-4">
                            <button
                              className="text-blue-600 hover:underline text-sm"
                              onClick={() => abrirEdit(servicio)}
                            >
                              Editar
                            </button>
                            {/* MEJORA (RF-04): Botón desactivar/activar */}
                            <button
                              className={`text-sm hover:underline ${
                                activo !== false ? "text-yellow-600" : "text-green-600"
                              }`}
                              onClick={() => handleToggleActivo(servicio)}
                            >
                              {activo !== false ? "Desactivar" : "Activar"}
                            </button>
                            <button
                              className="text-red-600 hover:underline text-sm"
                              onClick={() => handleDelete(id)}
                            >
                              Eliminar
                            </button>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />

      {/* MODAL ADD / EDIT */}
      {(showAddModal || showEditModal) && currentService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <form
            onSubmit={showAddModal ? handleAdd : handleEdit}
            className="bg-white p-6 rounded shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto"
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

            <label className="block mb-2">
              URL imagen
              <input
                type="text"
                className="w-full border rounded p-2"
                value={currentService.image}
                onChange={(e) => setCurrentService({ ...currentService, image: e.target.value })}
              />
            </label>

            {/* MEJORA: Campo de precio que no existía antes en el formulario del seller */}
            <label className="block mb-2">
              Precio (opcional)
              <input
                type="number"
                min="0"
                className="w-full border rounded p-2"
                value={currentService.price}
                onChange={(e) => setCurrentService({ ...currentService, price: e.target.value })}
                placeholder="Ej: 5000"
              />
            </label>

            {/* MEJORA: Campos de fecha que no existían antes en el formulario del seller */}
            <label className="block mb-2">
              Disponible desde
              <input
                type="date"
                className="w-full border rounded p-2"
                value={
                  currentService.from?.toDate
                    ? currentService.from.toDate().toISOString().split("T")[0]
                    : currentService.from instanceof Date
                    ? currentService.from.toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  setCurrentService({
                    ...currentService,
                    from: e.target.value ? Timestamp.fromDate(new Date(e.target.value)) : null,
                  })
                }
              />
            </label>

            <label className="block mb-4">
              Disponible hasta
              <input
                type="date"
                className="w-full border rounded p-2"
                value={
                  currentService.until?.toDate
                    ? currentService.until.toDate().toISOString().split("T")[0]
                    : currentService.until instanceof Date
                    ? currentService.until.toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  setCurrentService({
                    ...currentService,
                    until: e.target.value ? Timestamp.fromDate(new Date(e.target.value)) : null,
                  })
                }
              />
            </label>

            {opFeedback && (
              <p className="text-red-500 text-sm mb-3">{opFeedback}</p>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 bg-gray-300 rounded"
                onClick={cerrarModales}
              >
                Cancelar
              </button>
              <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
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
