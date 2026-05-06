import { Routes, Route, Navigate } from "react-router-dom";
import Home from "../pages/Home";
import Login from "../pages/login";
import Register from "../pages/register";
import MisReservas from "../pages/mis-reservas";
import Favoritos from "../pages/Favoritos";
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";
import Perfil from "../pages/perfil";
import ReservaExitosa from "../pages/reserva-exitosa";
import Servicios from "../pages/Servicios";
import PantallaPago from "../pages/PantallaPago";
import PagoExitoso from "../pages/PagoExitoso";
import PagoFallido from "../pages/PagoFallido";

// Admin
import AdminLayout from "../admin/AdminLayout";
import Dashboard from "../admin/Dashboard";
import ServiciosAdmin from "../admin/Servicios";
import Usuarios from "../admin/Usuarios";
import ReservasAdmin from "../admin/Reservas";
import Consultas from "../admin/Consultas";
import ResenasAdmin from "../admin/Resenas";

// Seller
import HomeSeller from "../seller/HomeSeller";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* /reservas redirige a /servicios */}
      <Route path="/reservas" element={<Navigate to="/servicios" replace />} />
      <Route path="/servicios" element={<Servicios />} />

      {/* Protegidas */}
      <Route path="/mis-reservas" element={<ProtectedRoute><MisReservas /></ProtectedRoute>} />
      <Route path="/favoritos" element={<ProtectedRoute><Favoritos /></ProtectedRoute>} />
      <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
      <Route path="/reserva-exitosa" element={<ProtectedRoute><ReservaExitosa /></ProtectedRoute>} />

      {/* Pago — protegido, recibe reserva por location.state */}
      <Route path="/pagar" element={<ProtectedRoute><PantallaPago /></ProtectedRoute>} />

      {/* Retorno de plataformas de pago — sin protección para que MP/PayPal puedan redirigir */}
      <Route path="/pago-exitoso" element={<PagoExitoso />} />
      <Route path="/pago-fallido" element={<PagoFallido />} />

      {/* Seller */}
      <Route path="/seller" element={<ProtectedRoute requiredRole="seller"><HomeSeller /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="servicios" element={<ServiciosAdmin />} />
        <Route path="usuarios" element={<Usuarios />} />
        <Route path="reservas" element={<ReservasAdmin />} />
        <Route path="consultas" element={<Consultas />} />
        <Route path="resenas" element={<ResenasAdmin />} />
      </Route>

      <Route path="*" element={<Home />} />
    </Routes>
  );
};

export default AppRoutes;
