import React, { useEffect, useState } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";

const Dashboard = () => {
  const [serviciosMasVendidos, setServiciosMasVendidos] = useState([]);
  const [reservasPorMes, setReservasPorMes] = useState([]);
  const [mesesDisponibles, setMesesDisponibles] = useState([]);
  const [mesSeleccionado, setMesSeleccionado] = useState("");
  const [totalReservas, setTotalReservas] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const reservasSnap = await getDocs(collection(db, "reservas"));
      const serviciosSnap = await getDocs(collection(db, "servicios"));

      const reservas = reservasSnap.docs.map(doc => doc.data());
      const servicios = serviciosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      setTotalReservas(reservas.length);

      // --- Meses únicos para selector ---
      const mesesUnicos = new Set();
      reservas.forEach(r => {
        const fecha = r.timestamp?.toDate?.() || new Date(r.timestamp);
        if (!isNaN(fecha)) {
          const mes = fecha.toLocaleString("default", { month: "short" });
          mesesUnicos.add(mes);
        }
      });
      setMesesDisponibles([...mesesUnicos]);

      // --- Conteo de servicios ---
      const conteoServicios = {};
      servicios.forEach(s => {
        conteoServicios[s.id] = 0;
      });

      reservas.forEach(r => {
        const sid = r.servicios?.[0]?.id;
        const fecha = r.timestamp?.toDate?.() || new Date(r.timestamp);
        const mes = fecha.toLocaleString("default", { month: "short" });

        if (sid && conteoServicios.hasOwnProperty(sid)) {
          if (!mesSeleccionado || mes === mesSeleccionado) {
            conteoServicios[sid]++;
          }
        }
      });

      const topServicios = servicios.map(s => ({
        name: s.title || `ID: ${s.id}`,
        value: conteoServicios[s.id] || 0
      }));

      setServiciosMasVendidos(topServicios);

      // --- Reservas por mes ---
      const meses = {};
      reservas.forEach(r => {
        const fecha = r.timestamp?.toDate?.() || new Date(r.timestamp);
        if (!isNaN(fecha)) {
          const mes = fecha.toLocaleString("default", { month: "short" });
          meses[mes] = (meses[mes] || 0) + 1;
        }
      });

      const reservasMes = Object.entries(meses).map(([mes, cantidad]) => ({ name: mes, reservas: cantidad }));
      setReservasPorMes(reservasMes);
    };

    fetchData();
  }, [mesSeleccionado]);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A28CFE", "#FE6499"];

  return (
    <section className="text-gray-600 body-font">
      <div className="container px-5 py-12 mx-auto">
        <div className="mb-10">
          <h1 className="sm:text-3xl text-2xl font-medium title-font text-gray-900">
            Panel de Administración
          </h1>
          <p className="mt-4 text-base">
            Bienvenido al panel de administrador. Desde aquí podrás gestionar usuarios, servicios, reservas y ver datos estadísticos clave.
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por mes</label>
          <select
            className="border rounded px-3 py-2 text-sm"
            value={mesSeleccionado}
            onChange={e => setMesSeleccionado(e.target.value)}
          >
            <option value="">Todos</option>
            {mesesDisponibles.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div className="mb-6 text-lg font-semibold">
          Total de reservas: <span className="text-indigo-600">{totalReservas}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-semibold mb-4">Servicios más vendidos {mesSeleccionado && `en ${mesSeleccionado}`}</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={serviciosMasVendidos} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {serviciosMasVendidos.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-semibold mb-4">Reservas por mes</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reservasPorMes}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="reservas" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
