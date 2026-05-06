import React, { useState, useEffect } from "react";
import { fetchResenasAdmin, updateResena } from "../firebase/firestore";
import emailjs from "@emailjs/browser";
import { toast } from "sonner";

const TIPO_LABEL = {
  experiencia: "Experiencia",
  empresa: "Empresa",
  plataforma: "Plataforma",
};

const StarDisplay = ({ n }) => (
  <span className="text-base">
    {"⭐".repeat(n)}{"☆".repeat(5 - n)}
    <span className="ml-1 text-xs text-gray-500">{n}/5</span>
  </span>
);

const ModalResponder = ({ resena, onClose, onEnviado }) => {
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);

  const handleEnviar = async () => {
    if (!mensaje.trim()) { toast.error("Escribí un mensaje"); return; }
    setEnviando(true);
    try {
      if (resena.userEmail) {
        await emailjs.send(
          import.meta.env.VITE_EMAILJS_SERVICE_ID ?? "service_ral2qg6",
          import.meta.env.VITE_EMAILJS_TEMPLATE_REPLY_ID ?? import.meta.env.VITE_EMAILJS_TEMPLATE_ID ?? "template_d7ur9ui",
          {
            to_email: resena.userEmail,
            to_name: resena.userName || "Usuario",
            reply_message: mensaje,
            resena_texto: resena.texto || "(sin texto)",
            referencia_nombre: resena.referenciaNombre || "",
          },
          import.meta.env.VITE_EMAILJS_PUBLIC_KEY ?? "0kKUvcRprhD41WOD2"
        );
      }
      await updateResena(resena.id, { respuesta: mensaje });
      toast.success(resena.userEmail ? "Respuesta enviada por mail" : "Respuesta guardada (sin email del usuario)");
      onEnviado(resena.id, mensaje);
      onClose();
    } catch (err) {
      console.error("Error enviando respuesta:", err);
      toast.error("No se pudo enviar por EmailJS");
      // Fallback: abrir cliente de mail
      if (resena.userEmail) {
        window.open(
          `mailto:${resena.userEmail}?subject=Respuesta a tu reseña en Baires Essence&body=${encodeURIComponent(mensaje)}`,
          "_blank"
        );
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold text-gray-900 mb-1">Responder a {resena.userName}</h3>
        <p className="text-xs text-gray-500 mb-3">
          {resena.userEmail
            ? <>Se enviará a: <span className="font-medium text-gray-700">{resena.userEmail}</span></>
            : <span className="text-amber-600">Esta reseña no tiene email guardado — no se podrá enviar por mail.</span>}
        </p>

        <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 mb-4">
          <p className="text-xs text-gray-500 mb-1 font-medium">Reseña original</p>
          <StarDisplay n={resena.estrellas}/>
          {resena.texto && <p className="text-sm text-gray-700 mt-1 italic">"{resena.texto}"</p>}
          {resena.referenciaNombre && (
            <p className="text-xs text-gray-400 mt-1">{TIPO_LABEL[resena.tipo] || resena.tipo}: {resena.referenciaNombre}</p>
          )}
        </div>

        <textarea
          rows={4}
          placeholder="Escribí tu respuesta al usuario (podés ofrecer una bonificación, pedir más detalles, etc.)..."
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

const ResenasAdmin = () => {
  const [resenas, setResenas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState("todas");
  const [filtroEstrellas, setFiltroEstrellas] = useState("todas");
  const [filtroVisibilidad, setFiltroVisibilidad] = useState("todas");
  const [respondiendo, setRespondiendo] = useState(null);

  const cargar = async () => {
    setLoading(true);
    try {
      const data = await fetchResenasAdmin();
      // Auto-ocultar reseñas con menos de 3 estrellas que aún no tienen el campo `oculto`
      const updates = [];
      const procesadas = data.map((r) => {
        if (r.oculto === undefined && r.estrellas < 3) {
          updates.push(updateResena(r.id, { oculto: true }));
          return { ...r, oculto: true };
        }
        return r;
      });
      if (updates.length) await Promise.all(updates);
      setResenas(procesadas);
    } catch (err) {
      console.error(err);
      toast.error("No se pudieron cargar las reseñas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const toggleOculto = async (resena) => {
    const nuevo = !resena.oculto;
    try {
      await updateResena(resena.id, { oculto: nuevo });
      setResenas((prev) => prev.map((r) => r.id === resena.id ? { ...r, oculto: nuevo } : r));
      toast.success(nuevo ? "Reseña ocultada" : "Reseña ahora visible");
    } catch (err) {
      toast.error("No se pudo actualizar");
    }
  };

  const handleEnviado = (id, respuesta) => {
    setResenas((prev) => prev.map((r) => r.id === id ? { ...r, respuesta } : r));
  };

  const filtradas = resenas.filter((r) => {
    if (filtroTipo !== "todas" && r.tipo !== filtroTipo) return false;
    if (filtroEstrellas !== "todas" && r.estrellas !== Number(filtroEstrellas)) return false;
    if (filtroVisibilidad === "visibles" && r.oculto) return false;
    if (filtroVisibilidad === "ocultas" && !r.oculto) return false;
    return true;
  });

  const visiblesCount = resenas.filter((r) => !r.oculto).length;
  const ocultasCount = resenas.filter((r) => r.oculto).length;

  return (
    <section>
      <div className="container px-4 py-8 mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-6 gap-3">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Reseñas</h1>
            <p className="text-gray-500 text-sm mt-1">
              {resenas.length} total · {visiblesCount} visibles · {ocultasCount} ocultas
              <span className="ml-2 text-xs text-amber-600">Las {"<"}3 ⭐ se ocultan automáticamente</span>
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 mb-6">
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
            <option value="todas">Todos los tipos</option>
            <option value="experiencia">Experiencia</option>
            <option value="empresa">Empresa</option>
            <option value="plataforma">Plataforma</option>
          </select>

          <select value={filtroEstrellas} onChange={(e) => setFiltroEstrellas(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
            <option value="todas">Todas las estrellas</option>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>{n} ⭐</option>
            ))}
          </select>

          <select value={filtroVisibilidad} onChange={(e) => setFiltroVisibilidad(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
            <option value="todas">Visibles y ocultas</option>
            <option value="visibles">Solo visibles</option>
            <option value="ocultas">Solo ocultas</option>
          </select>

          <span className="text-sm text-gray-500 self-center">{filtradas.length} resultado/s</span>
        </div>

        {/* Lista */}
        {loading ? (
          <p className="text-center py-10 text-gray-400">Cargando reseñas...</p>
        ) : filtradas.length === 0 ? (
          <p className="text-center py-10 text-gray-400">No hay reseñas con esos filtros.</p>
        ) : (
          <div className="space-y-3">
            {filtradas.map((r) => (
              <div key={r.id}
                className={`bg-white border rounded-xl p-4 flex flex-col sm:flex-row gap-4 transition-opacity ${r.oculto ? "opacity-60 border-dashed" : ""}`}>

                {/* Info de la reseña */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                      {TIPO_LABEL[r.tipo] || r.tipo}
                    </span>
                    {r.oculto && (
                      <span className="text-xs font-semibold bg-red-50 text-red-500 px-2 py-0.5 rounded-full">Oculta</span>
                    )}
                    {r.respuesta && (
                      <span className="text-xs font-semibold bg-green-50 text-green-600 px-2 py-0.5 rounded-full">Respondida</span>
                    )}
                    <span className="text-xs text-gray-400">
                      {r.timestamp?.toDate?.().toLocaleDateString("es-AR") || ""}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-gray-800">
                    {r.userName || "Usuario"}
                    {r.userEmail && <span className="font-normal text-gray-400 ml-1">— {r.userEmail}</span>}
                  </p>
                  {r.referenciaNombre && (
                    <p className="text-xs text-gray-400 mb-1">{r.referenciaNombre}</p>
                  )}

                  <StarDisplay n={r.estrellas}/>

                  {r.texto && (
                    <p className="text-sm text-gray-600 mt-1 italic">"{r.texto}"</p>
                  )}

                  {r.respuesta && (
                    <div className="mt-2 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2 text-xs text-indigo-800">
                      <span className="font-semibold">Respuesta enviada: </span>{r.respuesta}
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex flex-row sm:flex-col gap-2 flex-shrink-0 sm:min-w-[110px]">
                  <button
                    type="button"
                    onClick={() => toggleOculto(r)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      r.oculto
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-red-100 text-red-600 hover:bg-red-200"
                    }`}>
                    {r.oculto ? "Mostrar" : "Ocultar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRespondiendo(r)}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors">
                    {r.respuesta ? "Re-responder" : "Responder"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {respondiendo && (
        <ModalResponder
          resena={respondiendo}
          onClose={() => setRespondiendo(null)}
          onEnviado={handleEnviado}
        />
      )}
    </section>
  );
};

export default ResenasAdmin;
