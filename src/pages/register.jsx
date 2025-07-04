import Navbar from '../components/navbar';
import Footer from '../components/footer';
import { useRegister } from '../hooks/useRegister';  // Asumiendo que lo guardaste en src/hooks/useRegister.js

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
              <p className="mb-8 leading-relaxed">
                Registrate para descubrir y reservar experiencias únicas en Buenos Aires.
              </p>

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

              <button
                onClick={register}
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
