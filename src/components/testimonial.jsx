import { useEffect, useState } from "react";
import { getResenasRecientes } from "../firebase/firestore";
import { useTranslation } from "react-i18next";

const Estrellas = ({ n }) => (
  <span className="text-yellow-400 text-base tracking-tight">
    {"★".repeat(n)}
    <span className="text-gray-200">{"★".repeat(5 - n)}</span>
  </span>
);

const Avatar = ({ nombre }) => (
  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
    <span className="text-indigo-600 font-bold text-lg">
      {(nombre || "?")[0].toUpperCase()}
    </span>
  </div>
);

const Testimonials = () => {
  const { t } = useTranslation();
  const [resenas, setResenas] = useState([]);
  const [loading, setLoading] = useState(true);

  const TIPO_LABEL = {
    experiencia: t("testimonios.tipoExperiencia"),
    empresa:     t("testimonios.tipoEmpresa"),
    plataforma:  t("testimonios.tipoPlataforma"),
  };

  useEffect(() => {
    getResenasRecientes(50)
      .then((data) => {
        const shuffled = data.sort(() => Math.random() - 0.5);
        setResenas(shuffled.slice(0, 3));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="opiniones" className="text-gray-600 body-font bg-white">
      <div className="container px-5 py-24 mx-auto">
        <div className="w-full text-center mb-12">
          <h2 className="sm:text-3xl text-2xl font-medium title-font mb-2 text-gray-900">
            {t("testimonios.titulo")}
          </h2>
          <p className="text-gray-500 text-sm">{t("testimonios.subtitulo")}</p>
          <div className="h-1 w-20 bg-indigo-500 rounded mx-auto mt-4" />
        </div>

        {loading ? (
          <div className="flex flex-wrap -m-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="lg:w-1/3 w-full p-4">
                <div className="bg-gray-50 rounded-2xl p-6 animate-pulse h-44" />
              </div>
            ))}
          </div>
        ) : resenas.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">
            {t("testimonios.sinResenias")}
          </p>
        ) : (
          <div className="flex flex-wrap -m-4">
            {resenas.map((r) => (
              <div key={r.id} className="lg:w-1/3 w-full p-4">
                <div className="h-full bg-gray-50 rounded-2xl p-6 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <Estrellas n={r.estrellas} />
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {TIPO_LABEL[r.tipo] || r.tipo}
                    </span>
                  </div>
                  <p className="leading-relaxed text-gray-700 text-sm flex-1">
                    "{r.texto || t("testimonios.sinComentario")}"
                  </p>
                  <span className="block h-px w-10 bg-indigo-400 rounded" />
                  <div className="flex items-center gap-3">
                    <Avatar nombre={r.userName} />
                    <div>
                      <p className="text-gray-900 font-medium text-sm">{r.userName}</p>
                      <p className="text-gray-400 text-xs">{r.referenciaNombre}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Testimonials;
