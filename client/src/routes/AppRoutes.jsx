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

function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
                <Route path="login" element={<Login />}>
                    <Route path="register" element={<Register />}></Route>
            </Route>
            <Route path="register" element={<Register />} />
            <Route path="/facture" element={<Invoice />} />
            <Route path="/export" element={<Export />} />
            <Route path="/search" element={<Search />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/print" element={<Print />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
            <Route path="/joinDFC" element={<JoinDFC />} />
            <Route path="/dfc_traitment" element={<DFCFormular />} />
        </Routes>
    )
}

export default AppRoutes;