import React, { useState, useEffect } from "react";
import { fetchUsuarios } from "../firebase/firestore"; // ajusta la ruta

const UsuariosTable = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarUsuarios = async () => {
      try {
        const data = await fetchUsuarios();
        setUsuarios(data);
      } catch (error) {
        console.error("Error cargando usuarios:", error);
      } finally {
        setLoading(false);
      }
    };
    cargarUsuarios();
  }, []);

  const editarUsuario = (email) => {
    alert("Editar usuario: " + email);
    // Abrir modal o redirigir a página edición
  };

  const eliminarUsuario = (email) => {
    if (window.confirm(`¿Seguro que querés eliminar al usuario con email ${email}?`)) {
      alert("Usuario eliminado: " + email);
      // Lógica para eliminar usuario de Firebase y actualizar estado
    }
  };

  const nuevoUsuario = () => {
    alert("Abrir formulario para crear un nuevo usuario");
  };

  if (loading) {
    return <p className="text-center py-10">Cargando usuarios...</p>;
  }

  return (
    <section className="text-gray-600 body-font">
      <div className="container px-5 py-24 mx-auto">
        <div className="flex flex-col text-center w-full mb-20">
          <h1 className="sm:text-4xl text-3xl font-medium title-font mb-2 text-gray-900">
            Usuarios
          </h1>
          <p className="lg:w-2/3 mx-auto leading-relaxed text-base">
            Listado de usuarios con opciones para editar o eliminar.
          </p>
        </div>
        <div className="lg:w-2/3 w-full mx-auto overflow-auto">
          <table className="table-auto w-full text-left whitespace-no-wrap">
            <thead>
              <tr>
                <th className="px-4 py-3 title-font tracking-wider font-medium text-gray-900 text-sm bg-gray-100 rounded-tl rounded-bl">
                  Nombre
                </th>
                <th className="px-4 py-3 title-font tracking-wider font-medium text-gray-900 text-sm bg-gray-100">
                  Email
                </th>
                <th className="px-4 py-3 title-font tracking-wider font-medium text-gray-900 text-sm bg-gray-100">
                  Rol
                </th>
                <th className="w-40 title-font tracking-wider font-medium text-gray-900 text-sm bg-gray-100 rounded-tr rounded-br text-center">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {usuarios.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-4">
                    No hay usuarios registrados
                  </td>
                </tr>
              )}
              {usuarios.map(({ uid, email, role }) => (
                <tr key={uid}>
                  <td className="px-4 py-3">{email.split("@")[0]}</td>
                  <td className="px-4 py-3">{email}</td>
                  <td className="px-4 py-3">{role}</td>
                  <td className="w-40 text-center px-4 py-3">
                    <button
                      className="bg-blue-500 hover:bg-blue-700 text-white py-1 px-3 rounded mr-2"
                      onClick={() => editarUsuario(email)}
                    >
                      Editar
                    </button>
                    <button
                      className="bg-red-500 hover:bg-red-700 text-white py-1 px-3 rounded"
                      onClick={() => eliminarUsuario(email)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex pl-4 mt-4 lg:w-2/3 w-full mx-auto">
          <button
            className="ml-auto text-white bg-green-500 border-0 py-2 px-6 focus:outline-none hover:bg-green-600 rounded"
            onClick={nuevoUsuario}
          >
            Agregar Usuario
          </button>
        </div>
      </div>
    </section>
  );
};

export default UsuariosTable;
