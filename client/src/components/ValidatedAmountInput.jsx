import { useFormContext } from "react-hook-form";
import useProgressiveValidation from "../hooks/useProgressiveValidation";
import { useState } from "react";

function ValidatedAmountInput({ name = "invoice_amount", label = "Montant de la facture", placeholder = "ex. 1 000 000" }) {
  const { validatePattern } = useProgressiveValidation();
  const {
    register,
    formState: { errors },
    setValue,
    getValues
  } = useFormContext();

  const [displayValue, setDisplayValue] = useState(getValues(name) || "");

  // Formate le nombre avec des espaces (ex: 1000000 devient "1 000 000")
  const formatWithSpaces = (value) => {
    const numericValue = value.replace(/[^\d]/g, "");
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  // Bloc les nombre commencant par 0
  const formatNumberWith0  = (value) => {
    if (value.slice(0)[0] === '0') {
      validatePattern(value, /^[1-9]/, "Montant", "Le montant ne doit pas commencer par 0", {
        cooldownMs: 3000
      });
      return value.replace('0', '');
    } else {
      return value;
    }
  }

  // Seuil maximum
  const MAX_AMOUNT = 1_000_000_000;

  const handleInput = (e) => {
    // Supprime tout sauf les chiffres
    const rawValue = formatNumberWith0(e.target.value.replace(/[^\d]/g, ""));
    
    if (!rawValue) {
      setDisplayValue("");
      setValue(name, "", { shouldDirty: true });
      return;
    }

    const numeric = parseInt(rawValue, 10);

    if (numeric > MAX_AMOUNT) {
      validatePattern(numeric.toString(), /^[0-9]{1,9}$/, "Montant", "Montant maximum autorisé : 1 milliard FCFA", {
        cooldownMs: 3000
      });
      const formattedMax = formatWithSpaces(MAX_AMOUNT.toString());
      setDisplayValue(formattedMax);
      setValue(name, MAX_AMOUNT.toString(), { shouldDirty: true });
    } else {
      const formattedValue = formatWithSpaces(rawValue);
      setDisplayValue(formattedValue);
      setValue(name, rawValue, { shouldDirty: true });
    }
  };

  const handleBlur = (e) => {
    // Optionnel: nettoyer l'affichage si vide
    if (!e.target.value.replace(/[^\d]/g, "")) {
      setDisplayValue("");
    }
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
        {...register(name)}
        name={name}
        id={name}
        onChange={handleInput}
        onBlur={handleBlur}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none ${
          errors[name] ? "focus:ring-red-500 focus:border-red-700 border-red-500" : "focus:ring-blue-500 focus:border-blue-500"
        }`}
      />
      <div className="min-h-[1.25rem] mt-1 text-sm text-red-600 transition-opacity duration-300">
        {errors[name]?.message ?? <span className="invisible">Placeholder</span>}
      </div>
    </div>
  );
}

export default ValidatedAmountInput;