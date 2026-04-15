import { Navigate } from "react-router-dom";
import { useAuth } from "../context/authContext";

// MEJORA (RNF-03 – Seguridad / RF-05 – Roles): El ProtectedRoute original
// solo verificaba si el usuario estaba autenticado, pero no validaba su rol.
// Esto significa que un turista podía acceder manualmente a /admin o /seller
// simplemente escribiendo la URL. Se agrega soporte para "requiredRole" de
// forma opcional: si se pasa, redirige a "/" si el rol no coincide.
//
// Uso sin rol (comportamiento original, compatible):
//   <ProtectedRoute><Reservas /></ProtectedRoute>
//
// Uso con rol (nuevo):
//   <ProtectedRoute requiredRole="admin"><AdminLayout /></ProtectedRoute>
//   <ProtectedRoute requiredRole="seller"><HomeSeller /></ProtectedRoute>

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600 text-xl">Cargando...</p>
      </div>
    );
  }

  // Si no hay sesión, redirigir al login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // MEJORA: Si se requiere un rol específico y el usuario no lo tiene,
  // redirigir al inicio. Esto es el "Role Guard" mencionado en RNF-03.
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
