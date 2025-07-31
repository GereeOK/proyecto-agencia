import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { useAuth } from "../context/authContext";

const Perfil = () => {
  const { user } = useAuth();

  // Esperar a que user esté cargado
  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Cargando usuario...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Navbar />

      <main className="flex flex-col lg:flex-row px-4 py-12 gap-8 flex-grow">
        <section
          className="lg:w-2/3 bg-white shadow-md p-6 rounded-lg"
          data-aos="fade-left"
        >
          <h1 className="text-2xl font-bold mb-6 text-gray-800">
            Mi Perfil
          </h1>

          {/* Aquí podés mostrar info del usuario o un formulario de edición */}
          <p className="text-gray-700">Nombre: {user.displayName}</p>
          <p className="text-gray-700">Email: {user.email}</p>
          {/* Agregá más campos si querés */}
        </section>

        <aside
          className="lg:w-1/3 bg-white shadow-md p-6 rounded-lg"
          data-aos="fade-right"
        >
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Información adicional
          </h2>

          <p className="text-gray-500">Acá podés mostrar otras estadísticas, links, etc.</p>
        </aside>
      </main>

      <Footer />
    </div>
  );
};

export default Perfil;
