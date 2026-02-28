/** @format */

import { Navigate } from "react-router-dom";

const ProtectedUserRoute = ({ children }) => {
  const token = localStorage.getItem("userToken");

  if (!token) {
    return <Navigate to="/" replace />; // Redirect to landing or login page
  }

  return children;
};

export default ProtectedUserRoute;
