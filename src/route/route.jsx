import { Route, Routes } from "react-router-dom";
import AppLayout from "../layout/layout";
import AuthLayout from "../layout/AuthLayout";
import PrivateRoute from "./PrivateRoute";
import LoginComponent from "../auth/LoginComponent";
import Category from "../modules/Category";
import Properties from "../modules/Properties";
import Profiles from "../modules/Profiles";
import Products from "../modules/Products";
import Locations from "../modules/Locations";
import Users from "../modules/Users";
import Banners from "../modules/Banner";
import Payments from "../modules/Payments";
import UserDetail from "../modules/UserDetail";
import Dashboard from "../modules/Dashboard";
import MediaMigration from "../modules/MediaMigration";
import BroadcastNotification from "../modules/BroadcastNotification";
import Shops from "../modules/Shops";
import Reports from "../modules/Reports";
import AuditLogs from "../modules/AuditLogs";
import AccountDeletions from "../modules/AccountDeletions";
import Expenses from "../modules/Expenses";
import SecurityPolicies from "../modules/SecurityPolicies";

export const AppRouter = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/shops" element={<Shops />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/categories" element={<Category />} />
        <Route path="/properties" element={<Properties />} />
        <Route path="/profiles" element={<Profiles />} />
        <Route path="/locations" element={<Locations />} />
        <Route path="/users" element={<Users />} />
        <Route path="/users/:id" element={<UserDetail />} />
        <Route path="/notifications" element={<BroadcastNotification />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/banners" element={<Banners />} />
        <Route path="/migration" element={<MediaMigration />} />
        <Route path="/deletions" element={<AccountDeletions />} />
        <Route path="/security-policies" element={<SecurityPolicies />} />
        <Route path="/audit-logs" element={<AuditLogs />} />
        <Route path="/expenses" element={<Expenses />} />
      </Route>

      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" element={<LoginComponent />} />
      </Route>
    </Routes>
  );
};
