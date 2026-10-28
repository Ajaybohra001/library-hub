import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
export function ProtectedRoute() {
  const { user } = useAuth();
  const location = useLocation();
  return user ? (
    <Outlet />
  ) : (
    <Navigate
      to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
      replace
    />
  );
}
