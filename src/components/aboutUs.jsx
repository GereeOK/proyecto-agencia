import { useTranslation } from "react-i18next";

const AboutUs = () => {
  const { t } = useTranslation();
  return (
    <section id="nosotros" className="text-gray-600 body-font">
      <div className="container mx-auto flex px-5 py-24 md:flex-row flex-col items-center">
        <div className="lg:max-w-lg lg:w-full md:w-1/2 w-5/6 mb-10 md:mb-0">
          <img className="object-cover object-center rounded" alt="nosotros" src="../img/nosotros.jpg" />
        </div>
        <div className="lg:flex-grow md:w-1/2 lg:pl-24 md:pl-16 flex flex-col md:items-start md:text-left items-center text-center">
          <h1 className="title-font sm:text-4xl text-3xl mb-2 font-medium text-gray-900">
            {t("nosotros.titulo")}
          </h1><br />
          <div className="h-1 w-24 bg-primary-500 rounded self-start mb-6"></div>
          <p className="mb-8 leading-relaxed">{t("nosotros.descripcion")}</p>
        </div>
      </div>
    </section>
  );
};

export default AboutUs;
