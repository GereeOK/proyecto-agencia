import React, { useState, useEffect } from "react";
import { fetchUsuarios, updateUsuarioRol, desactivarUsuario } from "../firebase/firestore";

const ROLES = ["user", "seller", "admin"];

const rolColor = {
  admin: "bg-red-100 text-red-700",
  seller: "bg-blue-100 text-blue-700",
  user: "bg-green-100 text-green-700",
};

const UsuariosTable = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [rolSeleccionado, setRolSeleccionado] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("todos");
  const [filtroActivo, setFiltroActivo] = useState("todos");

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

  const abrirModalEditar = (usuario) => {
    setUsuarioEditando(usuario);
    setRolSeleccionado(usuario.role || "user");
    setFeedback(null);
  };

  const guardarRol = async () => {
    if (!usuarioEditando) return;
    setGuardando(true);
    try {
      await updateUsuarioRol(usuarioEditando.uid, rolSeleccionado);
      setUsuarios(prev =>
        prev.map(u => u.uid === usuarioEditando.uid ? { ...u, role: rolSeleccionado } : u)
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

  const handleDesactivar = async (usuario) => {
    if (!window.confirm(`¿Desactivar la cuenta de ${usuario.email}? El usuario no podrá iniciar sesión.`)) return;
    try {
      await desactivarUsuario(usuario.uid);
      setUsuarios(prev => prev.map(u => u.uid === usuario.uid ? { ...u, activo: false } : u));
    } catch (err) {
      console.error("Error desactivando usuario:", err);
      alert("No se pudo desactivar el usuario.");
    }
  };

  // Usuarios filtrados
  const usuariosFiltrados = usuarios.filter(u => {
    const texto = busqueda.toLowerCase();
    const matchBusqueda = !texto ||
      (u.fullname || "").toLowerCase().includes(texto) ||
      (u.email || "").toLowerCase().includes(texto);
    const matchRol = filtroRol === "todos" || u.role === filtroRol;
    const matchActivo =
      filtroActivo === "todos" ||
      (filtroActivo === "activo" ? u.activo !== false : u.activo === false);
    return matchBusqueda && matchRol && matchActivo;
  });

  if (loading) return <p className="text-center py-10">Cargando usuarios...</p>;

  return (
    <section className="text-gray-600 body-font">
      <div className="container px-4 py-8 mx-auto">
        <div className="flex flex-col text-center w-full mb-6">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Usuarios</h1>
          <p className="text-gray-600 text-base">Listado de usuarios. Podés editar roles o desactivar cuentas.</p>
        </div>

        {/* Barra de filtros */}
        <div className="flex flex-wrap gap-3 mb-6 items-center">
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
          <select
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={filtroRol}
            onChange={e => setFiltroRol(e.target.value)}
          >
            <option value="todos">Todos los roles</option>
            <option value="user">Turista</option>
            <option value="seller">Seller</option>
            <option value="admin">Admin</option>
          </select>
          <select
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={filtroActivo}
            onChange={e => setFiltroActivo(e.target.value)}
          >
            <option value="todos">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
          <span className="text-sm text-gray-500 whitespace-nowrap">
            {usuariosFiltrados.length} resultado/s
          </span>
          {(busqueda || filtroRol !== "todos" || filtroActivo !== "todos") && (
            <button
              className="text-sm text-indigo-600 hover:underline"
              onClick={() => { setBusqueda(""); setFiltroRol("todos"); setFiltroActivo("todos"); }}
            >
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="w-full overflow-x-auto">
          <table className="table-auto w-full text-left">
            <thead>
              <tr>
                <th className="px-4 py-2 bg-gray-100 text-sm font-medium text-gray-900">Nombre</th>
                <th className="px-4 py-2 bg-gray-100 text-sm font-medium text-gray-900">Email</th>
                <th className="px-4 py-2 bg-gray-100 text-sm font-medium text-gray-900">Rol</th>
                <th className="px-4 py-2 bg-gray-100 text-sm font-medium text-gray-900">Estado</th>
                <th className="px-4 py-2 bg-gray-100 text-sm font-medium text-gray-900 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400">
                    No hay usuarios que coincidan con los filtros
                  </td>
                </tr>
              )}
              {usuariosFiltrados.map(({ uid, email, role, activo, fullname }) => (
                <tr key={uid} className={`border-t ${activo === false ? "opacity-50" : ""}`}>
                  <td className="px-4 py-2">{fullname || email?.split("@")[0]}</td>
                  <td className="px-4 py-2">{email}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold capitalize ${rolColor[role] || "bg-gray-100 text-gray-600"}`}>
                      {role || "user"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {activo === false
                      ? <span className="text-xs text-red-500 font-medium">Inactivo</span>
                      : <span className="text-xs text-green-600 font-medium">Activo</span>
                    }
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

      {/* MODAL EDITAR ROL */}
      {usuarioEditando && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-1">Editar Rol</h2>
            <p className="text-sm text-gray-500 mb-4">{usuarioEditando.email}</p>

            <label className="block text-sm font-medium mb-2">Nuevo rol:</label>
            <select
              className="border w-full rounded px-3 py-2 mb-4"
              value={rolSeleccionado}
              onChange={e => setRolSeleccionado(e.target.value)}
            >
              {ROLES.map(r => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>

            {feedback && (
              <p className={`text-sm mb-3 ${feedback.tipo === "ok" ? "text-green-600" : "text-red-600"}`}>
                {feedback.mensaje}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300" onClick={() => setUsuarioEditando(null)}>
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
