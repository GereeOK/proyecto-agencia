import React, { useEffect, useState } from "react";
import { useAuth } from "../context/authContext";
import { fetchServiciosBySeller } from "../firebase/firestore";

const HomeSeller = () => {
  const { user } = useAuth();
  const [servicios, setServicios] = useState([]);

  useEffect(() => {
    const cargarServicios = async () => {
      if (!user) return;
      try {
        const data = await fetchServiciosBySeller(user.uid);
        setServicios(data);
      } catch (err) {
        console.error("Error cargando servicios:", err);
      }
    };
    cargarServicios();
  }, [user]);

  return (
    <section className="text-gray-800 bg-white body-font">
      <div className="container px-5 py-24 mx-auto">
        <div className="flex flex-col text-center w-full mb-20">
          <h1 className="text-2xl font-medium title-font mb-4 text-gray-900 tracking-widest">MIS SERVICIOS</h1>
          <p className="lg:w-2/3 mx-auto leading-relaxed text-base">
            Esta es la lista de servicios que has publicado.
          </p>
        </div>
        <div className="flex flex-wrap -m-4">
          {servicios.map(({ id, title, description, image }) => (
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
                    <button className="text-blue-600 hover:underline text-sm">Editar</button>
                    <button className="ml-4 text-red-600 hover:underline text-sm">Eliminar</button>
                  </span>
                </div>
              </div>
            </div>
          ))}
          {servicios.length === 0 && (
            <p className="text-center w-full text-gray-500">No tenés servicios publicados aún.</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default HomeSeller;
