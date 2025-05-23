import { Navigate } from "react-router-dom";
import useAuthStore from "../store";

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  return <>{isAuthenticated ? children : <Navigate to={'/auth/login'}/>}</>;
};

export default PrivateRoute;
