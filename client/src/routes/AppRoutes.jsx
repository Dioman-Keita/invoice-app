import { Routes, Route } from "react-router-dom";
import NotFound from "../pages/global/NotFound.jsx";
import Login from "../pages/auth/Login.jsx";
import Home from "../pages/global/Home.jsx";
import Register from "../pages/auth/Register.jsx";
import Invoice from "../pages/agent/manager/Invoice.jsx";
import Search from "../pages/global/Search.jsx";
import Stats from "../pages/admin/Stats.jsx";
import Settings from "../pages/admin/Settings.jsx";
import RoleMigration from "../pages/global/RoleMigration.jsx";
import Messaging from "../pages/admin/Messaging.jsx";
import DfcFormular from "../pages/agent/dfc/DfcFormular.jsx";
import Verify from "../pages/global/Verify.jsx";
import ResetPassword from "../pages/auth/ResetPassword.jsx";
import ForgotPassword from "../pages/auth/ForgotPassword.jsx";
import Help from "../pages/global/Help.jsx";
import PrivateRoute from "../components/global/PrivateRoute.jsx";
import UnauthorizedPage from "../pages/global/Unauthorized.jsx";
import Dashboard from "../pages/admin/Dashboard.jsx";
import Users from "../pages/admin/Users.jsx";
import StatsSimple from "../pages/global/StatsSimple.jsx";
import Profile from "../pages/global/Profile.jsx";
import SystemLogs from "../pages/admin/SystemLogs.jsx";

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
            <Route path="/help" element={<Help />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* ==================== */}
            {/* ROUTES PROTÉGÉES - Accès tous utilisateurs authentifiés */}
            {/* ==================== */}
            <Route path="/search" element={
                <PrivateRoute requiredRoles={['admin']}>
                    <Search />
                </PrivateRoute>
            } />
            <Route path="/profile" element={
                <PrivateRoute requiredRoles={['admin', 'invoice_manager', 'dfc_agent']}>
                    <Profile />
                </PrivateRoute>
            } />
            <Route path="/stats" element={
                <PrivateRoute requiredRoles={['admin', 'invoice_manager', 'dfc_agent']}>
                    <StatsSimple />
                </PrivateRoute>
            } />

            {/* ==================== */}
            {/* ROUTES SPÉCIFIQUES - Permissions par rôle */}
            {/* ==================== */}

            {/* Facturation - Admin + Gestionnaires */}
            <Route path="/facture" element={
                <PrivateRoute
                    requiredRoles={['admin', 'invoice_manager']}
                    customMessage="Espace de facturation réservé aux administrateurs et gestionnaires"
                >
                    <Invoice />
                </PrivateRoute>
            } />

            {/* Paramètres - Admin seulement */}
            <Route path="/settings" element={
                <PrivateRoute
                    requiredRoles={['admin']}
                    customMessage="Panneau d'administration réservé aux administrateurs système"
                >
                    <Settings />
                </PrivateRoute>
            } />
            <Route path="/role-migration" element={
                <PrivateRoute
                    requiredRoles={['dfc_agent', 'invoice_manager']}
                    customMessage="Accès réservé aux gestionnaires et agents DFC"
                ><RoleMigration /></PrivateRoute>
            } />


            {/* Tableau de bord admin - Accès admin seulement */}
            <Route path="/dashboard" element={
                <PrivateRoute
                    requiredRoles={['admin']}
                    customMessage="Tableau de bord réservé aux administrateurs"
                >
                    <Dashboard />
                </PrivateRoute>
            } />

            {/* Gestion des utilisateurs - Accès admin seulement */}
            <Route path="/users" element={
                <PrivateRoute
                    requiredRoles={['admin']}
                    customMessage="Gestion des utilisateurs réservée aux administrateurs"
                >
                    <Users />
                </PrivateRoute>
            } />

            {/* Statistiques avancées - Admin seulement */}
            <Route path="/admin-stats" element={
                <PrivateRoute
                    requiredRoles={['admin']}
                    customMessage="Statistiques avancées réservées aux administrateurs"
                >
                    <Stats />
                </PrivateRoute>
            } />

            {/* Messagerie admin - Accès admin seulement */}
            <Route path="/admin-messaging" element={
                <PrivateRoute
                    requiredRoles={['admin']}
                    customMessage="Messagerie réservée aux administrateurs"
                >
                    <Messaging />
                </PrivateRoute>
            } />

            {/* Logs Système - Admin seulement */}
            <Route path="/admin-logs" element={
                <PrivateRoute
                    requiredRoles={['admin']}
                    customMessage="Consultation des logs système réservée aux administrateurs"
                >
                    <SystemLogs />
                </PrivateRoute>
            } />

            {/* Traitement DFC - Agents DFC + Admin */}
            <Route path="/dfc_traitment" element={
                <PrivateRoute
                    requiredRoles={['dfc_agent', 'admin']}
                    customMessage="Zone de traitement DFC réservée aux agents et administrateurs"
                >
                    <DfcFormular />
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