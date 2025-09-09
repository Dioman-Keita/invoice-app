import InvoiceForm from "../features/invoices/InvoiceForm";
import Banner from "../components/Banner";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import useTitle from "../hooks/useTitle";
import useBackground from "../hooks/useBackground";

function  Invoice() {
    useBackground('bg-invoice')
    useTitle('CMDT — Invoice - App')
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