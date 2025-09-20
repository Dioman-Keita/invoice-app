import { Routes, Route } from "react-router-dom";
import NotFound from "../pages/notFound";
import Login from "../pages/Login";
import Home from "../pages/Home";
import Register from "../pages/Register";
import Invoice from "../pages/Invoice";
import Export from "../pages/Export";
import Search from "../pages/Search";
import Stats from "../pages/Stats";
import Print from "../pages/Print";
import Settings from "../pages/Settings";
import JoinDFC from "../pages/JoinDFC";
import DFCFormular from "../pages/DFCFormular";
import Verify from "../pages/Verify";
import ResetPassword from "../pages/ResetPassword";
import ForgotPassword from "../pages/ForgotPassword";
import PrivateRoute from "../components/PrivateRoute";
import UnauthorizedPage from "../pages/Unauthorized";

function AppRoutes() {
    return (
        <Routes>
            {/* ==================== */}
            {/* ROUTES PUBLIQUES */}
            {/* ==================== */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/joinDFC" element={<JoinDFC />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* ==================== */}
            {/* ROUTES PROTÉGÉES (Authentification requise) */}
            {/* ==================== */}
            <Route path="/export" element={<PrivateRoute><Export /></PrivateRoute>} />
            <Route path="/search" element={<PrivateRoute><Search /></PrivateRoute>} />
            <Route path="/stats" element={<PrivateRoute><Stats /></PrivateRoute>} />
            <Route path="/print" element={<PrivateRoute><Print /></PrivateRoute>} />

            {/* ==================== */}
            {/* ROUTES ADMINISTRATIVES (Rôles spécifiques) */}
            {/* ==================== */}
            <Route path="/facture" element={
                <PrivateRoute requiredRoles={['admin', 'invoice_manager']}>
                    <Invoice />
                </PrivateRoute>
            } />
            <Route path="/settings" element={
                <PrivateRoute requiredRoles={['admin']}>
                    <Settings />
                </PrivateRoute>
            } />
            <Route path="/dfc_traitment" element={
                <PrivateRoute requiredRoles={['dfc_agent', 'admin']}>
                    <DFCFormular />
                </PrivateRoute>
            } />

            {/* ==================== */}
            {/* ROUTE 404 */}
            {/* ==================== */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    )
}

export default AppRoutes;