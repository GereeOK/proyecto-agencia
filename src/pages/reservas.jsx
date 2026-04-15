import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { useReservaForm } from "../hooks/useReservaForm";
import { useServicios } from "../hooks/useServicios";
import { useAuth } from "../context/authContext";

const ReservasPage = () => {
  const { user } = useAuth();
  // MEJORA: useServicios ahora expone loading y error para dar feedback al usuario
  const { servicios, loading: loadingServicios, error: errorServicios } = useServicios();

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Cargando usuario...</p>
      </div>
    );
  }

  const initialFormData = {
    fullname: user.displayName || "",
    email: user.email || "",
    checkin: "",
    checkout: "",
  };

  const {
    formData,
    selectedServices,
    handleChange,
    handleCheckboxChange,
    handleSubmit,
    loading,
    error,
  } = useReservaForm(servicios, initialFormData);

  // Filtra los servicios disponibles según la fecha de check-in seleccionada
  const filtrarServiciosPorFecha = () => {
    if (!formData.checkin) return servicios;

    const checkinDate = new Date(formData.checkin);
    checkinDate.setHours(0, 0, 0, 0);

    return servicios.filter((servicio) => {
      if (!servicio.from || !servicio.until) return false;
      const fromDate = servicio.from.toDate();
      const untilDate = servicio.until.toDate();
      fromDate.setHours(0, 0, 0, 0);
      untilDate.setHours(0, 0, 0, 0);
      return checkinDate >= fromDate && checkinDate <= untilDate;
    });
  };

  // MEJORA (RF-04): Solo mostrar servicios activos en el listado de reserva.
  // Se filtra por el campo "activo" para que los turistas no vean experiencias
  // que el admin/seller haya desactivado.
  const serviciosFiltrados = filtrarServiciosPorFecha().filter(
    (s) => s.activo !== false
  );

  // MEJORA: Fecha mínima para los inputs de fecha = hoy (evita seleccionar pasado)
  const hoy = new Date().toISOString().split("T")[0];

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Navbar />

      <main className="flex flex-col lg:flex-row px-4 py-12 gap-8 flex-grow">
        <section
          className="lg:w-2/3 bg-white shadow-md p-6 rounded-lg"
          data-aos="fade-left"
        >
          <h1 className="text-2xl font-bold mb-6 text-gray-800">Completa tu Reserva</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="checkin" className="block text-sm font-medium text-gray-700">
                  Fecha de inicio de viaje
                </label>
                <input
                  type="date"
                  id="checkin"
                  name="checkin"
                  value={formData.checkin}
                  onChange={handleChange}
                  // MEJORA: Se agrega min para impedir seleccionar fechas pasadas (CP1)
                  min={hoy}
                  required
                  className="mt-1 w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="checkout" className="block text-sm font-medium text-gray-700">
                  Fecha de fin
                </label>
                <input
                  type="date"
                  id="checkout"
                  name="checkout"
                  value={formData.checkout}
                  onChange={handleChange}
                  // MEJORA: min del checkout = checkin para evitar fechas inválidas
                  min={formData.checkin || hoy}
                  required
                  className="mt-1 w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="fullname" className="block text-sm font-medium text-gray-700">
                Nombre completo
              </label>
              <input
                type="text"
                id="fullname"
                name="fullname"
                placeholder="Tu nombre"
                value={formData.fullname}
                onChange={handleChange}
                required
                className="mt-1 w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email de confirmación
              </label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="tu@ejemplo.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="mt-1 w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* SERVICIOS FILTRADOS */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Agregar servicios
                {formData.checkin && (
                  <span className="ml-2 text-xs text-indigo-500 font-normal">
                    (mostrando disponibles para {formData.checkin})
                  </span>
                )}
              </label>

              {/* MEJORA: Mostrar estado de carga/error de los servicios */}
              {loadingServicios ? (
                <p className="text-gray-500 text-sm">Cargando servicios disponibles...</p>
              ) : errorServicios ? (
                <p className="text-red-500 text-sm">{errorServicios}</p>
              ) : serviciosFiltrados.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  {formData.checkin
                    ? "No hay servicios disponibles para la fecha seleccionada."
                    : "Seleccioná una fecha de inicio para ver los servicios disponibles."}
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {serviciosFiltrados.map((servicio) => {
                    const isSelected = selectedServices.includes(servicio.id);
                    return (
                      <div
                        key={servicio.id}
                        onClick={() => handleCheckboxChange(servicio.id)}
                        className={`cursor-pointer border rounded-lg p-3 shadow-md transition-all duration-200
                          ${isSelected ? "ring-2 ring-indigo-500 shadow-xl" : "hover:shadow-lg"}`}
                      >
                        <img
                          src={servicio.image}
                          alt={servicio.title}
                          className="w-full h-40 object-cover rounded-md mb-3"
                        />
                        <h3 className="font-semibold text-gray-800 text-center">
                          {servicio.title}
                        </h3>
                        <p className="text-sm text-gray-600 text-center mt-1">
                          {servicio.description}
                        </p>
                        {/* MEJORA: Mostrar precio si existe (visible en Servicios.jsx pero no aquí) */}
                        {servicio.price && (
                          <p className="text-center text-indigo-600 font-bold mt-1 text-sm">
                            ${servicio.price}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {error && <p className="text-red-600 font-semibold">{error}</p>}

            <button
              type="submit"
              className="bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-6 rounded-md shadow disabled:opacity-50"
              disabled={loading || loadingServicios}
            >
              {loading ? "Enviando..." : "Enviar reserva"}
            </button>
          </form>
        </section>

        <aside
          className="lg:w-1/3 bg-white shadow-md p-6 rounded-lg"
          data-aos="fade-right"
        >
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Servicios Seleccionados</h2>
          {selectedServices.length === 0 ? (
            <p className="text-gray-500">No seleccionaste servicios aún.</p>
          ) : (
            <ul className="space-y-4">
              {servicios
                .filter((s) => selectedServices.includes(s.id))
                .map((s) => (
                  <li
                    key={s.id}
                    className="border p-3 rounded bg-gray-50 flex flex-col items-center text-center"
                  >
                    <img
                      src={s.image}
                      alt={s.title}
                      className="w-full max-w-full h-48 object-cover rounded mb-3"
                    />
                    <h3 className="font-medium text-gray-700">{s.title}</h3>
                    <p className="text-sm text-gray-600">{s.description}</p>
                  </li>
                ))}
            </ul>
          )}
        </aside>
      </main>

      <Footer />
    </div>
  );
};

export default ReservasPage;
