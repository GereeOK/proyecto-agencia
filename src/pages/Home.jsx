import { useEffect } from "react";
import Navbar from "../components/navbar";
import HeroSection from "../components/hero";
import AboutUs from "../components/aboutUs";
import Cards from "../components/services";
import Testimonials from "../components/testimonial";
import ContactUs from "../components/contact";
import Footer from "../components/footer";

const scrollToSection = (id) => {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: "smooth" });
  }
};

const Home = () => {
  useEffect(() => {
    const targetId = sessionStorage.getItem("scrollTo");
    if (targetId) {
      setTimeout(() => scrollToSection(targetId), 100);
      sessionStorage.removeItem("scrollTo");
    }
  }, []);

  return (
    <>
      <Navbar />
      <section id="inicio">
        <HeroSection />
      </section>
      <section id="nosotros">
        <AboutUs />
      </section>
      <section id="servicios">
        <Cards />
      </section>
      <section id="opiniones">
        <Testimonials />
      </section>
      <section id="contacto">
        <ContactUs />
      </section>
      <Footer />
    </>
  );
};

export default Home;