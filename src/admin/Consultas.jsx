import React, { useState, useEffect } from "react";
import { fetchConsultas } from "../firebase/firestore";
import emailjs from "@emailjs/browser";
import { toast } from "sonner";

const ModalResponder = ({ consulta, onClose }) => {
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);

  const handleEnviar = async () => {
    if (!mensaje.trim()) { toast.error("Escribí un mensaje"); return; }
    setEnviando(true);
    try {
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID ?? "service_ral2qg6",
        import.meta.env.VITE_EMAILJS_TEMPLATE_REPLY_ID ?? import.meta.env.VITE_EMAILJS_TEMPLATE_ID ?? "template_d7ur9ui",
        {
          to_email: consulta.email,
          to_name: consulta.name,
          reply_message: mensaje,
          consulta_original: consulta.message,
        },
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY ?? "0kKUvcRprhD41WOD2"
      );
      toast.success(`Respuesta enviada a ${consulta.email}`);
      onClose();
    } catch (err) {
      console.error("Error enviando respuesta:", err);
      toast.error("No se pudo enviar por EmailJS — abriendo cliente de mail");
      window.open(
        `mailto:${consulta.email}?subject=Respuesta a tu consulta en Baires Essence&body=${encodeURIComponent(mensaje)}`,
        "_blank"
      );
      onClose();
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold text-gray-900 mb-1">Responder a {consulta.name}</h3>
        <p className="text-xs text-gray-500 mb-4">
          Se enviará a: <span className="font-medium text-gray-700">{consulta.email}</span>
        </p>

        <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 mb-4">
          <p className="text-xs text-gray-500 font-medium mb-1">Consulta original</p>
          <p className="text-sm text-gray-700">{consulta.message}</p>
        </div>

        <textarea
          rows={5}
          placeholder="Escribí tu respuesta..."
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />

        <div className="flex gap-2 mt-4">
          <button type="button" onClick={handleEnviar} disabled={enviando}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition-colors">
            {enviando ? "Enviando..." : "Enviar respuesta"}
          </button>
          <button type="button" onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-100 transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

const Consultas = () => {
  const [consultas, setConsultas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [respondiendo, setRespondiendo] = useState(null);

  useEffect(() => {
    fetchConsultas()
      .then(setConsultas)
      .catch((err) => console.error("Error cargando consultas:", err))
      .finally(() => setLoading(false));
  }, []);

  const consultasFiltradas = consultas.filter((c) => {
    if (!busqueda) return true;
    const texto = busqueda.toLowerCase();
    return (
      (c.name || "").toLowerCase().includes(texto) ||
      (c.email || "").toLowerCase().includes(texto) ||
      (c.message || "").toLowerCase().includes(texto)
    );
  });

  if (loading) return <p className="text-center py-10">Cargando consultas...</p>;

  return (
    <section className="text-gray-600 body-font">
      <div className="container px-4 py-8 mx-auto">
        <div className="flex flex-col text-center w-full mb-6">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Consultas</h1>
          <p className="text-gray-600 text-base">Mensajes enviados desde el formulario de contacto.</p>
        </div>

        <div className="flex flex-wrap gap-3 mb-6 items-center">
          <input
            type="text"
            placeholder="Buscar por nombre, email o mensaje..."
            className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[250px] focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <span className="text-sm text-gray-500 whitespace-nowrap">
            {consultasFiltradas.length} resultado/s
          </span>
          {busqueda && (
            <button className="text-sm text-indigo-600 hover:underline" onClick={() => setBusqueda("")}>
              Limpiar
            </button>
          )}
        </div>

        <div className="w-full overflow-x-auto">
          <table className="table-auto w-full text-left border">
            <thead>
              <tr>
                <th className="px-4 py-2 bg-gray-100 text-sm font-medium text-gray-900 rounded-tl">Nombre</th>
                <th className="px-4 py-2 bg-gray-100 text-sm font-medium text-gray-900">Email</th>
                <th className="px-4 py-2 bg-gray-100 text-sm font-medium text-gray-900">Mensaje</th>
                <th className="px-4 py-2 bg-gray-100 text-sm font-medium text-gray-900 rounded-tr text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {consultasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-400">
                    {busqueda ? "No hay consultas que coincidan" : "No hay consultas registradas"}
                  </td>
                </tr>
              )}
              {consultasFiltradas.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="px-4 py-2 text-sm">{c.name}</td>
                  <td className="px-4 py-2 text-sm text-gray-500">{c.email}</td>
                  <td className="px-4 py-2 text-sm max-w-xs">{c.message}</td>
                  <td className="px-4 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => setRespondiendo(c)}
                      className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm px-4 py-1.5 rounded-lg transition-colors">
                      Responder
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {respondiendo && (
        <ModalResponder consulta={respondiendo} onClose={() => setRespondiendo(null)}/>
      )}
    </section>
  );
};

export default Consultas;
