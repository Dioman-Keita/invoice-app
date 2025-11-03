import { useFormContext } from "react-hook-form";
import useProgressiveValidation from "../../hooks/ui/useProgressiveValidation.js";
import { useState, useEffect } from "react";

function ValidatedAmountInput({ name = "invoice_amount", label = "Montant de la facture", placeholder = "ex. 1 000 000" }) {
  const { validatePattern } = useProgressiveValidation();
  const {
    register,
    formState: { errors },
    setValue,
    watch,
    trigger
  } = useFormContext();

  // Surveiller la valeur du champ dans react-hook-form
  const fieldValue = watch(name);
  const [displayValue, setDisplayValue] = useState("");

  // Synchroniser l'affichage avec la valeur du formulaire
  useEffect(() => {
    if (fieldValue) {
      const formattedValue = formatWithSpaces(fieldValue);
      setDisplayValue(formattedValue);
    } else {
      setDisplayValue("");
    }
  }, [fieldValue]);

  // Formate le nombre avec des espaces (ex: 1000000 devient "1 000 000")
  const formatWithSpaces = (value) => {
    if (!value) return "";
    const numericValue = value.toString().replace(/[^\d]/g, "");
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  // Bloque les nombres commençant par 0
  const formatNumberWith0 = (value) => {
    if (value && value.slice(0)[0] === '0') {
      validatePattern(value, /^[1-9]/, "Montant", "Le montant ne doit pas commencer par 0", {
        cooldownMs: 3000
      });
      return value.replace('0', '');
    }
    return value;
  }

  // Seuil maximum
  const MAX_AMOUNT = 100_000_000_000;

  const handleInput = (e) => {
    // Supprime tout sauf les chiffres
    const rawValue = formatNumberWith0(e.target.value.replace(/[^\d]/g, ""));
    
    if (!rawValue) {
      setDisplayValue("");
      setValue(name, "", { shouldValidate: true, shouldDirty: true });
      trigger(name); // Déclencher la validation immédiatement
      return;
    }

    const numeric = parseInt(rawValue, 10);

    if (numeric > MAX_AMOUNT) {
      validatePattern(numeric.toString(), /^[0-9]{1,12}$/, "Montant", "Montant maximum autorisé : 100 000 000 000", {
        cooldownMs: 3000
      });
      const formattedMax = formatWithSpaces(MAX_AMOUNT.toString());
      setDisplayValue(formattedMax);
      setValue(name, MAX_AMOUNT.toString(), { shouldValidate: true, shouldDirty: true });
    } else {
      const formattedValue = formatWithSpaces(rawValue);
      setDisplayValue(formattedValue);
      setValue(name, rawValue, { shouldValidate: true, shouldDirty: true });
    }

    // Déclencher la validation Zod immédiatement
    trigger(name);
  };

  return (
    <div className="w-full md:w-[48%] mb-4">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9\s]*"
        placeholder={placeholder}
        value={displayValue}
        id={name}
        {...register(name)}
        onChange={handleInput}
        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none ${
          errors[name] 
            ? "border-red-500 focus:ring-red-500 focus:border-red-700" 
            : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
        }`}
      />
      <div className="min-h-[1.25rem] mt-1 text-sm text-red-600 transition-opacity duration-300">
        {errors[name]?.message ?? <span className="invisible">Placeholder</span>}
      </div>
    </div>
  );
}

export default ValidatedAmountInput;