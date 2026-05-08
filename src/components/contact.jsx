import { useState } from "react";
import { sendConsulta } from "../firebase/firestore";
import { useTranslation } from "react-i18next";

const ContactUs = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await sendConsulta(formData);
      setStatus(t("contacto.exito"));
      setFormData({ name: "", email: "", message: "" });
    } catch (error) {
      console.error("Error al enviar consulta:", error);
      setStatus(t("contacto.error"));
    }
  };

  const inputCls = "w-full bg-gray-800 bg-opacity-40 rounded border border-gray-700 focus:border-primary-500 focus:bg-gray-900 focus:ring-2 focus:ring-primary-900 text-base outline-none text-gray-100 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out";

  return (
    <section id="contacto" className="text-gray-400 bg-gray-900 body-font relative">
      <div className="container px-5 py-24 mx-auto">
        <div className="flex flex-col text-center w-full mb-12">
          <h1 className="sm:text-3xl text-2xl font-medium title-font mb-4 text-white">{t("contacto.titulo")}</h1>
          <p className="lg:w-2/3 mx-auto leading-relaxed text-base">{t("contacto.subtitulo")}</p>
        </div>
        <form onSubmit={handleSubmit} className="lg:w-1/2 md:w-2/3 mx-auto">
          <div className="flex flex-wrap -m-2">
            <div className="p-2 w-1/2">
              <div className="relative">
                <label htmlFor="name" className="leading-7 text-sm text-gray-400">{t("contacto.nombre")}</label>
                <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className={inputCls} />
              </div>
            </div>
            <div className="p-2 w-1/2">
              <div className="relative">
                <label htmlFor="email" className="leading-7 text-sm text-gray-400">{t("contacto.email")}</label>
                <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required className={inputCls} />
              </div>
            </div>
            <div className="p-2 w-full">
              <div className="relative">
                <label htmlFor="message" className="leading-7 text-sm text-gray-400">{t("contacto.mensaje")}</label>
                <textarea id="message" name="message" value={formData.message} onChange={handleChange} required
                  className="w-full bg-gray-800 bg-opacity-40 rounded border border-gray-700 focus:border-primary-500 focus:bg-gray-900 focus:ring-2 focus:ring-primary-900 h-32 text-base outline-none text-gray-100 py-1 px-3 resize-none leading-6 transition-colors duration-200 ease-in-out"
                />
              </div>
            </div>
            <div className="p-2 w-full">
              <button type="submit" className="flex mx-auto text-white bg-primary-500 border-0 py-2 px-8 focus:outline-none hover:bg-primary-600 rounded text-lg">
                {t("contacto.enviar")}
              </button>
            </div>
            {status && <div className="p-2 w-full text-center text-sm text-green-400">{status}</div>}
          </div>
        </form>
      </div>
    </section>
  );
};

export default ContactUs;
