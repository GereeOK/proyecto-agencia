import { useState, useEffect } from "react";
import { toast } from "sonner";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { useAuth } from "../context/authContext";
import usePerfil from "../hooks/usePerfil";
import { useMisReservas } from "../hooks/useMisReservas";
import { getGrupoFamiliar, saveGrupoFamiliar } from "../firebase/firestore";
import { ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip } from "recharts";

const COLORS = ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4"];
const formatARS = (n) => Number(n || 0).toLocaleString("es-AR");

const RELACIONES = ["Cónyuge / Pareja", "Hijo/a", "Padre / Madre", "Hermano/a", "Abuelo/a", "Amigo/a", "Otro"];

const MIEMBRO_VACIO = { nombre: "", dni: "", fechaNacimiento: "", relacion: "" };

const Avatar = ({ name, size = "lg" }) => {
  const letra = name?.charAt(0).toUpperCase() || "U";
  const sz = size === "lg" ? "w-20 h-20 text-3xl" : "w-10 h-10 text-lg";
  return (
    <div className={`${sz} bg-primary-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {letra}
    </div>
  );
};

const StatCard = ({ icon, label, value, sub }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
    <div className="text-2xl mb-2">{icon}</div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-sm font-medium text-gray-700 mt-0.5">{label}</p>
    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

// ── Input genérico reutilizable
const Field = ({ label, required, children }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-600 mb-1">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300";

// ── Modal para agregar / editar miembro
const ModalMiembro = ({ miembro, onSave, onClose }) => {
  const [form, setForm] = useState(miembro || MIEMBRO_VACIO);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col">
        <div className="bg-gray-900 text-white px-5 py-4 rounded-t-2xl flex items-center justify-between">
          <h2 className="text-sm font-semibold">{miembro?.id ? "Editar integrante" : "Agregar integrante"}</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <Field label="Nombre y apellido" required>
            <input className={inputCls} value={form.nombre} onChange={e => set("nombre", e.target.value)} placeholder="Ej: María García" required />
          </Field>
          <Field label="DNI">
            <input className={inputCls} value={form.dni} onChange={e => set("dni", e.target.value)} placeholder="Ej: 30.123.456" />
          </Field>
          <Field label="Fecha de nacimiento">
            <input type="date" className={inputCls} value={form.fechaNacimiento} onChange={e => set("fechaNacimiento", e.target.value)} />
          </Field>
          <Field label="Relación">
            <select className={inputCls} value={form.relacion} onChange={e => set("relacion", e.target.value)}>
              <option value="">Sin especificar</option>
              {RELACIONES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm transition-colors">
              Cancelar
            </button>
            <button type="submit"
              className="flex-1 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm transition-colors">
              {miembro?.id ? "Guardar" : "Agregar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Sección Grupo Familiar (solo turistas)
const GrupoFamiliar = ({ userId }) => {
  const [miembros, setMiembros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);

  useEffect(() => {
    getGrupoFamiliar(userId).then(data => {
      setMiembros(data);
      setLoading(false);
    });
  }, [userId]);

  const persist = async (nuevos) => {
    setMiembros(nuevos);
    await saveGrupoFamiliar(userId, nuevos);
  };

  const handleSave = async (form) => {
    let nuevos;
    if (form.id) {
      // editar existente
      nuevos = miembros.map(m => m.id === form.id ? form : m);
      toast.success("Integrante actualizado");
    } else {
      // agregar nuevo
      const nuevo = { ...form, id: `${Date.now()}` };
      nuevos = [...miembros, nuevo];
      toast.success("Integrante agregado al grupo familiar", { description: form.nombre });
    }
    await persist(nuevos);
    setModalOpen(false);
    setEditando(null);
  };

  const handleEliminar = async (id) => {
    const nuevos = miembros.filter(m => m.id !== id);
    await persist(nuevos);
    toast.info("Integrante eliminado del grupo familiar");
  };

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return null;
    const hoy = new Date();
    const nac = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
    return edad;
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Grupo familiar / Acompañantes</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Cargá los datos de tus acompañantes habituales para agilizar futuras reservas.
          </p>
        </div>
        <button
          onClick={() => { setEditando(null); setModalOpen(true); }}
          className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Agregar
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1,2].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : miembros.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
          <p className="text-3xl mb-2">👨‍👩‍👧</p>
          <p className="text-sm font-medium text-gray-700">No hay integrantes cargados</p>
          <p className="text-xs text-gray-400 mt-1">Podés agregarlos acá o directamente al crear una reserva.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {miembros.map(m => {
            const edad = calcularEdad(m.fechaNacimiento);
            return (
              <div key={m.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0">
                  {m.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{m.nombre}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {[m.relacion, m.dni && `DNI ${m.dni}`, edad != null && `${edad} años`].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => { setEditando(m); setModalOpen(true); }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-primary-50 text-gray-400 hover:text-primary-600 transition-colors"
                    title="Editar"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.071-6.071a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleEliminar(m.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    title="Eliminar"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <ModalMiembro
          miembro={editando}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditando(null); }}
        />
      )}
    </section>
  );
};

// ── Componente principal
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

  const totalGastado = reservas.reduce((acc, r) =>
    acc + (r.servicios || []).reduce((a, s) =>
      a + (Number(s.price || 0) * Number(s.personas || r.personas || 1)), 0), 0);

  const totalExperiencias = reservas.reduce((acc, r) => acc + (r.servicios || []).length, 0);
  const reservasConfirmadas = reservas.filter(r => r.estado === "confirmada").length;
  const reservasPendientes  = reservas.filter(r => r.estado === "pendiente").length;

  const isSeller = user?.role === "seller";
  const isAdmin  = user?.role === "admin";
  const isTurista = !isSeller && !isAdmin;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero */}
      <div className="bg-gray-900 px-4 py-10">
        <div className="container mx-auto max-w-4xl flex items-center gap-5">
          <Avatar name={user?.displayName || user?.email} />
          <div>
            <h1 className="text-2xl font-bold text-white">
              {user?.displayName || user?.email?.split("@")[0]}
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">{user?.email}</p>
            <span className={`inline-block mt-2 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
              isAdmin  ? "bg-red-500 text-white"    :
              isSeller ? "bg-blue-500 text-white"   :
                         "bg-primary-500 text-white"
            }`}>
              {isAdmin ? "Administrador" : isSeller ? "Seller / Agencia" : "Turista"}
            </span>
          </div>
        </div>
      </div>

      <main className="flex-grow container mx-auto max-w-4xl px-4 py-8 space-y-8">

        {/* ── TURISTA */}
        {isTurista && (
          <>
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Resumen de tu actividad</h2>
              {loadingReservas ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1,2,3,4].map(i => <div key={i} className="bg-white rounded-2xl h-28 animate-pulse border border-gray-100" />)}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard icon="🧳" label="Reservas totales" value={reservas.length} />
                  <StatCard icon="✅" label="Confirmadas" value={reservasConfirmadas} />
                  <StatCard icon="⏳" label="Pendientes" value={reservasPendientes} />
                  <StatCard icon="🎯" label="Experiencias" value={totalExperiencias}
                    sub={totalGastado > 0 ? `$${formatARS(totalGastado)} invertidos` : undefined} />
                </div>
              )}
            </section>

            {reservas.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Últimas reservas</h2>
                <div className="space-y-3">
                  {reservas.slice(0, 3).map(r => (
                    <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
                      {r.servicios?.[0]?.image && (
                        <img src={r.servicios[0].image} alt=""
                          className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                          onError={e => { e.target.style.display = "none"; }} />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {(r.servicios || []).map(s => s.title).join(", ") || "Reserva"}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{r.checkin} → {r.checkout}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        r.estado === "confirmada"         ? "bg-green-100 text-green-700"  :
                        r.estado === "confirmada_usuario" ? "bg-blue-100 text-blue-700"    :
                        r.estado === "cancelada"          ? "bg-red-100 text-red-700"       :
                        r.estado === "pagada"             ? "bg-purple-100 text-purple-700" :
                                                            "bg-yellow-100 text-yellow-700"
                      }`}>
                        {r.estado === "confirmada_usuario" ? "esperando seller" : (r.estado || "pendiente")}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Grupo familiar */}
            <GrupoFamiliar userId={user.uid} />
          </>
        )}

        {/* ── SELLER */}
        {isSeller && (
          <>
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Mi Empresa</h2>
                <button onClick={openModal}
                  className="text-sm bg-primary-600 hover:bg-primary-700 text-white px-4 py-1.5 rounded-xl transition-colors">
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
                    <div className="w-20 h-20 bg-primary-50 rounded-xl flex items-center justify-center text-3xl">🏢</div>
                  )}
                  <div className="space-y-1">
                    <p className="text-xl font-bold text-gray-900">{companyData.name}</p>
                    {companyData.telefono && <p className="text-sm text-gray-600">📞 {companyData.telefono}</p>}
                    {companyData.social && (
                      <a href={companyData.social} target="_blank" rel="noopener noreferrer"
                        className="text-sm text-primary-600 hover:underline block">
                        🔗 {companyData.social}
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No se encontró información de empresa.</p>
              )}
            </section>

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
              className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors">
              Ir al panel admin →
            </a>
          </section>
        )}
      </main>

      <Footer />

      {/* Modal editar empresa (seller) */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Editar Empresa</h2>
            <div className="space-y-3">
              {[
                { label: "Nombre",          val: editedName,     set: setEditedName,     type: "text" },
                { label: "Logo (URL)",       val: editedLogo,     set: setEditedLogo,     type: "text" },
                { label: "Teléfono",         val: editedTelefono, set: setEditedTelefono, type: "tel"  },
                { label: "Red social / web", val: editedSocial,   set: setEditedSocial,   type: "url"  },
              ].map(({ label, val, set, type }) => (
                <div key={label}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                  <input type={type} value={val} onChange={e => set(e.target.value)}
                    className="w-full border-2 border-gray-200 focus:border-primary-400 rounded-xl px-3 py-2 text-sm outline-none transition-colors" />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm">
                Cancelar
              </button>
              <button onClick={handleSaveChanges}
                className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm">
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
