import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Login from "../pages/login";
import Register from "../pages/register";
import Reservas from "../pages/reservas";
import MisReservas from "../pages/mis-reservas";
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";
import Perfil from "../pages/perfil";
import ReservaExitosa from "../pages/reserva-exitosa";

// Admin
import AdminLayout from "../admin/AdminLayout";
import Dashboard from "../admin/Dashboard";
import ServiciosAdmin from "../admin/Servicios";
import Usuarios from "../admin/Usuarios";
import ReservasAdmin from "../admin/Reservas";
import Consultas from "../admin/Consultas";

// Seller
import HomeSeller from "../seller/HomeSeller";

// Públicas
import Servicios from "../pages/Servicios";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/" element={<Home />} />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route path="/servicios" element={<Servicios />} />

      {/* Rutas protegidas de usuario (cualquier rol autenticado) */}
      <Route
        path="/reservas"
        element={
          <ProtectedRoute>
            <Reservas />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mis-reservas"
        element={
          <ProtectedRoute>
            <MisReservas />
          </ProtectedRoute>
        }
      />
      <Route
        path="/perfil"
        element={
          <ProtectedRoute>
            <Perfil />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reserva-exitosa"
        element={
          <ProtectedRoute>
            <ReservaExitosa />
          </ProtectedRoute>
        }
      />

      {/* MEJORA (RNF-03 – Role Guard): Se agrega requiredRole="seller"
          para que solo sellers puedan acceder al panel de vendedor.
          Antes, cualquier usuario autenticado podía entrar a /seller. */}
      <Route
        path="/seller"
        element={
          <ProtectedRoute requiredRole="seller">
            <HomeSeller />
          </ProtectedRoute>
        }
      />

      {/* MEJORA (RNF-03 – Role Guard): Se agrega requiredRole="admin"
          para que solo admins puedan acceder al panel de administración.
          Antes, cualquier usuario autenticado podía entrar a /admin. */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="servicios" element={<ServiciosAdmin />} />
        <Route path="usuarios" element={<Usuarios />} />
        <Route path="reservas" element={<ReservasAdmin />} />
        <Route path="consultas" element={<Consultas />} />
      </Route>

      {/* MEJORA: Ruta catch-all para URLs inexistentes.
          Redirige al inicio en lugar de mostrar una página en blanco. */}
      <Route path="*" element={<Home />} />
    </Routes>
  );
};

export default AppRoutes;
