import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { useAuth } from "../context/authContext";
import { useEffect, useState } from "react";
import { getCompanyByUser, updateCompany } from "../firebase/firestore";

const Perfil = () => {
  const { user } = useAuth();
  const [companyData, setCompanyData] = useState(null);
  const [loadingCompany, setLoadingCompany] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedLogo, setEditedLogo] = useState("");

  useEffect(() => {
    const loadCompany = async () => {
      if (user?.role === "seller" && user.companyId) {
        setLoadingCompany(true);
        const company = await getCompanyByUser(user.companyId);
        setCompanyData(company);
        setLoadingCompany(false);
      }
    };
    loadCompany();
  }, [user]);

  const openModal = () => {
    setEditedName(companyData?.name || "");
    setEditedLogo(companyData?.logo || "");
    setShowModal(true);
  };

  const handleSaveChanges = async () => {
    try {
      await updateCompany(user.companyId, {
        name: editedName,
        logo: editedLogo,
      });
      setCompanyData((prev) => ({
        ...prev,
        name: editedName,
        logo: editedLogo,
      }));
      setShowModal(false);
    } catch (error) {
      console.error("Error al actualizar empresa:", error);
      alert("No se pudo actualizar la empresa. Intentá más tarde.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Navbar />

      <main className="flex flex-col lg:flex-row px-4 py-12 gap-8 flex-grow">
        <section className="lg:w-2/3 bg-white shadow-md p-6 rounded-lg" data-aos="fade-left">
          <h1 className="text-2xl font-bold mb-6 text-gray-800">Mi Perfil</h1>

          <p className="text-gray-700">Nombre: {user.displayName}</p>
          <p className="text-gray-700">Email: {user.email}</p>

          {user.role === "seller" && (
            <>
              <h2 className="mt-6 text-xl font-semibold text-gray-800">Datos de la Compañía</h2>

              {loadingCompany ? (
                <p>Cargando información de la compañía...</p>
              ) : companyData ? (
                <div>
                  <p className="text-gray-700">Nombre: {companyData.name}</p>

                  {companyData.logo && (
                    <div className="mt-4 flex flex-col items-start">
                      <img
                        src={companyData.logo}
                        alt="Logo de la compañía"
                        className="w-32 h-32 object-contain mb-2"
                      />
                      <button
                        onClick={openModal}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Editar empresa
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <p>No se encontró información de la compañía.</p>
              )}
            </>
          )}
        </section>

        <aside className="lg:w-1/3 bg-white shadow-md p-6 rounded-lg" data-aos="fade-right">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Información adicional</h2>
          <p className="text-gray-500">Acá podés mostrar otras estadísticas, links, etc.</p>
        </aside>
      </main>

      {/* MODAL */}
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
