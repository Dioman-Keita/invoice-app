import { useFormContext } from "react-hook-form";
import useProgressiveValidation from "../../hooks/ui/useProgressiveValidation.js";

function ValidatedInvoiceNumberInput({ name, label = "Numéro de la facture", placeholder = "ex. 000012345678" }) {
  const { validateLength, validatePattern } = useProgressiveValidation();
  const { register, formState: { errors }, setValue } = useFormContext();

  const handleInput = (e) => {
    const raw = e.target.value.replace(/[^\d]/g, "");

    if (e.target.value !== raw) {
      validatePattern(raw, /^\d*$/, "Numéro", "Le numéro ne peut contenir que des chiffres");
    }

    // 1 to 12 digits (leading zeros allowed)
    const lengthValidation = validateLength(raw, 12, "Numéro", {
      warningThreshold: 1.0,
      infoThreshold: 0.75,
      showCount: false
    });

    if (lengthValidation.shouldTruncate) {
      const truncated = raw.slice(0, 12);
      e.target.value = truncated;
      setValue(name, truncated, { shouldDirty: true });
    } else {
      e.target.value = raw;
      setValue(name, raw, { shouldDirty: true });
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
        pattern="\d{1,12}"
        placeholder={placeholder}
        {...register(name)}
        id={name}
        onInput={handleInput}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none ${errors[name] ? "focus:ring-red-500 focus:border-red-700 border-red-500" : "focus:ring-blue-500 focus:border-blue-500"
          }`}
      />
      <div className="min-h-[1.25rem] mt-1 text-sm transition-opacity duration-300">
        {errors[name]?.message ? (
          <span className="text-red-600">{errors[name].message}</span>
        ) : (
          <span className="text-gray-500 text-xs">1 à 12 chiffres, zéros en tête autorisés</span>
        )}
      </div>
    </div>
  );
}

export default ValidatedInvoiceNumberInput;


