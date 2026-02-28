/** @format */

import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Outlet,
} from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Dashboard from "./pages/Admin/Dashboard/Dashboard.jsx";
import Login from "./pages/Admin/Login/Login.jsx";
import Residents from "./pages/Admin/Residents/Residents.jsx";
import Request from "./pages/Admin/Requests/Requests.jsx";
import Reports from "./pages/Admin/Reports/Reports.jsx";
import AdminNavbar from "./components/AdminNavbar";
import Approvals from "./pages/Admin/Approvals/Approvals.jsx";
import LandingPage from "./pages/Resident/LandingPage/LandingPage.jsx";
import UserDashboard from "./pages/Resident/Dashboard/Dashboard.jsx";
import UserRequests from "./pages/Resident/Requests/Requests.jsx";
import UserServices from "./pages/Resident/Services/Services.jsx";
import UserFAQs from "./pages/Resident/FAQs/FAQs.jsx";
import UserAbout from "./pages/Resident/About/About.jsx";
import Events from "./pages/Admin/Events/Events.jsx";
import AdminProfile from "./pages/Admin/Profile/Profile.jsx";
import UserProfile from "./pages/Resident/Profile/Profile.jsx";
import NotFound from "./pages/NotFound.jsx";
import Navbar from "./components/Navbar.jsx";
import ProtectedAdminRoute from "./components/auth/ProtectedAdminRoute.jsx";
import ProtectedUserRoute from "./components/auth/ProtectedUserRoute.jsx";
import { AdminProfileProvider } from "./context/AdminProfileContext.jsx";
import "./App.css";

// Admin layout with persistent navbar
const AdminLayout = () => (
  <div className="min-h-screen dotted-bg ">
    <AdminNavbar />
    <div className="pt-24 px-6 pb-6">
      <Outlet />
    </div>
  </div>
);

// User layout for resident routes
const UserLayout = () => (
  <div className="min-h-screen dotted-bg">
    <Navbar />
    <div className="pt-24 px-6 pb-6">
      <Outlet />
    </div>
  </div>
);

const AnimatedRoutes = ({ loading }) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Admin login route (public) */}
        <Route path="/admin" element={<Login />} />

        {/* Protected admin routes */}
        <Route
          path="/admin"
          element={
            <ProtectedAdminRoute>
              <AdminLayout />
            </ProtectedAdminRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="residents" element={<Residents />} />
          <Route path="requests" element={<Request />} />
          <Route path="reports" element={<Reports />} />
          <Route path="approvals" element={<Approvals />} />
          <Route path="events" element={<Events />} />
          <Route path="profile" element={<AdminProfile />} />
        </Route>

        {/* User landing route (public) */}
        <Route path="/" element={<LandingPage />} />

        {/* Protected user dashboard routes */}
        <Route
          path="/"
          element={
            <ProtectedUserRoute>
              <UserLayout />
            </ProtectedUserRoute>
          }
        >
          <Route path="dashboard" element={<UserDashboard />} />
          <Route path="services" element={<UserServices />} />
          <Route path="requests" element={<UserRequests />} />
          <Route path="faqs" element={<UserFAQs />} />
          <Route path="about" element={<UserAbout />} />
          <Route path="profile" element={<UserProfile />} />
        </Route>

        {/* Catch-all route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate initial app loading (e.g., fetching user/session)
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Router>
      <AdminProfileProvider>
        <AnimatedRoutes loading={loading} />
        <ToastContainer
          position="top-center"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
      </AdminProfileProvider>
    </Router>
  );
};

export default App;
