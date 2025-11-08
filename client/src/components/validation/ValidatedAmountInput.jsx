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
        const numericValue = value.toString().replace(/[^\d]/g, "");
        return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    }, []);

    const formatNumberWith0 = useCallback((value) => {
        if (value && value[0] === '0') {
            return value.replace('0', '');
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
        const inputValue = e.target.value;

        // Nettoyer et formater la valeur
        const rawValue = formatNumberWith0(inputValue.replace(/[^\d]/g, ""));

        if (!rawValue) {
            setValue(name, "", { shouldValidate: true, shouldDirty: true });
            return;
        }

        const numeric = parseInt(rawValue, 10);

        if (numeric > MAX_AMOUNT) {
            setValue(name, MAX_AMOUNT.toString(), { shouldValidate: true, shouldDirty: true });
        } else {
            setValue(name, rawValue, { shouldValidate: true, shouldDirty: true });
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
                inputMode="numeric"
                pattern="[0-9\s]*"
                placeholder={placeholder}
                value={displayValue}
                id={name}
                ref={ref}
                onChange={handleChange}
                onBlur={handleBlur}
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