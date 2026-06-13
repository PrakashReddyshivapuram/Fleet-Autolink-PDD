import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import DriverDashboard from "@/pages/driver/DriverDashboard";
import MechanicDashboard from "@/pages/mechanic/MechanicDashboard";
import OwnerDashboard from "@/pages/owner/OwnerDashboard";

function RoleRouter() {
  const { appUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-tertiary">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading Fleet AutoLink...</p>
        </div>
      </div>
    );
  }

  if (!appUser) return <Navigate to="/login" replace />;

  switch (appUser.role) {
    case "admin": return <Navigate to="/admin" replace />;
    case "driver": return <Navigate to="/driver" replace />;
    case "mechanic": return <Navigate to="/mechanic" replace />;
    case "owner": return <Navigate to="/owner" replace />;
    default: return <Navigate to="/login" replace />;
  }
}

function ProtectedRoute({ children, allowedRole }: { children: React.ReactNode; allowedRole: string }) {
  const { appUser, loading } = useAuth();
  if (loading) return null;
  if (!appUser) return <Navigate to="/login" replace />;
  if (appUser.role !== allowedRole) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<RoleRouter />} />
          <Route path="/admin/*" element={<ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/driver/*" element={<ProtectedRoute allowedRole="driver"><DriverDashboard /></ProtectedRoute>} />
          <Route path="/mechanic/*" element={<ProtectedRoute allowedRole="mechanic"><MechanicDashboard /></ProtectedRoute>} />
          <Route path="/owner/*" element={<ProtectedRoute allowedRole="owner"><OwnerDashboard /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
