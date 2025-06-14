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
        <Route path="/categories" index element={<Category />} />
        <Route path="/properties" element={<Properties />} />
        <Route path="/profiles" element={<Profiles />} />
        <Route path="/products" element={<Products />} />
        <Route path="/locations" element={<Locations />} />
        <Route path="/users" element={<Users />} />
        <Route path="/banners" element={<Banners />} />
      </Route>

      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" element={<LoginComponent />} />
      </Route>
    </Routes>
  );
};
