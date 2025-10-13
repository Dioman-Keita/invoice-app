import { useFormContext } from "react-hook-form";
import useProgressiveValidation from "../hooks/useProgressiveValidation";
import { useState, useRef, useEffect } from "react";

function ValidatedCodeInput({ name, label, placeholder, initialValue, resetTrigger }) {
  const { validateLength, validatePattern } = useProgressiveValidation();
  const {
    register,
    formState: { errors, isSubmitSuccessful },
    setValue,
    watch,
    trigger
  } = useFormContext();
  
  const [currentValue, setCurrentValue] = useState("");
  const [hasIncoherence, setHasIncoherence] = useState(false);
  const initializedRef = useRef(false);
  const previousResetTriggerRef = useRef(resetTrigger);
  
  // Préremplir avec la valeur initiale du serveur et gérer la réinitialisation après submit
  useEffect(() => {
    if (initialValue) {
      const formattedValue = initialValue.toString().padStart(4, '0');
      
      // Réinitialisation après submit
      if (isSubmitSuccessful || resetTrigger !== previousResetTriggerRef.current) {
        setValue(name, formattedValue, { shouldValidate: true, shouldDirty: true });
        setCurrentValue(formattedValue);
        setHasIncoherence(false);
        previousResetTriggerRef.current = resetTrigger;
        console.log('🔄 Réinitialisation après submit avec:', formattedValue);
      }
      // Initialisation normale
      else if (!initializedRef.current) {
        setValue(name, formattedValue, { shouldValidate: true, shouldDirty: true });
        setCurrentValue(formattedValue);
        initializedRef.current = true;
        console.log('🎯 Initialisation avec:', formattedValue);
      }
    }
  }, [initialValue, name, setValue, isSubmitSuccessful, resetTrigger]);

  const watchedValue = watch(name);

  const handleInput = (e) => {
    const raw = e.target.value.replace(/[^\d]/g, "");
    
    // Détecter une incohérence si l'utilisateur modifie la valeur du serveur
    if (initialValue && raw !== initialValue.toString().padStart(4, '0') && raw.length === 4) {
      setHasIncoherence(true);
    } else if (initialValue && raw === initialValue.toString().padStart(4, '0')) {
      setHasIncoherence(false);
    }
    
    // Validation du pattern
    if (e.target.value !== raw) {
      validatePattern(raw, /^\d*$/, "Code", "Le code ne peut contenir que des chiffres");
    }
    
    // Validation de la longueur
    const lengthValidation = validateLength(raw, 4, "Code", {
      warningThreshold: 1.0,
      infoThreshold: 0.75,
      showCount: false
    });
    
    if (lengthValidation.shouldTruncate) {
      const truncated = raw.slice(0, 4);
      e.target.value = truncated;
      setValue(name, truncated, { shouldValidate: true, shouldDirty: true });
      setCurrentValue(truncated);
    } else {
      e.target.value = raw;
      setValue(name, raw, { shouldValidate: true, shouldDirty: true });
      setCurrentValue(raw);
    }
  };

  const getValueStatus = () => {
    // Validation stricte : doit être exactement 4 chiffres
    if (currentValue.length > 0 && currentValue.length !== 4) {
      return { 
        type: "error", 
        message: "❌ Le code doit contenir exactement 4 chiffres" 
      };
    }
    
    // Si le code est complet
    if (currentValue.length === 4) {
      const currentNum = parseInt(currentValue);
      
      // Si l'utilisateur a modifié la valeur du serveur
      if (initialValue && currentValue !== initialValue.toString().padStart(4, '0')) {
        return { 
          type: "warning", 
          message: "⚠ Numéro modifié. Vérifiez qu'il n'existe pas déjà." 
        };
      }
      
      // Si c'est exactement la valeur du serveur
      return { type: "success", message: "✓ Numéro valide" };
    }
    
    return null;
  };

  const valueStatus = getValueStatus();

  // Fonction pour rétablir la valeur du serveur
  const resetToServerValue = () => {
    if (!initialValue) return;
    
    const serverValue = initialValue.toString().padStart(4, '0');
    setValue(name, serverValue, { 
      shouldValidate: true, 
      shouldDirty: true,
      shouldTouch: true 
    });
    
    setCurrentValue(serverValue);
    setHasIncoherence(false);
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
        pattern="\d{4}"
        placeholder={placeholder}
        {...register(name)}
        id={name}
        onInput={handleInput}
        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none transition-colors ${
          errors[name] 
            ? "focus:ring-red-500 focus:border-red-700 border-red-500" 
            : valueStatus?.type === "warning"
            ? "border-yellow-500 focus:border-yellow-500 focus:ring-yellow-500"
            : valueStatus?.type === "error"
            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
            : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
        }`}
      />
      
      {/* Messages d'état */}
      <div className="min-h-[1.75rem] mt-1 space-y-0.5 transition-opacity duration-300">
        {errors[name]?.message ? (
          <span className="text-red-600 text-xs block">{errors[name].message}</span>
        ) : valueStatus ? (
          <span className={`text-xs block ${
            valueStatus.type === "success" ? "text-green-600" :
            valueStatus.type === "warning" ? "text-yellow-700" :
            "text-red-600"
          }`}>
            {valueStatus.message}
          </span>
        ) : null}
        
        {/* Info format */}
        <span className="text-gray-500 text-xs block">
          Format: 4 chiffres 
          {initialValue && ` - Numéro valide: ${initialValue.toString().padStart(4, '0')}`}
          {!initialValue && " - Chargement du numéro..."}
        </span>
      </div>

      {/* Bouton de correction seulement si l'utilisateur modifie la valeur du serveur */}
      {hasIncoherence && initialValue && (
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
          <div className="text-yellow-700 mb-1">
            <strong>Modification détectée :</strong> Vous avez modifié le numéro valide.
          </div>
          <button
            type="button"
            onClick={resetToServerValue}
            className="text-xs bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded border border-green-300 transition-colors"
          >
            ↶ Rétablir le numéro valide : {initialValue.toString().padStart(4, '0')}
          </button>
        </div>
      )}
    </div>
  );
}

export default ValidatedCodeInput;