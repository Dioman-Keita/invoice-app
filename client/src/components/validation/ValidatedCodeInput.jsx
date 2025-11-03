import { useFormContext } from "react-hook-form";
import useProgressiveValidation from "../../hooks/ui/useProgressiveValidation.js";
import { useState, useRef, useEffect } from "react";

function ValidatedCodeInput({
                                name,
                                label,
                                placeholder,
                                initialValue,
                                resetTrigger,
                                maxLength = 12
                            }) {
    const { validateLength, validatePattern } = useProgressiveValidation();
    const {
        register,
        formState: { errors, isSubmitSuccessful },
        setValue,
        trigger
    } = useFormContext();

    const [currentValue, setCurrentValue] = useState("");
    const [hasIncoherence, setHasIncoherence] = useState(false);
    const [formatMode, setFormatMode] = useState("auto"); // "small" | "large" | "auto"
    const initializedRef = useRef(false);
    const previousResetTriggerRef = useRef(resetTrigger);

    // Déterminer le format en fonction de la valeur
    const determineFormat = (value) => {
        const num = parseInt(value, 10);
        if (isNaN(num)) return "auto";
        return num <= 999 ? "small" : "large";
    };

    // Formater la valeur selon le mode
    const formatValue = (rawValue, mode) => {
        if (!rawValue) return "";

        const num = parseInt(rawValue, 10);
        if (isNaN(num)) return rawValue;

        if (mode === "small" || (mode === "auto" && num <= 999)) {
            // Format 4 chiffres pour les petits nombres
            return num.toString().padStart(4, '0');
        } else {
            // Format libre pour les grands nombres (sans leading zeros)
            return num.toString();
        }
    };

    // Préremplir avec la valeur initiale
    useEffect(() => {
        if (initialValue) {
            const initialFormat = determineFormat(initialValue);
            const formattedValue = formatValue(initialValue, initialFormat);

            if (isSubmitSuccessful || resetTrigger !== previousResetTriggerRef.current) {
                setValue(name, formattedValue, { shouldValidate: true, shouldDirty: true });
                setCurrentValue(formattedValue);
                setFormatMode(initialFormat);
                setHasIncoherence(false);
                previousResetTriggerRef.current = resetTrigger;
            } else if (!initializedRef.current) {
                setValue(name, formattedValue, { shouldValidate: true, shouldDirty: true });
                setCurrentValue(formattedValue);
                setFormatMode(initialFormat);
                initializedRef.current = true;
            }
        }
    }, [initialValue, name, setValue, isSubmitSuccessful, resetTrigger]);


    const handleInput = (e) => {
        const raw = e.target.value.replace(/[^\d]/g, "");

        // Détecter le format en temps réel
        const currentFormat = determineFormat(raw);
        setFormatMode(currentFormat);

        // Formater automatiquement
        const formatted = formatValue(raw, currentFormat);

        // Détecter une incohérence
        if (initialValue && formatted !== formatValue(initialValue, determineFormat(initialValue))) {
            setHasIncoherence(true);
        } else {
            setHasIncoherence(false);
        }

        // Validation du pattern
        if (e.target.value !== raw) {
            validatePattern(raw, /^\d*$/, "Code", "Le code ne peut contenir que des chiffres");
        }

        // Validation de la longueur adaptative
        const targetLength = currentFormat === "small" ? 4 : maxLength;
        const lengthValidation = validateLength(raw, targetLength, "Code", {
            warningThreshold: 1.0,
            infoThreshold: 0.75,
            showCount: false
        });

        if (lengthValidation.shouldTruncate) {
            const truncated = raw.slice(0, targetLength);
            const finalFormatted = formatValue(truncated, currentFormat);
            e.target.value = finalFormatted;
            setValue(name, finalFormatted, { shouldValidate: true, shouldDirty: true });
            setCurrentValue(finalFormatted);
        } else {
            e.target.value = formatted;
            setValue(name, formatted, { shouldValidate: true, shouldDirty: true });
            setCurrentValue(formatted);
        }
    };

    const getValueStatus = () => {
        const num = parseInt(currentValue, 10);

        if (currentValue.length > 0) {
            // Validation pour petits nombres (format strict 4 chiffres)
            if (num <= 999 && currentValue.length !== 4) {
                return {
                    type: "error",
                    message: "❌ Format 4 chiffres requis (ex: 0001, 0039, 0999)"
                };
            }

            // Validation pour grands nombres (1-12 chiffres)
            if (num > 999 && (currentValue.length < 1 || currentValue.length > 12)) {
                return {
                    type: "error",
                    message: "❌ Doit contenir 1 à 12 chiffres"
                };
            }

            // Vérification limite maximale
            if (num > 999999999999) {
                return {
                    type: "error",
                    message: "❌ Numéro trop grand (max: 999 999 999 999)"
                };
            }
        }

        // Si le code est complet et valide
        if (currentValue.length > 0 && !errors[name]) {
            if (hasIncoherence) {
                return {
                    type: "warning",
                    message: "⚠ Numéro modifié. Vérifiez qu'il n'existe pas déjà."
                };
            }
            return { type: "success", message: "✓ Numéro valide" };
        }

        return null;
    };

    const valueStatus = getValueStatus();

    // Fonction pour rétablir la valeur du serveur
    const resetToServerValue = () => {
        if (!initialValue) return;

        const serverFormat = determineFormat(initialValue);
        const serverValue = formatValue(initialValue, serverFormat);

        setValue(name, serverValue, {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true
        });

        setCurrentValue(serverValue);
        setFormatMode(serverFormat);
        setHasIncoherence(false);
        trigger(name);
    };

    return (
        <div className="w-full md:w-[48%] mb-4">
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
                {label}
                <span className="ml-2 text-xs text-blue-600 font-normal">
          {formatMode === "small" ? "(Format: 0001-0999)" : "(Format: 1000-999 999 999 999)"}
        </span>
            </label>

            <input
                type="text"
                inputMode="numeric"
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

                {/* Info format dynamique */}
                <span className="text-gray-500 text-xs block">
          {formatMode === "small"
              ? "Format: 4 chiffres (0001-0999)"
              : "Format: 1-12 chiffres (1000-999 999 999 999)"}
        </span>
            </div>

            {/* Bouton de correction */}
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
                        ↶ Rétablir le numéro valide : {formatValue(initialValue, determineFormat(initialValue))}
                    </button>
                </div>
            )}
        </div>
    );
}

export default ValidatedCodeInput;