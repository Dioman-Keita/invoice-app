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
import Help from "../pages/Help";
import PrivateRoute from "../components/PrivateRoute";
import UnauthorizedPage from "../pages/Unauthorized";
import Dashboard from "../pages/Dashboard";
import Users from "../pages/Users";
import StatsSimple from "../pages/StatsSimple";
import Profile from "../pages/Profile";

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
                ><JoinDFC /></PrivateRoute>
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