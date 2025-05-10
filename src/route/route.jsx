import { Route, Routes } from "react-router-dom";
import AppLayout from "../layout/layout";
import AuthLayout from "../layout/AuthLayout";
import PrivateRoute from "./PrivateRoute";
import LoginComponent from "../auth/LoginComponent";
import Category from "../modules/Category";
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
      ></Route>
      <Route path="/" element={<AppLayout />}>
        <Route path="/categories" element={<Category />} />
      </Route>

      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" element={<LoginComponent />} />
      </Route>
    </Routes>
  );
};
