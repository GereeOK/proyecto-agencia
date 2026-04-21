import { useState } from "react";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { useAuth } from "../context/authContext";
import usePerfil from "../hooks/usePerfil";
import { useMisReservas } from "../hooks/useMisReservas";
import { ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip } from "recharts";

const COLORS = ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4"];
const formatARS = (n) => Number(n || 0).toLocaleString("es-AR");

// ── Avatar grande con inicial
const Avatar = ({ name, size = "lg" }) => {
  const letra = name?.charAt(0).toUpperCase() || "U";
  const sz = size === "lg" ? "w-20 h-20 text-3xl" : "w-12 h-12 text-xl";
  return (
    <div className={`${sz} bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {letra}
    </div>
  );
};

// ── Stat card
const StatCard = ({ icon, label, value, sub }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
    <div className="text-2xl mb-2">{icon}</div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-sm font-medium text-gray-700 mt-0.5">{label}</p>
    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

const Perfil = () => {
  const { user } = useAuth();
  const {
    companyData, loadingCompany,
    showModal, setShowModal,
    editedName, setEditedName,
    editedLogo, setEditedLogo,
    editedTelefono, setEditedTelefono,
    editedSocial, setEditedSocial,
    openModal, handleSaveChanges,
    servicesCount, reservationsCount,
  } = usePerfil(user);

  const { reservas, loading: loadingReservas } = useMisReservas();

  // Estadísticas del turista calculadas desde sus reservas
  const totalGastado = reservas.reduce((acc, r) => {
    return acc + (r.servicios || []).reduce((a, s) => {
      return a + (Number(s.price || 0) * Number(s.personas || r.personas || 1));
    }, 0);
  }, 0);

  const totalExperiencias = reservas.reduce(
    (acc, r) => acc + (r.servicios || []).length, 0
  );

  const reservasConfirmadas = reservas.filter((r) => r.estado === "confirmada").length;
  const reservasPendientes = reservas.filter((r) => r.estado === "pendiente").length;

  const isSeller = user?.role === "seller";
  const isAdmin  = user?.role === "admin";

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero de perfil */}
      <div className="bg-gray-900 px-4 py-10">
        <div className="container mx-auto max-w-4xl flex items-center gap-5">
          <Avatar name={user?.displayName || user?.email} />
          <div>
            <h1 className="text-2xl font-bold text-white">
              {user?.displayName || user?.email?.split("@")[0]}
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">{user?.email}</p>
            <span className={`inline-block mt-2 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
              isAdmin ? "bg-red-500 text-white" :
              isSeller ? "bg-blue-500 text-white" :
              "bg-indigo-500 text-white"
            }`}>
              {isAdmin ? "Administrador" : isSeller ? "Seller / Agencia" : "Turista"}
            </span>
          </div>
        </div>
      </div>

      <main className="flex-grow container mx-auto max-w-4xl px-4 py-8 space-y-8">

        {/* ── TURISTA: estadísticas de reservas */}
        {!isSeller && !isAdmin && (
          <>
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Resumen de tu actividad</h2>
              {loadingReservas ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1,2,3,4].map((i) => (
                    <div key={i} className="bg-white rounded-2xl h-28 animate-pulse border border-gray-100" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard icon="🧳" label="Reservas totales" value={reservas.length} />
                  <StatCard icon="✅" label="Confirmadas" value={reservasConfirmadas} />
                  <StatCard icon="⏳" label="Pendientes" value={reservasPendientes} />
                  <StatCard icon="🎯" label="Experiencias" value={totalExperiencias} sub={totalGastado > 0 ? `$${formatARS(totalGastado)} invertidos` : undefined} />
                </div>
              )}
            </section>

            {/* Últimas reservas */}
            {reservas.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Últimas reservas</h2>
                <div className="space-y-3">
                  {reservas.slice(0, 3).map((r) => (
                    <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
                      {r.servicios?.[0]?.image && (
                        <img src={r.servicios[0].image} alt=""
                          className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                          onError={(e) => { e.target.style.display = "none"; }} />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {(r.servicios || []).map((s) => s.title).join(", ") || "Reserva"}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{r.checkin} → {r.checkout}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        r.estado === "confirmada" ? "bg-green-100 text-green-700" :
                        r.estado === "cancelada"  ? "bg-red-100 text-red-700"    :
                        "bg-yellow-100 text-yellow-700"
                      }`}>
                        {r.estado || "pendiente"}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* ── SELLER: datos de empresa + gráficos */}
        {isSeller && (
          <>
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Mi Empresa</h2>
                <button onClick={openModal}
                  className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-xl transition-colors">
                  Editar
                </button>
              </div>

              {loadingCompany ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
              ) : companyData ? (
                <div className="flex items-center gap-5">
                  {companyData.logo ? (
                    <img src={companyData.logo} alt="Logo"
                      className="w-20 h-20 object-contain rounded-xl border border-gray-200" />
                  ) : (
                    <div className="w-20 h-20 bg-indigo-50 rounded-xl flex items-center justify-center text-3xl">🏢</div>
                  )}
                  <div className="space-y-1">
                    <p className="text-xl font-bold text-gray-900">{companyData.name}</p>
                    {companyData.telefono && (
                      <p className="text-sm text-gray-600">📞 {companyData.telefono}</p>
                    )}
                    {companyData.social && (
                      <a href={companyData.social} target="_blank" rel="noopener noreferrer"
                        className="text-sm text-indigo-600 hover:underline block">
                        🔗 {companyData.social}
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No se encontró información de empresa.</p>
              )}
            </section>

            {/* Gráficos seller */}
            {(servicesCount.length > 0 || reservationsCount.length > 0) && (
              <section className="grid md:grid-cols-2 gap-6">
                {servicesCount.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="font-bold text-gray-900 mb-4">Servicios más reservados</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={servicesCount} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                          {servicesCount.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {reservationsCount.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="font-bold text-gray-900 mb-4">Reservas por mes</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={reservationsCount}>
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#6366f1" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </section>
            )}
          </>
        )}

        {/* ── ADMIN */}
        {isAdmin && (
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
            <p className="text-4xl mb-3">⚙️</p>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Panel de Administración</h2>
            <p className="text-gray-500 text-sm mb-4">
              Accedé al panel completo para gestionar usuarios, servicios y reservas.
            </p>
            <a href="/admin"
              className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors">
              Ir al panel admin →
            </a>
          </section>
        )}
      </main>

      <Footer />

      {/* Modal editar empresa */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Editar Empresa</h2>
            <div className="space-y-3">
              {[
                { label: "Nombre", val: editedName, set: setEditedName, type: "text" },
                { label: "Logo (URL)", val: editedLogo, set: setEditedLogo, type: "text" },
                { label: "Teléfono", val: editedTelefono, set: setEditedTelefono, type: "tel" },
                { label: "Red social / web", val: editedSocial, set: setEditedSocial, type: "url" },
              ].map(({ label, val, set, type }) => (
                <div key={label}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                  <input type={type} value={val} onChange={(e) => set(e.target.value)}
                    className="w-full border-2 border-gray-200 focus:border-indigo-400 rounded-xl px-3 py-2 text-sm outline-none transition-colors" />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm">
                Cancelar
              </button>
              <button onClick={handleSaveChanges}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Perfil;
