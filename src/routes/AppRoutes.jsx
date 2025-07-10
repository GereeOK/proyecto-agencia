// src/routes/AppRoutes.jsx
import { Routes, Route } from 'react-router-dom';
import Home from '../pages/Home';
import Login from '../pages/login';
import Register from '../pages/register';
import Reservas from '../pages/reservas';
import MisReservas from '../pages/mis-reservas';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';

import AdminLayout from '../admin/AdminLayout';
import Dashboard from '../admin/Dashboard';
import Servicios from '../admin/Servicios';
import Usuarios from '../admin/Usuarios';
import ReservasAdmin from '../admin/Reservas';
import Consultas from '../admin/Consultas';

import HomeSeller from '../seller/HomeSeller';

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

      {/* Rutas protegidas de usuario */}
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

      {/*Rutas protegidas de seller */}
      <Route
      path='/seller'
      element={
          <ProtectedRoute>
            <HomeSeller/>
          </ProtectedRoute>
      }
      />

      {/* Rutas protegidas de administrador */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        {/* Estas se renderizan dentro del <Outlet /> de AdminLayout */}
        <Route index element={<Dashboard />} />
        <Route path="servicios" element={<Servicios />} />
        <Route path="usuarios" element={<Usuarios />} />
        <Route path="reservas" element={<ReservasAdmin />} />
        <Route path="consultas" element={<Consultas />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
