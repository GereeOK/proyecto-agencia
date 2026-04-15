import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { Link } from "react-router-dom";

const ReservaExitosa = () => {
return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-indigo-50 to-white">
    <Navbar />

    <main className="flex-grow flex flex-col items-center justify-center text-center px-6 py-20">
        <h1 className="text-4xl sm:text-5xl font-bold text-green-600 mb-4 animate-fade-in">
            ¡Tu reserva fue exitosa!
        </h1>
        <p className="text-gray-700 text-lg sm:text-xl max-w-2xl mb-8">
            Gracias por elegir <strong>Baires Essence</strong>. Hemos recibido tu solicitud
            y te contactaremos por email para confirmar todos los detalles.
        </p>

        <Link
            to="/"
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-semibold px-8 py-3 rounded-full transition duration-300 shadow-lg"
        >
        Volver al inicio
        </Link>
    </main>

    <Footer />
    </div>
    );
};

export default ReservaExitosa;
