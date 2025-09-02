import SupplierModal from "./SupplierModal";
import { useFormContext } from "react-hook-form";
import { useState } from "react";
import useTostFeedBack from "../hooks/useToastFeedBack";

function ValidateSupplierInput() {
    const { register, formState:{errors}} = useFormContext();
    const {error} = useTostFeedBack();
    const [isSupplierModalOpen, setSupplierModalOpen] = useState(false);
    
    const handleNameInput = (e) => {
        const value = e.target.value;
        if (value.length > 45) {
            error("Nom du fournisseur limité à 45 caractères");
            e.target.value = value.slice(0, 45);
        }
    }


    return (
        <div className="w-full md:w-[48%] mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="supplier">Fournisseur</label>
            <div className="flex gap-2">
            <input type="text" placeholder={"TWINS SERVICE"} {...register('supplier_name')} onInput={handleNameInput} name="supplier_name" id="supplier_name" className={`flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none ${errors['supplier'] ? "focus:ring-red-500 focus:border-red-700 border-red-500" : "focus:ring-blue-500 focus:border-blue-500"}`} />
            <button type="button" onClick={() => setSupplierModalOpen(true)} className="px-3 py-2 rounded-md border border-blue-500 text-blue-600 hover:bg-blue-50">Plus</button>
            </div>
            <SupplierModal isOpen={isSupplierModalOpen} onClose={() => setSupplierModalOpen(false)} register={register} errors={errors} />
            {errors['supplier_name'] && (
            <p className='text-red-600 text-sm mt-1 transition-opacity duration-300'>{errors['supplier_name'].message}</p>
            )}
        </div>

    )

}

export default ValidateSupplierInput;