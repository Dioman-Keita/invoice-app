import { useRef, useEffect, useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { useInputFilters } from "../../hooks/ui/useInputFilter.js";
import { useSupplierAutocomplete } from "../../hooks/ui/useSupplierAutoComplete.js";
import useProgressiveValidation from "../../hooks/ui/useProgressiveValidation.js";
import useToastFeedback from "../../hooks/ui/useToastFeedBack.js";

function ValidateSupplierInput() {
    const {
        register,
        formState: { errors },
        setValue,
        trigger,
        watch,
    } = useFormContext();
    const {
        isLoading,
        searchSupplier,
        supplierConflictingData,
        supplierList,
        clearAllConflicts,
        clearPhoneConflicts,
        clearAccountNumberConflicts,
        clearSuggestions,
        conflictType
    } = useSupplierAutocomplete();

    const { validateLength } = useProgressiveValidation();
    const { filterPhone } = useInputFilters();
    const { error: showError } = useToastFeedback();

    const lastToastTime = useRef(0);
    const TOAST_COOLDOWN = 3000;

    const supplierName = watch('supplier_name');
    const supplierAccount = watch('supplier_account_number');
    const supplierPhone = watch('supplier_phone');

    const handleNameInput = useCallback((e) => {
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
    }, [validateLength, setValue]);

    const handleAccountNumberInput = useCallback((e) => {
        const rawValue = e.target.value;

        // Nettoyage : supprimer les espaces et caractères spéciaux
        const cleanedValue = rawValue.replace(/[\s\-_]+/g, '');

        // Bloquer la saisie au-delà de 34 caractères
        if (cleanedValue.length > 34) {
            const now = Date.now();
            if (now - lastToastTime.current > TOAST_COOLDOWN) {
                showError("Le numéro de compte ne peut pas dépasser 34 caractères");
                lastToastTime.current = now;
            }
            // Tronquer à 34 caractères
            const truncatedValue = cleanedValue.slice(0, 34);
            e.target.value = truncatedValue;
            setValue('supplier_account_number', truncatedValue, { shouldValidate: true });
            return;
        }

        // Validation en temps réel des caractères autorisés
        const invalidChars = /[^A-Za-z0-9]/g;
        if (invalidChars.test(cleanedValue)) {
            // Filtrer les caractères non autorisés
            const filteredValue = cleanedValue.replace(invalidChars, '');
            e.target.value = filteredValue;
            setValue('supplier_account_number', filteredValue, { shouldValidate: true });

            const now = Date.now();
            if (now - lastToastTime.current > TOAST_COOLDOWN) {
                showError("Le numéro de compte ne peut contenir que des lettres et chiffres");
                lastToastTime.current = now;
            }
            return;
        }

        // Convertir en majuscules pour la cohérence
        const finalValue = cleanedValue.toUpperCase();
        e.target.value = finalValue;
        setValue('supplier_account_number', finalValue, { shouldValidate: true });

        // Déclencher la validation Zod
        setTimeout(() => trigger('supplier_account_number'), 0);
    }, [setValue, trigger, showError]);

    const handlePhoneInput = useCallback((e) => {
        filterPhone(e);
        const value = e.target.value;
        setValue('supplier_phone', value, { shouldValidate: true });
        setTimeout(() => trigger('supplier_phone'), 0);
    }, [filterPhone, setValue, trigger]);

    // Validation proactive des données
    useEffect(() => {
        const validateSupplierData = async () => {
            if (supplierName && supplierName.length >= 2) {
                await trigger('supplier_name');
            }
            if (supplierAccount && supplierAccount.length >= 6) {
                await trigger('supplier_account_number');
            }
            if (supplierPhone && supplierPhone.includes('+223')) {
                await trigger('supplier_phone');
            }
        };

        const timeoutId = setTimeout(validateSupplierData, 500);
        return () => clearTimeout(timeoutId);
    }, [supplierName, supplierAccount, supplierPhone, trigger]);

    return (
        <div className="mb-1">
            <div className="flex flex-col md:flex-row gap-4 w-full">

                {/* Champ Nom du fournisseur */}
                <div className="flex-1 min-w-0">
                    <label htmlFor="supplier_name" className="block text-sm font-medium text-gray-700 mb-1">
                        Nom complet du fournisseur *
                    </label>
                    <input
                        type="text"
                        placeholder="TWINS SERVICE"
                        {...register('supplier_name')}
                        onInput={handleNameInput}
                        id="supplier_name"
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none transition-colors duration-200 ${
                            errors['supplier_name']
                                ? "border-red-500 focus:ring-red-500 focus:border-red-700"
                                : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                        }`}
                        maxLength={45}
                    />
                    {errors['supplier_name'] && (
                        <p className='text-red-600 text-sm mt-1 break-words animate-fadeIn'>
                            {errors['supplier_name'].message}
                        </p>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                        {supplierName?.length || 0}/45 caractères
                    </div>
                </div>

                {/* Champ Téléphone */}
                <div className="flex-1 min-w-0">
                    <label htmlFor="supplier_phone" className="block text-sm font-medium text-gray-700 mb-1">
                        Téléphone *
                    </label>
                    <input
                        type="tel"
                        placeholder="ex. +223 77 00 11 22"
                        {...register('supplier_phone')}
                        onInput={handlePhoneInput}
                        id="supplier_phone"
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none transition-colors duration-200 ${
                            errors['supplier_phone']
                                ? "border-red-500 focus:ring-red-500 focus:border-red-700"
                                : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                        }`}
                    />
                    {errors['supplier_phone'] && (
                        <p className='text-red-600 text-sm mt-1 break-words animate-fadeIn'>
                            {errors['supplier_phone'].message}
                        </p>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                        Format requis : +223 XX XX XX XX
                    </div>
                </div>

                {/* Champ Numéro de compte */}
                <div className="flex-1 min-w-0">
                    <label htmlFor="supplier_account_number" className="block text-sm font-medium text-gray-700 mb-1">
                        Numéro de compte *
                    </label>
                    <input
                        type="text"
                        placeholder="FR1420041010050500013M02606"
                        {...register('supplier_account_number')}
                        onInput={handleAccountNumberInput}
                        id="supplier_account_number"
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none transition-colors duration-200 ${
                            errors['supplier_account_number']
                                ? "border-red-500 focus:ring-red-500 focus:border-red-700"
                                : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                        }`}
                        maxLength={34}
                    />
                    {errors['supplier_account_number'] && (
                        <p className='text-red-600 text-sm mt-1 break-words animate-fadeIn'>
                            {errors['supplier_account_number'].message}
                        </p>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                        {supplierAccount?.length || 0}/34 caractères (lettres et chiffres uniquement)
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ValidateSupplierInput;