import SupplierModal from "./SupplierModal";
import { useFormContext } from "react-hook-form";
import { useState } from "react";
import useProgressiveValidation from "../hooks/useProgressiveValidation";

function ValidateSupplierInput() {
    const { register, formState:{errors}, setValue} = useFormContext();
    const { validateLength } = useProgressiveValidation();
    const [isSupplierModalOpen, setSupplierModalOpen] = useState(false);
    
    const handleNameInput = (e) => {
        const value = e.target.value;
        const validation = validateLength(value, 45, "Nom du fournisseur", {
            warningThreshold: 0.89,  // 40 caractères exactement (45 * 0.89 = 40.05)
            infoThreshold: 0.67,     // 30 caractères exactement (45 * 0.67 = 30.15)
            showCount: true,
            cooldownMs: 4000         // 4 secondes entre les notifications
        });
        
        if (validation.shouldTruncate) {
            const truncated = value.slice(0, 45);
            e.target.value = truncated;
            setValue('supplier_name', truncated);
        } else {
            setValue('supplier_name', value);
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