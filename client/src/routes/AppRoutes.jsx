import { Routes, Route } from "react-router-dom";
import NotFound from "../pages/global/NotFound.jsx";
import Login from "../pages/auth/Login.jsx";
import Home from "../pages/global/Home.jsx";
import Register from "../pages/auth/Register.jsx";
import Invoice from "../pages/agent/manager/Invoice.jsx";
import Export from "../pages/global/Export.jsx";
import Search from "../pages/global/Search.jsx";
import Stats from "../pages/admin/Stats.jsx";
import Print from "../pages/global/Print.jsx";
import Settings from "../pages/admin/Settings.jsx";
import JoinDfc from "../pages/global/JoinDfc.jsx";
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
            <Route path="/export" element={
                <PrivateRoute requiredRoles={['admin', 'invoice_manager', 'dfc_agent']}>
                    <Export />
                </PrivateRoute>
            } />
            <Route path="/search" element={
                <PrivateRoute requiredRoles={['admin', 'invoice_manager', 'dfc_agent']}>
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
            <Route path="/print" element={
                <PrivateRoute requiredRoles={['admin', 'invoice_manager', 'dfc_agent']}>
                    <Print />
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
            <Route path="/joinDFC" element={
                <PrivateRoute
                    requiredRoles={['admin', 'invoice_manager']}
                    customMessage="Accès réservé aux gestionnaires de facturation et administrateurs système"
                ><JoinDfc /></PrivateRoute>
            } />


            {/* Tableau de bord admin - Accès libre pour test */}
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Gestion des utilisateurs - Accès libre pour test */}
            <Route path="/users" element={<Users />} />

            {/* Statistiques avancées - Admin seulement */}
            <Route path="/admin-stats" element={
                <PrivateRoute 
                    requiredRoles={['admin']}
                    customMessage="Statistiques avancées réservées aux administrateurs"
                >
                    <Stats />
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