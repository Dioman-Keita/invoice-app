import { useFormContext } from "react-hook-form";
import { useCallback, useMemo } from "react";

function ValidatedAmountInput({
    name = "invoice_amount",
    label = "Montant de la facture",
    placeholder = "ex. 1 000 000"
}) {
    const {
        register,
        formState: { errors },
        setValue,
        watch,
        trigger
    } = useFormContext();

    // Utiliser useWatch pour une surveillance performante
    const fieldValue = watch(name);

    // Mémoïser les fonctions de formatage
    const formatWithSpaces = useCallback((value) => {
        if (!value) return "";

        // Séparer la partie entière de la partie décimale
        const parts = value.toString().split(/[.,]/);
        const integerPart = parts[0].replace(/[^\d]/g, "");
        const decimalPart = parts.length > 1 ? parts[1].substring(0, 3) : null;

        const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");

        return decimalPart !== null ? `${formattedInteger},${decimalPart}` : formattedInteger;
    }, []);

    const formatNumberWith0 = useCallback((value) => {
        if (value && value.length > 1 && value[0] === '0' && value[1] !== ',' && value[1] !== '.') {
            return value.replace(/^0+/, '');
        }
        return value;
    }, []);

    // Calculer la valeur d'affichage mémoïsée
    const displayValue = useMemo(() => {
        if (!fieldValue) return "";
        const valueToFormat = typeof fieldValue === 'number' ? fieldValue.toString() : fieldValue;
        return formatWithSpaces(valueToFormat);
    }, [fieldValue, formatWithSpaces]);

    const MAX_AMOUNT = 100_000_000_000;

    // Gérer les changements de manière optimisée
    const handleChange = useCallback((e) => {
        let inputValue = e.target.value;

        // Autoriser seulement chiffres, espace (pour le formatage), point et virgule
        let cleanValue = inputValue.replace(/[^\d.,]/g, "");

        // Remplacer le point par la virgule pour la saisie (unifier le séparateur visuel)
        cleanValue = cleanValue.replace('.', ',');

        // Gérer les multiples virgules (garder seulement la première)
        const parts = cleanValue.split(',');
        if (parts.length > 2) {
            cleanValue = parts[0] + ',' + parts.slice(1).join('');
        }

        // Limiter à 3 décimales
        if (parts.length > 1) {
            cleanValue = parts[0] + ',' + parts[1].substring(0, 3);
        }

        // Nettoyer les zéros inutiles au début
        cleanValue = formatNumberWith0(cleanValue);

        if (!cleanValue || cleanValue === ",") {
            setValue(name, "", { shouldValidate: true, shouldDirty: true });
            return;
        }

        // Pour la valeur stockée dans RHF, on normalise avec un point
        const normalizedValue = cleanValue.replace(',', '.');
        const numeric = parseFloat(normalizedValue);

        if (numeric > MAX_AMOUNT) {
            setValue(name, MAX_AMOUNT.toString(), { shouldValidate: true, shouldDirty: true });
        } else {
            setValue(name, normalizedValue, { shouldValidate: true, shouldDirty: true });
        }
    }, [name, setValue, formatNumberWith0]);

    // Gérer le blur pour la validation
    const handleBlur = useCallback(() => {
        trigger(name);
    }, [name, trigger]);

    // Enregistrer le champ avec react-hook-form
    const { ref, ...inputProps } = register(name);

    return (
        <div className="w-full md:w-[48%] mb-4">
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
                {label}
            </label>
            <input
                {...inputProps}
                type="text"
                inputMode="decimal"
                pattern="[0-9\s,.]*"
                placeholder={placeholder}
                value={displayValue}
                id={name}
                ref={ref}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none ${errors[name]
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