import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { useAuth } from "../context/authContext";
import usePerfil from "../hooks/usePerfil";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const Perfil = () => {
  const { user } = useAuth();

  const {
    companyData,
    loadingCompany,
    showModal,
    editedName,
    editedLogo,
    editedTelefono,
    editedSocial,
    setShowModal,
    setEditedName,
    setEditedLogo,
    setEditedTelefono,
    setEditedSocial,
    openModal,
    handleSaveChanges,

    // Datos para gráficos agregados en usePerfil
    servicesCount,
    reservationsCount,
  } = usePerfil(user);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A28CFE", "#FE6499"];

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Navbar />

      <main className="flex flex-col lg:flex-row px-4 py-12 gap-8 flex-grow">
        <section
          className="lg:w-2/3 bg-white shadow-md p-6 rounded-lg"
          data-aos="fade-left"
        >
          <h1 className="text-2xl font-bold mb-6 text-gray-800">Mi Perfil</h1>

          <p className="text-gray-700">Nombre: {user.displayName}</p>
          <p className="text-gray-700">Email: {user.email}</p>

          {user.role === "seller" && (
            <>
              <h2 className="mt-6 text-xl font-semibold text-gray-800">
                Datos de la Compañía
              </h2>

              {loadingCompany ? (
                <p className="text-gray-600 mt-2">
                  Cargando información de la compañía...
                </p>
              ) : companyData ? (
                <div className="mt-4 flex flex-col md:flex-row items-start md:items-center gap-6">
                  {companyData.logo && (
                    <img
                      src={companyData.logo}
                      alt="Logo de la compañía"
                      className="w-28 h-28 object-contain rounded border"
                    />
                  )}

                  <div className="flex flex-col gap-1">
                    <p className="text-gray-800 text-lg font-medium">
                      {companyData.name}
                    </p>

                    {companyData.telefono && (
                      <p className="text-gray-700 text-sm">
                        📞 Teléfono: {companyData.telefono}
                      </p>
                    )}
                    {companyData.social && (
                      <p className="text-gray-700 text-sm">
                        🔗 Red social:{" "}
                        <a
                          href={companyData.social}
                          className="text-blue-600 underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {companyData.social}
                        </a>
                      </p>
                    )}

                    <button
                      onClick={openModal}
                      className="mt-2 self-start px-4 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Editar empresa
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600 mt-2">
                  No se encontró información de la compañía.
                </p>
              )}
            </>
          )}
        </section>

        <aside
          className="lg:w-1/3 bg-white shadow-md p-6 rounded-lg"
          data-aos="fade-right"
        >
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Información adicional
          </h2>

          {loadingCompany ? (
            <p className="text-gray-500">Cargando estadísticas...</p>
          ) : servicesCount.length === 0 && reservationsCount.length === 0 ? (
            <p className="text-gray-500">
              No hay datos suficientes para mostrar estadísticas.
            </p>
          ) : (
            <>
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Servicios más vendidos</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={servicesCount}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {servicesCount.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Reservas por mes</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={reservationsCount}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </aside>
      </main>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded-lg shadow-md w-[90%] max-w-md">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Editar Empresa</h2>

            <label className="block mb-2 text-sm text-gray-700">Nombre:</label>
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className="w-full mb-4 p-2 border rounded"
            />

            <label className="block mb-2 text-sm text-gray-700">Logo (URL):</label>
            <input
              type="text"
              value={editedLogo}
              onChange={(e) => setEditedLogo(e.target.value)}
              className="w-full mb-4 p-2 border rounded"
            />

            <label className="block mb-2 text-sm text-gray-700">Teléfono:</label>
            <input
              type="text"
              value={editedTelefono}
              onChange={(e) => setEditedTelefono(e.target.value)}
              className="w-full mb-4 p-2 border rounded"
            />

            <label className="block mb-2 text-sm text-gray-700">Red social o enlace:</label>
            <input
              type="text"
              value={editedSocial}
              onChange={(e) => setEditedSocial(e.target.value)}
              className="w-full mb-4 p-2 border rounded"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveChanges}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Perfil;
