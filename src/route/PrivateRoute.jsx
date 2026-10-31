import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import useAuthStore from "../store";

const ALLOWED_ADMIN_ROLES = ["SUPER_ADMIN"];

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, user, fetchAdminProfile, logout } = useAuthStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const verifyAdmin = async () => {
      if (!isAuthenticated) {
        if (isMounted) setChecking(false);
        return;
      }

      try {
        const profile = await fetchAdminProfile();
        if (!profile || !ALLOWED_ADMIN_ROLES.includes(profile.role)) {
          logout();
          return;
        }
      } catch (e) {
        logout();
        return;
      }

      if (isMounted) {
        setChecking(false);
      }
    };

    verifyAdmin();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, fetchAdminProfile, logout]);

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  if (checking) {
    return (
      <div className="flex w-full h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-medium tracking-wide">
            Xavfsizlik tekshiruvi & sessiya faollashtirilmoqda...
          </span>
        </div>
      </div>
    );
  }

  const currentRole = user?.role;
  if (!currentRole || !ALLOWED_ADMIN_ROLES.includes(currentRole)) {
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
