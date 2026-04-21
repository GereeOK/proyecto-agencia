import { Routes, Route, Navigate } from "react-router-dom";
import Home from "../pages/Home";
import Login from "../pages/login";
import Register from "../pages/register";
import MisReservas from "../pages/mis-reservas";
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";
import Perfil from "../pages/perfil";
import ReservaExitosa from "../pages/reserva-exitosa";
import Servicios from "../pages/Servicios";

// Admin
import AdminLayout from "../admin/AdminLayout";
import Dashboard from "../admin/Dashboard";
import ServiciosAdmin from "../admin/Servicios";
import Usuarios from "../admin/Usuarios";
import ReservasAdmin from "../admin/Reservas";
import Consultas from "../admin/Consultas";

// Seller
import HomeSeller from "../seller/HomeSeller";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* /reservas redirige a /servicios — el flujo de reserva ahora vive ahí */}
      <Route path="/reservas" element={<Navigate to="/servicios" replace />} />

      {/* Catálogo + flujo de reserva con carrito (accesible sin login,
          pero el login se pide al intentar confirmar) */}
      <Route path="/servicios" element={<Servicios />} />

      {/* Protegidas */}
      <Route path="/mis-reservas" element={<ProtectedRoute><MisReservas /></ProtectedRoute>} />
      <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
      <Route path="/reserva-exitosa" element={<ProtectedRoute><ReservaExitosa /></ProtectedRoute>} />

      {/* Seller */}
      <Route path="/seller" element={<ProtectedRoute requiredRole="seller"><HomeSeller /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="servicios" element={<ServiciosAdmin />} />
        <Route path="usuarios" element={<Usuarios />} />
        <Route path="reservas" element={<ReservasAdmin />} />
        <Route path="consultas" element={<Consultas />} />
      </Route>

      <Route path="*" element={<Home />} />
    </Routes>
  );
};

export default AppRoutes;
