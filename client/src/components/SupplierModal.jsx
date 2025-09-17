import Modal from "./Modal";
import { useFormContext } from "react-hook-form";
import { useInputFilters } from "../hooks/useInputFilter";

function SupplierModal({ isOpen, onClose, register, errors }) {
    const {setValue} = useFormContext();

    const handleAccountNumberInput = (e) => {
        // Conserver uniquement les chiffres et limiter à 12
        const rawDigits = e.target.value.replace(/\D/g, "");
        const nextVal = rawDigits.slice(0, 12);
        e.target.value = nextVal;
        setValue('supplier_account_number', nextVal);
    }

    const { filterPhone } = useInputFilters();
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Informations du fournisseur">
            <div className="mb-4">
                <label htmlFor="supplier_account_number" className="block text-sm font-medium text-gray-700 mb-1">Numéro de compte</label>
                <input
                    id="supplier_account_number"
                    type="text"
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors["supplier_account_number"] ? "focus:ring-red-500 focus:border-red-700 border-red-500" : ""}`}
                    placeholder="ex. 000123456789"
                    inputMode="numeric"
                    pattern="\d{12}"
                    {...register('supplier_account_number')}
                    onInput={handleAccountNumberInput}
                />
                {errors["supplier_account_number"] && (
                    <p className='text-red-500 text-sm mt-1'>{errors["supplier_account_number"].message}</p>
                )}
            </div>
            <div className="mb-2">
                <label htmlFor="supplier_phone" className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input
                    id="supplier_phone"
                    type="tel"
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors["supplier_phone"] ? "focus:ring-red-500 focus:border-red-700 border-red-500" : ""}`}
                    placeholder="ex. +223 77 00 11 22"
                    {...register('supplier_phone')}
                    onInput={filterPhone}
                    onFocus={(e) => {
                        if (e.target.value === '') {
                            e.target.value = '+223 ';
                        }
                    }}
                />
                {errors["supplier_phone"] && (
                    <p className='text-red-600 text-sm transition-opacity duration-300 mt-1'>{errors["supplier_phone"].message}</p>
                )}
            </div>
        </Modal>
    );
}

export default SupplierModal;


