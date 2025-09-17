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

function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
                <Route path="login" element={<Login />}>
                <Route path="register" element={<Register />}></Route>
            </Route>
            <Route path="register" element={<Register />} />
            <Route path="/facture" element={<Invoice />} />
            <Route path="/export" element={<PrivateRoute><Export /></PrivateRoute>} />
            <Route path="/search" element={<PrivateRoute><Search /></PrivateRoute>} />
            <Route path="/stats" element={<PrivateRoute><Stats /></PrivateRoute>} />
            <Route path="/print" element={<PrivateRoute><Print /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="*" element={<NotFound />} />
            <Route path="/joinDFC" element={<PrivateRoute><JoinDFC /></PrivateRoute>} />
            <Route path="/dfc_traitment" element={<PrivateRoute><DFCFormular /></PrivateRoute>} />
        </Routes>
    )
}

export default AppRoutes;