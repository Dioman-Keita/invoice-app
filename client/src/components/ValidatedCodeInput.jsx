import { useFormContext } from "react-hook-form";
import useProgressiveValidation from "../hooks/useProgressiveValidation";

function ValidatedCodeInput({ name, label, placeholder }) {
  const { validateLength, validatePattern } = useProgressiveValidation();
  const {
    register,
    formState: { errors },
    setValue
  } = useFormContext();
  
  const handleInput = (e) => {
    const raw = e.target.value.replace(/[^\d]/g, "");
    
    // Validation du pattern (chiffres uniquement) - seulement si l'utilisateur tape des caractères non-numériques
    if (e.target.value !== raw) {
      validatePattern(raw, /^\d*$/, "Code", "Le code ne peut contenir que des chiffres");
    }
    
    // Validation de la longueur - plus douce pour le format XXXX
    const lengthValidation = validateLength(raw, 4, "Code", {
      warningThreshold: 1.0,  // Pas de warning avant d'atteindre 4 caractères
      infoThreshold: 0.75,    // Info à 3 caractères seulement
      showCount: false        // Pas de compteur pour éviter le stress
    });
    
    if (lengthValidation.shouldTruncate) {
      const truncated = raw.slice(0, 4);
      e.target.value = truncated;
      setValue(name, truncated);
    } else {
      e.target.value = raw;
      setValue(name, raw);
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
        pattern="\d{4}"
        placeholder={placeholder}
        {...register(name)}
        id={name}
        onInput={handleInput}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none ${
          errors[name] ? "focus:ring-red-500 focus:border-red-700 border-red-500" : "focus:ring-blue-500 focus:border-blue-500"
        }`}
      />
      <div className="min-h-[1.25rem] mt-1 text-sm transition-opacity duration-300">
        {errors[name]?.message ? (
          <span className="text-red-600">{errors[name].message}</span>
        ) : (
          <span className="text-gray-500 text-xs">Format: XXXX (ex: 0001, 0002, 9999)</span>
        )}
      </div>
    </div>
  );
}

export default ValidatedCodeInput;
