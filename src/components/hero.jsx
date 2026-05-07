import { useTranslation } from "react-i18next";

const HeroSection = () => {
  const { t } = useTranslation();
  return (
    <section
      className="w-full h-screen bg-[url('/img/img_obelisco-argentina.jpg')] bg-cover bg-center relative flex items-center justify-center"
      id="inicio"
    >
      <div className="absolute inset-0 bg-black/50"></div>
      <div className="relative z-10 text-center px-6 max-w-2xl">
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">BAIRES ESSENCE</h1>
        <p className="text-white text-lg mb-6">{t("hero.subtitulo")}</p>
        <a href="#servicios" className="inline-block text-sm text-white bg-indigo-500 hover:bg-indigo-600 py-2 px-4 rounded">
          {t("hero.verMas")}
        </a>
      </div>
    </section>
  );
};

export default HeroSection;
