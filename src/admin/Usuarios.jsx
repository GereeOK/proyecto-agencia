import React, { useState, useEffect } from "react";
import { fetchUsuarios, updateUsuarioRol, desactivarUsuario } from "../firebase/firestore";

// MEJORA (RF-05 – Gestión de Usuarios y Roles): El componente original tenía
// los botones "Editar" y "Eliminar" con alert() falsos (sin funcionalidad real).
// Se implementa:
//  - Edición real del rol del usuario (Turista / Seller / Admin) con modal.
//  - Desactivación de cuenta (soft delete con campo "activo: false") en lugar
//    de eliminación definitiva, como indica RF-05: "Desactivar cuentas".
//  - Badge de rol con color para mejorar la legibilidad (RNF-01 – UX).
//  - Indicador visual para cuentas inactivas.

const ROLES = ["user", "seller", "admin"];

const rolColor = {
  admin: "bg-red-100 text-red-700",
  seller: "bg-blue-100 text-blue-700",
  user: "bg-green-100 text-green-700",
};

const UsuariosTable = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estado del modal de edición de rol
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [rolSeleccionado, setRolSeleccionado] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    cargarUsuarios();
  }, []);

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

  // MEJORA: Abre el modal de edición con el rol actual pre-seleccionado
  const abrirModalEditar = (usuario) => {
    setUsuarioEditando(usuario);
    setRolSeleccionado(usuario.role || "user");
    setFeedback(null);
  };

  // MEJORA: Guarda el nuevo rol en Firestore usando updateUsuarioRol()
  const guardarRol = async () => {
    if (!usuarioEditando) return;
    setGuardando(true);
    try {
      await updateUsuarioRol(usuarioEditando.uid, rolSeleccionado);
      // Actualizar el estado local para reflejar el cambio sin recargar
      setUsuarios((prev) =>
        prev.map((u) =>
          u.uid === usuarioEditando.uid ? { ...u, role: rolSeleccionado } : u
        )
      );
      setFeedback({ tipo: "ok", mensaje: "Rol actualizado correctamente." });
      setTimeout(() => setUsuarioEditando(null), 1200);
    } catch (err) {
      console.error("Error actualizando rol:", err);
      setFeedback({ tipo: "error", mensaje: "No se pudo actualizar el rol." });
    } finally {
      setGuardando(false);
    }
  };

  // MEJORA: Desactiva la cuenta (soft delete) en lugar de eliminarla
  const handleDesactivar = async (usuario) => {
    if (
      !window.confirm(
        `¿Desactivar la cuenta de ${usuario.email}? El usuario no podrá iniciar sesión.`
      )
    )
      return;
    try {
      await desactivarUsuario(usuario.uid);
      setUsuarios((prev) =>
        prev.map((u) =>
          u.uid === usuario.uid ? { ...u, activo: false } : u
        )
      );
    } catch (err) {
      console.error("Error desactivando usuario:", err);
      alert("No se pudo desactivar el usuario.");
    }
  };

  if (loading) {
    return <p className="text-center py-10">Cargando usuarios...</p>;
  }

  return (
    <section className="text-gray-600 body-font">
      <div className="container px-4 py-8 mx-auto">
        <div className="flex flex-col text-center w-full mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Usuarios</h1>
          <p className="text-gray-600 text-base">
            Listado de usuarios. Podés editar roles o desactivar cuentas.
          </p>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="table-auto w-full text-left">
            <thead>
              <tr>
                <th className="px-4 py-2 bg-gray-100 text-sm font-medium text-gray-900">Nombre</th>
                <th className="px-4 py-2 bg-gray-100 text-sm font-medium text-gray-900">Email</th>
                <th className="px-4 py-2 bg-gray-100 text-sm font-medium text-gray-900">Rol</th>
                {/* MEJORA: Nueva columna para mostrar el estado de la cuenta */}
                <th className="px-4 py-2 bg-gray-100 text-sm font-medium text-gray-900">Estado</th>
                <th className="px-4 py-2 bg-gray-100 text-sm font-medium text-gray-900 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-4">
                    No hay usuarios registrados
                  </td>
                </tr>
              )}
              {usuarios.map(({ uid, email, role, activo, fullname }) => (
                <tr
                  key={uid}
                  className={`border-t ${activo === false ? "opacity-50" : ""}`}
                >
                  <td className="px-4 py-2">{fullname || email?.split("@")[0]}</td>
                  <td className="px-4 py-2">{email}</td>
                  <td className="px-4 py-2">
                    {/* MEJORA: Badge de rol con color según tipo (RNF-01 – UX) */}
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold capitalize ${
                        rolColor[role] || "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {role || "user"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {activo === false ? (
                      <span className="text-xs text-red-500 font-medium">Inactivo</span>
                    ) : (
                      <span className="text-xs text-green-600 font-medium">Activo</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex justify-center space-x-2">
                      <button
                        className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1 rounded"
                        onClick={() => abrirModalEditar({ uid, email, role, fullname })}
                        disabled={activo === false}
                      >
                        Editar rol
                      </button>
                      <button
                        className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1 rounded disabled:opacity-40"
                        onClick={() => handleDesactivar({ uid, email })}
                        disabled={activo === false}
                      >
                        Desactivar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE EDICIÓN DE ROL */}
      {usuarioEditando && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-1">Editar Rol</h2>
            <p className="text-sm text-gray-500 mb-4">{usuarioEditando.email}</p>

            <label className="block text-sm font-medium mb-2">Nuevo rol:</label>
            <select
              className="border w-full rounded px-3 py-2 mb-4"
              value={rolSeleccionado}
              onChange={(e) => setRolSeleccionado(e.target.value)}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>

            {feedback && (
              <p
                className={`text-sm mb-3 ${
                  feedback.tipo === "ok" ? "text-green-600" : "text-red-600"
                }`}
              >
                {feedback.mensaje}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => setUsuarioEditando(null)}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                onClick={guardarRol}
                disabled={guardando}
              >
                {guardando ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default UsuariosTable;
