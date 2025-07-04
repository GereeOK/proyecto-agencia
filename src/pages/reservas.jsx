import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { useReservaForm } from "../hooks/useReservaForm";
import { useServicios } from "../hooks/useServicios";
import { useAuth } from "../context/authContext";

const ReservasPage = () => {
  const { user } = useAuth();
  const servicios = useServicios();

  // Esperar a que user esté cargado
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

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Navbar />

      <main className="flex flex-col lg:flex-row px-4 py-12 gap-8 flex-grow">
        <section
          className="lg:w-2/3 bg-white shadow-md p-6 rounded-lg"
          data-aos="fade-left"
        >
          <h1 className="text-2xl font-bold mb-6 text-gray-800">
            Completa tu Reserva
          </h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="checkin"
                  className="block text-sm font-medium text-gray-700"
                >
                  Fecha de inicio
                </label>
                <input
                  type="date"
                  id="checkin"
                  name="checkin"
                  value={formData.checkin}
                  onChange={handleChange}
                  required
                  className="mt-1 w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label
                  htmlFor="checkout"
                  className="block text-sm font-medium text-gray-700"
                >
                  Fecha de fin
                </label>
                <input
                  type="date"
                  id="checkout"
                  name="checkout"
                  value={formData.checkout}
                  onChange={handleChange}
                  required
                  className="mt-1 w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="fullname"
                className="block text-sm font-medium text-gray-700"
              >
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
                className="mt-1 w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="tu@ejemplo.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="mt-1 w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Agregar servicios
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {servicios.map((servicio) => (
                  <label
                    key={servicio.id}
                    className="flex items-center space-x-2"
                  >
                    <input
                      type="checkbox"
                      value={servicio.id}
                      checked={selectedServices.includes(servicio.id)}
                      onChange={() => handleCheckboxChange(servicio.id)}
                      className="text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">{servicio.title}</span>
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-red-600 font-semibold">{error}</p>
            )}

            <button
              type="submit"
              className="bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded-md shadow"
              disabled={loading}
            >
              {loading ? "Enviando..." : "Enviar reserva"}
            </button>
          </form>
        </section>

        <aside
          className="lg:w-1/3 bg-white shadow-md p-6 rounded-lg"
          data-aos="fade-right"
        >
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Servicios Seleccionados
          </h2>
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
