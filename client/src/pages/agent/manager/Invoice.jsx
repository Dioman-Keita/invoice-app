import InvoiceForm from "../../../features/invoices/InvoiceForm.jsx";
import Banner from "../../../components/global/Banner.jsx";
import Footer from "../../../components/global/Footer.jsx";
import Navbar from "../../../components/navbar/Navbar.jsx";
import useTitle from "../../../hooks/ui/useTitle.js";
import useBackground from "../../../hooks/ui/useBackground.js";

function  Invoice() {
    useBackground('bg-invoice');
    useTitle('CMDT - Enregistrement de factures');
    return (
        <>
            <Banner />
            <Navbar />
            <InvoiceForm />
            <Footer />
        </>
    )
}

export default Invoice;