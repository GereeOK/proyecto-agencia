import React, { useEffect, useState } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from "recharts";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import { fetchUsuarios, fetchResenasAdmin, fetchConsultas } from "../firebase/firestore";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
const MESES_ES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const exportCSV = (rows, filename) => {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map(row =>
      headers.map(h => `"${String(row[h] ?? "").replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const StatCard = ({ label, value, sub, borderColor }) => (
  <div className={`bg-white rounded-xl shadow p-5 border-l-4 ${borderColor}`}>
    <p className="text-sm text-gray-500 font-medium">{label}</p>
    <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

const Dashboard = () => {
  const [reservas, setReservas] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [resenas, setResenas] = useState([]);
  const [totalConsultas, setTotalConsultas] = useState(0);
  const [aniosDisponibles, setAniosDisponibles] = useState([]);
  const [anioSeleccionado, setAnioSeleccionado] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reservasSnap, serviciosSnap, usuarios, resenasData, consultasData] = await Promise.all([
          getDocs(collection(db, "reservas")),
          getDocs(collection(db, "servicios")),
          fetchUsuarios(),
          fetchResenasAdmin(),
          fetchConsultas(),
        ]);
        const r = reservasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const s = serviciosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setReservas(r);
        setServicios(s);
        setTotalUsuarios(usuarios.length);
        setResenas(resenasData);
        setTotalConsultas(consultasData.length);

        const anios = new Set();
        r.forEach(res => {
          const fecha = res.timestamp?.toDate?.() ?? (res.timestamp ? new Date(res.timestamp) : null);
          if (fecha && !isNaN(fecha)) anios.add(fecha.getFullYear());
        });
        const sorted = [...anios].sort((a, b) => b - a);
        setAniosDisponibles(sorted);
        if (sorted.length) setAnioSeleccionado(String(sorted[0]));
      } catch (err) {
        console.error("Error cargando dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // KPIs (always from all reservas)
  const totalReservas = reservas.length;
  const pendientes = reservas.filter(r => (r.estado || "pendiente") === "pendiente").length;
  const activos = servicios.filter(s => s.activo !== false).length;
  const ingresoTotal = reservas
    .filter(r => r.estado === "confirmada" || r.estado === "pagada")
    .reduce((sum, r) => sum + (r.servicios || []).reduce((s, sv) => s + (parseFloat(sv.price) || 0), 0), 0);

  // KPIs — reseñas
  const totalResenas = resenas.length;
  const promedioEstrellas = totalResenas
    ? (resenas.reduce((s, r) => s + (r.estrellas || 0), 0) / totalResenas).toFixed(1)
    : "—";
  const resenasOcultas = resenas.filter(r => r.oculto).length;

  // KPI — tasa de conversión (pagadas + confirmadas / total)
  const reservasExitosas = reservas.filter(r => r.estado === "confirmada" || r.estado === "pagada" || r.estado === "finalizada").length;
  const tasaConversion = totalReservas ? Math.round((reservasExitosas / totalReservas) * 100) : 0;

  // Reservas filtered by selected year
  const reservasFiltradas = reservas.filter(r => {
    if (!anioSeleccionado) return true;
    const fecha = r.timestamp?.toDate?.() ?? (r.timestamp ? new Date(r.timestamp) : null);
    return fecha && !isNaN(fecha) && String(fecha.getFullYear()) === anioSeleccionado;
  });

  // Chart: reservas por mes
  const dataMes = (() => {
    const conteo = Array(12).fill(0);
    reservasFiltradas.forEach(r => {
      const fecha = r.timestamp?.toDate?.() ?? (r.timestamp ? new Date(r.timestamp) : null);
      if (fecha && !isNaN(fecha)) conteo[fecha.getMonth()]++;
    });
    return MESES_ES.map((name, i) => ({ name, Reservas: conteo[i] }));
  })();

  // Chart: servicios más vendidos
  const dataPie = (() => {
    const conteo = {};
    reservasFiltradas.forEach(r => {
      (r.servicios || []).forEach(sv => {
        const key = sv.title || "Sin nombre";
        conteo[key] = (conteo[key] || 0) + 1;
      });
    });
    return Object.entries(conteo)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  })();

  // Chart: por estado (total, ignores year filter for full picture)
  const dataEstado = [
    { name: "Pendiente",   Cantidad: reservas.filter(r => (r.estado || "pendiente") === "pendiente").length,      fill: "#f59e0b" },
    { name: "Esp. seller", Cantidad: reservas.filter(r => r.estado === "confirmada_usuario").length,              fill: "#06b6d4" },
    { name: "Confirmada",  Cantidad: reservas.filter(r => r.estado === "confirmada").length,                      fill: "#22c55e" },
    { name: "Pagada",      Cantidad: reservas.filter(r => r.estado === "pagada").length,                          fill: "#6366f1" },
    { name: "Finalizada",  Cantidad: reservas.filter(r => r.estado === "finalizada").length,                      fill: "#8b5cf6" },
    { name: "Cancelada",   Cantidad: reservas.filter(r => r.estado === "cancelada").length,                       fill: "#ef4444" },
  ];

  // Chart: ingresos estimados por mes
  const dataIngresos = (() => {
    const meses = Array(12).fill(0);
    reservasFiltradas
      .filter(r => r.estado === "confirmada" || r.estado === "pagada")
      .forEach(r => {
        const fecha = r.timestamp?.toDate?.() ?? (r.timestamp ? new Date(r.timestamp) : null);
        if (!fecha || isNaN(fecha)) return;
        const monto = (r.servicios || []).reduce((s, sv) => s + (parseFloat(sv.price) || 0), 0);
        meses[fecha.getMonth()] += monto;
      });
    return MESES_ES.map((name, i) => ({ name, Ingresos: meses[i] }));
  })();

  // Chart: distribución de estrellas (1–5)
  const dataEstrellas = [1, 2, 3, 4, 5].map((n) => ({
    name: `${n} ⭐`,
    Reseñas: resenas.filter(r => r.estrellas === n).length,
  }));

  // Chart: reseñas por tipo
  const dataTipoResena = [
    { name: "Experiencias", value: resenas.filter(r => r.tipo === "experiencia").length, fill: "#6366f1" },
    { name: "Empresas",     value: resenas.filter(r => r.tipo === "empresa").length,     fill: "#22c55e" },
    { name: "Plataforma",   value: resenas.filter(r => r.tipo === "plataforma").length,  fill: "#f59e0b" },
  ].filter(d => d.value > 0);

  const handleExport = () => {
    const rows = reservas.map(r => ({
      Nombre: r.fullname || "",
      Email: r.email || "",
      "Check-in": r.checkin || "",
      "Check-out": r.checkout || "",
      Estado: r.estado || "pendiente",
      Servicios: (r.servicios || []).map(s => s.title).join(" | "),
      "Monto estimado ($)": (r.servicios || []).reduce((s, sv) => s + (parseFloat(sv.price) || 0), 0),
    }));
    exportCSV(rows, `reservas_${new Date().toISOString().split("T")[0]}.csv`);
  };

  if (loading) return <p className="text-center py-10 text-gray-500">Cargando...</p>;

  return (
    <section className="text-gray-600 body-font">
      <div className="px-2 py-8 mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
            <p className="text-sm text-gray-500 mt-1">Estadísticas y métricas de Baires Essence</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 font-medium">Año:</label>
              <select
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                value={anioSeleccionado}
                onChange={e => setAnioSeleccionado(e.target.value)}
              >
                <option value="">Todos</option>
                {aniosDisponibles.map(a => (
                  <option key={a} value={String(a)}>{a}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Exportar CSV
            </button>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Reservas" value={totalReservas} borderColor="border-indigo-500" />
          <StatCard label="Pendientes" value={pendientes} sub="requieren atención" borderColor="border-yellow-400" />
          <StatCard label="Servicios Activos" value={activos} sub={`de ${servicios.length} totales`} borderColor="border-green-500" />
          <StatCard
            label="Ingresos estimados"
            value={`$${ingresoTotal.toLocaleString("es-AR")}`}
            sub="confirmadas + pagadas"
            borderColor="border-purple-500"
          />
        </div>

        {/* Extra KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <StatCard label="Usuarios registrados" value={totalUsuarios} borderColor="border-blue-400" />
          <StatCard label="Confirmadas" value={reservas.filter(r => r.estado === "confirmada").length} borderColor="border-green-400" />
          <StatCard label="Canceladas" value={reservas.filter(r => r.estado === "cancelada").length} borderColor="border-red-400" />
          <StatCard label="Pagadas" value={reservas.filter(r => r.estado === "pagada").length} borderColor="border-violet-500" />
        </div>

        {/* Reseñas + métricas nuevas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard label="Total reseñas" value={totalResenas} sub={`${resenasOcultas} ocultas`} borderColor="border-yellow-500" />
          <StatCard label="Promedio estrellas" value={`${promedioEstrellas} ⭐`} sub="promedio global" borderColor="border-orange-400" />
          <StatCard label="Consultas recibidas" value={totalConsultas} sub="formulario de contacto" borderColor="border-sky-400" />
          <StatCard label="Tasa de conversión" value={`${tasaConversion}%`} sub="confirmadas + pagadas + finalizadas" borderColor="border-emerald-500" />
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
              Reservas por mes {anioSeleccionado && `· ${anioSeleccionado}`}
            </h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dataMes} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="Reservas" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
              Servicios más solicitados {anioSeleccionado && `· ${anioSeleccionado}`}
            </h2>
            {dataPie.length === 0 ? (
              <div className="h-[260px] flex items-center justify-center text-sm text-gray-400">
                Sin datos para este período
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={dataPie}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    outerRadius={90}
                    label={({ percent }) => percent > 0.07 ? `${(percent * 100).toFixed(0)}%` : ""}
                    labelLine={false}
                  >
                    {dataPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
              Reservas por estado · total histórico
            </h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dataEstado} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="Cantidad" radius={[4, 4, 0, 0]}>
                  {dataEstado.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
              Ingresos estimados por mes {anioSeleccionado && `· ${anioSeleccionado}`}
            </h2>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={dataIngresos} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                <defs>
                  <linearGradient id="gradIngresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={v => [`$${Number(v).toLocaleString("es-AR")}`, "Ingresos"]} />
                <Area
                  type="monotone"
                  dataKey="Ingresos"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#gradIngresos)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts row 3 — Reseñas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
              Distribución de estrellas · todas las reseñas
            </h2>
            {totalResenas === 0 ? (
              <div className="h-[260px] flex items-center justify-center text-sm text-gray-400">
                Sin reseñas aún
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={dataEstrellas} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="Reseñas" radius={[4, 4, 0, 0]}>
                    {dataEstrellas.map((_, i) => (
                      <Cell key={i} fill={["#ef4444","#f97316","#f59e0b","#84cc16","#22c55e"][i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
              Reseñas por tipo
            </h2>
            {dataTipoResena.length === 0 ? (
              <div className="h-[260px] flex items-center justify-center text-sm text-gray-400">
                Sin reseñas aún
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={dataTipoResena}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    outerRadius={90}
                    label={({ name, percent }) => percent > 0.07 ? `${name} ${(percent * 100).toFixed(0)}%` : ""}
                    labelLine={false}
                  >
                    {dataTipoResena.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>
    </section>
  );
};

export default Dashboard;
