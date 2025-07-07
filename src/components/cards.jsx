import { useEffect, useState } from "react";
import { useAuth } from "../context/authContext";
import { useNavigate } from "react-router-dom";
import { fetchServicios } from "../firebase/firestore";

const Cards = () => {
  const [cards, setCards] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const cargarServicios = async () => {
      const data = await fetchServicios();
      setCards(data);
    };
    cargarServicios();
  }, []);

  const handleReservarClick = () => {
    if (user) {
      navigate("/reservas");
    } else {
      navigate("/login");
    }
  };

  return (
    <section id="servicios" className="text-gray-600 body-font">
      <div className="container px-5 py-24 mx-auto">
        <div className="w-full text-center mb-10">
          <h1 className="sm:text-3xl text-2xl font-medium title-font mb-2 text-gray-900">
            Servicios
          </h1>
          <p className="text-gray-500">Experiencias únicas en Buenos Aires y alrededores.</p>
          <div className="h-1 w-20 bg-indigo-500 rounded mx-auto mt-4"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <div key={card.id} className="bg-gray-100 p-6 rounded-lg">
              <img
                className="h-40 rounded w-full object-cover object-center mb-6"
                src={card.image}
                alt={card.title}
              />
              <h2 className="text-lg text-gray-900 font-medium title-font mb-2">{card.title}</h2>
              <p className="leading-relaxed text-base mb-4">{card.description}</p>
              <div className="flex justify-end">
                <button
                  onClick={handleReservarClick}
                  className="text-white bg-indigo-500 hover:bg-indigo-600 py-2 px-4 rounded text-sm"
                >
                  Reservar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Cards;
