import InvoiceLastNumber from "../features/invoices/InvoiceLastNumber";

function FormContainer({ children, handleSubmit, onSubmit, lastInvoiceNumber, isLoading, fiscalYear }) {
    return (
        <main className="py-10 px-4">
            <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl mx-auto bg-white/90 backdrop-blur-md p-6 rounded-lg shadow-xl">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex flex-col sm:flex-row sm:item-center sm:justify-between gap-2">
                    <span className="italic">SAISIE DES INFORMATIONS SUR LA FACTURE . Exercice fiscal {fiscalYear}</span>
                    <span><InvoiceLastNumber isLoding={isLoading} lastInvoiceNumber={lastInvoiceNumber} fiscalYear={fiscalYear}/></span>
                </h3>
                {children}
            </form>
        </main>
    )
}
export default FormContainer;