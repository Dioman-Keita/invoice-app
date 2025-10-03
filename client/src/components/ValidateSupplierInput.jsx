import { useFormContext } from "react-hook-form";
import useProgressiveValidation from "../hooks/useProgressiveValidation";
import { useInputFilters } from "../hooks/useInputFilter";
import useToastFeedback from "../hooks/useToastFeedback";
import { useRef } from "react";

function ValidateSupplierInput() {
  const { register, formState: { errors }, setValue, trigger } = useFormContext();
  const { validateLength } = useProgressiveValidation();
  const { filterPhone } = useInputFilters();
  const { error } = useToastFeedback();
  
  // Référence pour éviter les spams de notifications
  const lastToastTime = useRef(0);
  const TOAST_COOLDOWN = 3000; // 3 secondes entre les toasts

  // Gestion du nom du fournisseur
  const handleNameInput = (e) => {
    const value = e.target.value;
    const validation = validateLength(value, 45, "Nom du fournisseur", {
      warningThreshold: 0.89,
      infoThreshold: 0.67,
      showCount: true,
      cooldownMs: 4000
    });

    const finalValue = validation.shouldTruncate ? value.slice(0, 45) : value;
    e.target.value = finalValue;
    setValue('supplier_name', finalValue, { shouldValidate: true });
  };

  // Gestion du numéro de compte avec validation progressive et toast
  const handleAccountNumberInput = (e) => {
    const rawDigits = e.target.value.replace(/\D/g, "");
    
    // Si l'utilisateur essaie de saisir plus de 12 chiffres
    if (rawDigits.length > 12) {
      const now = Date.now();
      if (now - lastToastTime.current > TOAST_COOLDOWN) {
        error("Le numéro de compte ne peut pas dépasser 12 chiffres");
        lastToastTime.current = now;
      }
    }
    
    const nextVal = rawDigits.slice(0, 12);
    e.target.value = nextVal;
    setValue('supplier_account_number', nextVal, { shouldValidate: true });
    
    // Déclencher la validation Zod
    setTimeout(() => trigger('supplier_account_number'), 0);
  };

  // Gestion du téléphone avec validation en temps réel
  const handlePhoneInput = (e) => {
    filterPhone(e); // Filtrage existant
    
    // Déclencher la validation Zod pour le téléphone
    setTimeout(() => {
      setValue('supplier_phone', e.target.value, { shouldValidate: true });
      trigger('supplier_phone');
    }, 0);
  };

  return (
    <div className="mb-4">
      {/* Container principal avec disposition horizontale */}
      <div className="flex flex-col md:flex-row gap-4 w-full">
        
        {/* Champ Nom du fournisseur */}
        <div className="flex-1 min-w-0">
          <label htmlFor="supplier_name" className="block text-sm font-medium text-gray-700 mb-1">
            Nom complet du fournisseur
          </label>
          <input
            type="text"
            placeholder="TWINS SERVICE"
            {...register('supplier_name')}
            onInput={handleNameInput}
            id="supplier_name"
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none ${
              errors['supplier_name'] 
                ? "border-red-500 focus:ring-red-500 focus:border-red-700" 
                : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            }`}
          />
          {errors['supplier_name'] && (
            <p className='text-red-600 text-sm mt-1 break-words'>{errors['supplier_name'].message}</p>
          )}
        </div>

        {/* Champ Téléphone */}
        <div className="flex-1 min-w-0">
          <label htmlFor="supplier_phone" className="block text-sm font-medium text-gray-700 mb-1">
            Téléphone
          </label>
          <input
            type="tel"
            placeholder="ex. +223 77 00 11 22"
            {...register('supplier_phone')}
            onInput={handlePhoneInput}
            onFocus={(e) => {
              if (e.target.value === '') {
                e.target.value = '+223 ';
                setValue('supplier_phone', '+223 ', { shouldValidate: true });
              }
            }}
            id="supplier_phone"
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none ${
              errors['supplier_phone'] 
                ? "border-red-500 focus:ring-red-500 focus:border-red-700" 
                : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            }`}
          />
          {errors['supplier_phone'] && (
            <p className='text-red-600 text-sm mt-1 break-words'>{errors['supplier_phone'].message}</p>
          )}
        </div>

        {/* Champ Numéro de compte */}
        <div className="flex-1 min-w-0">
          <label htmlFor="supplier_account_number" className="block text-sm font-medium text-gray-700 mb-1">
            Numéro de compte
          </label>
          <input
            type="text"
            placeholder="ex. 000123456789"
            inputMode="numeric"
            pattern="\d{12}"
            {...register('supplier_account_number')}
            onInput={handleAccountNumberInput}
            id="supplier_account_number"
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none ${
              errors['supplier_account_number'] 
                ? "border-red-500 focus:ring-red-500 focus:border-red-700" 
                : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            }`}
          />
          {errors['supplier_account_number'] && (
            <p className='text-red-600 text-sm mt-1 break-words'>{errors['supplier_account_number'].message}</p>
          )}
        </div>

      </div>
    </div>
  );
}

export default ValidateSupplierInput;