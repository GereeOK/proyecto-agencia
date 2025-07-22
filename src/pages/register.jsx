import Navbar from '../components/navbar';
import Footer from '../components/footer';
import { useRegister } from '../hooks/useRegister';
import { useState } from 'react';

const Register = () => {
  const {
    fullname,
    setFullname,
    email,
    setEmail,
    password,
    setPassword,
    error,
    success,
    register,
  } = useRegister();

  const [isSeller, setIsSeller] = useState(false);
  const [agencia, setAgencia] = useState('');
  const [logoAgencia, setLogoAgencia] = useState('');

  const handleRegister = () => {
    register({ isSeller, agencia, logoAgencia });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow">
        <section className="text-gray-600 body-font">
          <div className="container mx-auto flex px-5 py-24 md:flex-row flex-col items-center">
            <div className="lg:max-w-lg lg:w-full md:w-1/2 w-5/6">
              <img
                className="object-cover object-center rounded"
                alt="register"
                src="../img/login.jpg"
              />
            </div>
            <div className="lg:flex-grow md:w-1/2 lg:pr-24 md:pr-16 flex flex-col md:items-start md:text-left mb-16 md:mb-0 items-center text-center">
              <h1 className="title-font sm:text-4xl text-3xl mb-4 font-medium text-gray-900">
                Crear una cuenta
              </h1>
              <p className="mb-4 leading-relaxed">
                Registrate para descubrir y reservar experiencias únicas en Buenos Aires.
              </p>

              <div className="mb-4 flex gap-4 items-center">
                <label className="text-gray-700 text-sm font-medium">Tipo de cuenta:</label>
                <select
                  value={isSeller ? 'seller' : 'user'}
                  onChange={(e) => setIsSeller(e.target.value === 'seller')}
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option value="user">Usuario</option>
                  <option value="seller">Empresa / Agencia</option>
                </select>
              </div>

              <div className="flex w-full md:justify-start justify-start items-end gap-4 flex-wrap">
                <div className="relative md:w-1/3 w-full">
                  <label htmlFor="fullname" className="leading-7 text-sm text-gray-600">Nombre completo</label>
                  <input
                    type="text"
                    id="fullname"
                    value={fullname}
                    onChange={(e) => setFullname(e.target.value)}
                    className="w-full bg-gray-100 rounded border border-gray-300 focus:ring-2 focus:ring-indigo-200 focus:bg-transparent focus:border-indigo-500 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                    required
                  />
                </div>
                <div className="relative md:w-1/3 w-full">
                  <label htmlFor="email" className="leading-7 text-sm text-gray-600">Email</label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-100 rounded border border-gray-300 focus:ring-2 focus:ring-indigo-200 focus:bg-transparent focus:border-indigo-500 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                    required
                  />
                </div>
                <div className="relative md:w-1/3 w-full">
                  <label htmlFor="password" className="leading-7 text-sm text-gray-600">Contraseña</label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-100 rounded border border-gray-300 focus:ring-2 focus:ring-indigo-200 focus:bg-transparent focus:border-indigo-500 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                    required
                  />
                </div>
              </div>

              {isSeller && (
                <div className="flex w-full flex-wrap gap-4 mt-6">
                  <div className="relative md:w-1/2 w-full">
                    <label htmlFor="agencia" className="leading-7 text-sm text-gray-600">Nombre de la Agencia</label>
                    <input
                      type="text"
                      id="agencia"
                      value={agencia}
                      onChange={(e) => setAgencia(e.target.value)}
                      className="w-full bg-gray-100 rounded border border-gray-300 focus:ring-2 focus:ring-indigo-200 focus:bg-transparent focus:border-indigo-500 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                      required={isSeller}
                    />
                  </div>
                  <div className="relative md:w-1/2 w-full">
                    <label htmlFor="logoAgencia" className="leading-7 text-sm text-gray-600">Logo (opcional)</label>
                    <input
                      type="text"
                      id="logoAgencia"
                      value={logoAgencia}
                      onChange={(e) => setLogoAgencia(e.target.value)}
                      placeholder="URL de la imagen"
                      className="w-full bg-gray-100 rounded border border-gray-300 focus:ring-2 focus:ring-indigo-200 focus:bg-transparent focus:border-indigo-500 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleRegister}
                className="mt-6 inline-flex text-white bg-indigo-500 border-0 py-2 px-6 focus:outline-none hover:bg-indigo-600 rounded text-lg"
              >
                Registrarse
              </button>

              {success && <p className="text-green-600 mt-4">{success}</p>}
              {error && <p className="text-red-500 mt-4">{error}</p>}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Register;
