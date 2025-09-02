import Modal from "./Modal";
import useTostFeedBack from "../hooks/useToastFeedBack";
import { useFormContext } from "react-hook-form";

function SupplierModal({ isOpen, onClose, register, errors }) {
    const {setValue} = useFormContext();
    const {error} = useTostFeedBack();

    const handleEmailInput = (e) => {
        const value = e.target.value;
        if(value.length > 100) {
            error("Emalil trop long — max 100 caractères");
            const trunced = value.slice(0, 100);
            e.target.value = trunced;
            setValue('supplier_email', trunced);
        }
    }

    const handlePhoneInput = (e) => {
        const value = e.target.value.replace(/[^\d]/g, "");
        if (value.length > 15) {
            error("Vous ne pouvez pas saisir plus de 15 chiffres");
            const trunced = value.slice(0, 15);
            e.target.value = trunced;
            setValue('supplier_phone', trunced);
        } else {
            e.target.value = value;
        }
    }
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Informations du fournisseur">
            <div className="mb-4">
                <label htmlFor="supplier_email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                    id="supplier_email"
                    type="email"
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors["supplier_email"] ? "focus:ring-red-500 focus:border-red-700 border-red-500" : ""}`}
                    placeholder="ex. contact@fournisseur.ml"
                    {...register('supplier_email')}
                    onInput={handleEmailInput}
                />
                {errors["supplier_email"] && (
                    <p className='text-red-500 text-sm mt-1'>{errors["supplier_email"].message}</p>
                )}
            </div>
            <div className="mb-2">
                <label htmlFor="supplier_phone" className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input
                    id="supplier_phone"
                    type="tel"
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors["supplier_phone"] ? "focus:ring-red-500 focus:border-red-700 border-red-500" : ""}`}
                    placeholder="ex. +22377001122"
                    {...register('supplier_phone')}
                    onInput={handlePhoneInput}
                />
                {errors["supplier_phone"] && (
                    <p className='text-red-600 text-sm transition-opacity duration-300 mt-1'>{errors["supplier_phone"].message}</p>
                )}
            </div>
        </Modal>
    );
}

export default SupplierModal;


