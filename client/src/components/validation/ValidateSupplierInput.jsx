// components
import { useRef, useEffect, useCallback, useState } from "react";
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
        suppliersData,
        clearAllConflicts,
        clearPhoneConflicts,
        clearAccountNumberConflicts,
        clearSuggestions,
    } = useSupplierAutocomplete();

    const { validateLength } = useProgressiveValidation();
    const { filterPhone } = useInputFilters();
    const { error: showError } = useToastFeedback();

    const lastToastTime = useRef(0);
    const TOAST_COOLDOWN = 3000;

    // États pour gérer les conflits et les sélections
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
    const [focusedSuggestionIndex, setFocusedSuggestionIndex] = useState(-1);
    const [fieldConflicts, setFieldConflicts] = useState({
        name: null,
        phone: null,
        account: null
    });
    const debounceTimers = useRef({});
    const lastCheckedValues = useRef({ phone: '', account: '', name: '' });

    const supplierName = watch('supplier_name');
    const supplierAccount = watch('supplier_account_number');
    const supplierPhone = watch('supplier_phone');

    // Références pour gérer le focus
    const nameInputRef = useRef(null);
    const suggestionsRef = useRef(null);
    const containerRef = useRef(null);

    // Déterminer ce qui doit être affiché (conflits OU suggestions)
    const shouldShowConflicts = supplierConflictingData?.existingSupplierList?.length > 0;
    const shouldShowSuggestions = isSuggestionsOpen && supplierList?.length > 0 && !shouldShowConflicts;

    const handleSupplierSelect = useCallback((supplier) => {
        setValue('supplier_name', supplier.name, { shouldValidate: true });
        setValue('supplier_phone', supplier.phone, { shouldValidate: true });
        setValue('supplier_account_number', supplier.account_number, { shouldValidate: true });
        setSelectedSupplier(supplier);
        clearSuggestions();
        clearAllConflicts();
        setIsSuggestionsOpen(false);
        setFocusedSuggestionIndex(-1);
        setFieldConflicts({ name: null, phone: null, account: null });
        lastCheckedValues.current = { phone: '', account: '', name: '' };
        debounceTimers.current = {};
    }, [setValue, clearSuggestions, clearAllConflicts]);

    // Mettre à jour les conflits par champ
    useEffect(() => {
        if (supplierConflictingData && supplierConflictingData.existingSupplierList?.length > 0) {
            const conflicts = { name: null, phone: null, account: null };

            supplierConflictingData.existingSupplierList.forEach(supplier => {
                if (supplierConflictingData.conflictType === 'phone' || supplierConflictingData.conflictType === 'both') {
                    conflicts.phone = supplier;
                }
                if (supplierConflictingData.conflictType === 'account_number' || supplierConflictingData.conflictType === 'both') {
                    conflicts.account = supplier;
                }
                if (supplierConflictingData.conflictType === 'both') {
                    conflicts.name = supplier;
                }
            });

            setFieldConflicts(conflicts);
            setIsSuggestionsOpen(false);
        } else {
            setFieldConflicts({ name: null, phone: null, account: null });
        }
    }, [supplierConflictingData]);

    /**
     * Fonction de vérification des conflits avec debounce intelligent
     */
    const checkConflicts = useCallback((field, value) => {
        if (!selectedSupplier) return;

        // Gestion spéciale pour le nom
        if (field === 'name') {
            const isAccountSame = supplierAccount === selectedSupplier.account_number;
            const isPhoneSame = supplierPhone === selectedSupplier.phone;

            if (isAccountSame && isPhoneSame && value !== selectedSupplier.name) {
                const cacheKey = 'name_global';

                if (debounceTimers.current[cacheKey]) {
                    clearTimeout(debounceTimers.current[cacheKey]);
                }

                debounceTimers.current[cacheKey] = setTimeout(() => {
                    if (supplierAccount && supplierPhone) {
                        searchSupplier('name', `${supplierAccount},${supplierPhone}`, 'conflict:global');
                    }
                }, 600);
            }
            return;
        }

        const cacheKey = field === 'phone' ? 'phone' : 'account';
        const originalValue = field === 'phone' ? selectedSupplier.phone : selectedSupplier.account_number;

        // CAS 1: Retour à la valeur originale
        if (value === originalValue) {
            if (debounceTimers.current[cacheKey]) {
                clearTimeout(debounceTimers.current[cacheKey]);
                delete debounceTimers.current[cacheKey];
            }

            setTimeout(() => {
                const isAllOriginal = supplierAccount === selectedSupplier.account_number &&
                    supplierPhone === selectedSupplier.phone;

                if (isAllOriginal) {
                    clearAllConflicts();
                }
            }, 300);

            lastCheckedValues.current[cacheKey] = value;
            return;
        }

        // CAS 2: Éviter les vérifications identiques
        if (lastCheckedValues.current[cacheKey] === value) return;

        if (debounceTimers.current[cacheKey]) {
            clearTimeout(debounceTimers.current[cacheKey]);
        }

        lastCheckedValues.current[cacheKey] = value;

        // CAS 3: Vérification avec debounce
        debounceTimers.current[cacheKey] = setTimeout(() => {
            const currentAccount = supplierAccount;
            const currentPhone = supplierPhone;

            const isAccountValid = currentAccount && currentAccount.length >= 6;
            const isPhoneValid = currentPhone && currentPhone.includes('+223') && currentPhone.replace(/\s/g, '').length === 14;

            if (!isAccountValid || !isPhoneValid) return;

            if (field === 'phone') {
                searchSupplier('phone', value, 'conflict:phone');
            } else if (field === 'accountNumber') {
                searchSupplier('accountNumber', value, 'conflict:accountNumber');
            }

            setTimeout(() => {
                const latestAccount = supplierAccount;
                const latestPhone = supplierPhone;

                const latestAccountValid = latestAccount && latestAccount.length >= 6;
                const latestPhoneValid = latestPhone && latestPhone.includes('+223') && latestPhone.replace(/\s/g, '').length === 14;

                if (latestAccountValid && latestPhoneValid) {
                    searchSupplier('phone', `${latestAccount},${latestPhone}`, 'conflict:global');
                }
            }, 400);
        }, 600);

    }, [selectedSupplier, supplierAccount, supplierPhone, searchSupplier, clearAllConflicts]);

    // CORRECTION : Gestion améliorée de la navigation clavier
    const handleKeyDown = useCallback((e) => {
        // Navigation uniquement si les suggestions sont ouvertes
        if (!shouldShowSuggestions) return;

        const isNavigationKey = e.key.startsWith('Arrow') ||
            e.key === 'Enter' ||
            e.key === 'Escape' ||
            e.key === 'Tab' ||
            e.code === 'Numpad8' ||
            e.code === 'Numpad2' ||
            e.code === 'Numpad4' ||
            e.code === 'Numpad6' ||
            e.code === 'NumpadEnter';

        if (!isNavigationKey) return;

        e.preventDefault();

        const keyMap = {
            'Numpad8': 'ArrowUp',
            'Numpad2': 'ArrowDown',
            'Numpad4': 'ArrowLeft',
            'Numpad6': 'ArrowRight',
            'NumpadEnter': 'Enter'
        };

        const mappedKey = keyMap[e.code] || e.key;

        let direction;
        let newIndex;
        let currentRow;
        let currentCol;

        switch (mappedKey) {
            case 'ArrowDown':
            case 'Numpad2':
                direction = 1;
                newIndex = focusedSuggestionIndex + direction;

                if (newIndex >= supplierList.length) {
                    setFocusedSuggestionIndex(0);
                } else {
                    setFocusedSuggestionIndex(newIndex);
                }
                break;

            case 'ArrowUp':
            case 'Numpad8':
                direction = -1;
                newIndex = focusedSuggestionIndex + direction;

                if (newIndex < 0) {
                    setFocusedSuggestionIndex(supplierList.length - 1);
                } else {
                    setFocusedSuggestionIndex(newIndex);
                }
                break;

            case 'ArrowRight':
            case 'Numpad6':
                if (focusedSuggestionIndex === -1) {
                    setFocusedSuggestionIndex(0);
                } else {
                    currentRow = Math.floor(focusedSuggestionIndex / 3);
                    currentCol = focusedSuggestionIndex % 3;

                    if (currentCol < 2) {
                        newIndex = focusedSuggestionIndex + 1;
                        if (newIndex < supplierList.length) {
                            setFocusedSuggestionIndex(newIndex);
                        }
                    } else {
                        newIndex = (currentRow + 1) * 3;
                        if (newIndex < supplierList.length) {
                            setFocusedSuggestionIndex(newIndex);
                        }
                    }
                }
                break;

            case 'ArrowLeft':
            case 'Numpad4':
                if (focusedSuggestionIndex === -1) {
                    setFocusedSuggestionIndex(supplierList.length - 1);
                } else {
                    currentRow = Math.floor(focusedSuggestionIndex / 3);
                    currentCol = focusedSuggestionIndex % 3;

                    if (currentCol > 0) {
                        newIndex = focusedSuggestionIndex - 1;
                        setFocusedSuggestionIndex(newIndex);
                    } else {
                        newIndex = (currentRow - 1) * 3 + 2;
                        if (newIndex >= 0) {
                            setFocusedSuggestionIndex(newIndex);
                        }
                    }
                }
                break;

            case 'Enter':
            case 'NumpadEnter':
                if (focusedSuggestionIndex >= 0 && focusedSuggestionIndex < supplierList.length) {
                    handleSupplierSelect(supplierList[focusedSuggestionIndex]);
                }
                break;

            case 'Escape':
                setIsSuggestionsOpen(false);
                setFocusedSuggestionIndex(-1);
                break;

            case 'Tab':
                setIsSuggestionsOpen(false);
                setFocusedSuggestionIndex(-1);
                break;

            default:
                break;
        }
    }, [shouldShowSuggestions, supplierList, focusedSuggestionIndex, handleSupplierSelect]);

    // CORRECTION MAJEURE : Gestionnaires d'input simplifiés sans modifier e.target.value
    const handleNameInput = useCallback((e) => {
        const value = e.target.value;

        const validation = validateLength(value, 45, "Nom du fournisseur", {
            warningThreshold: 0.89,
            infoThreshold: 0.67,
            showCount: true,
            cooldownMs: 4000
        });

        const finalValue = validation.shouldTruncate ? value.slice(0, 45) : value;

        // CORRECTION : Utiliser setValue uniquement
        setValue('supplier_name', finalValue, { shouldValidate: true });

        if (finalValue && finalValue.length >= 2) {
            searchSupplier('name', finalValue, 'supplier:global');
            setIsSuggestionsOpen(true);
        } else {
            clearSuggestions();
            setIsSuggestionsOpen(false);
        }

        checkConflicts('name', finalValue);
    }, [validateLength, setValue, searchSupplier, clearSuggestions, checkConflicts]);

    const handleAccountNumberInput = useCallback((e) => {
        const rawValue = e.target.value;
        const cleanedValue = rawValue.replace(/[\s\-_]+/g, '');

        if (cleanedValue.length > 34) {
            const now = Date.now();
            if (now - lastToastTime.current > TOAST_COOLDOWN) {
                showError("Le numéro de compte ne peut pas dépasser 34 caractères");
                lastToastTime.current = now;
            }
            const truncatedValue = cleanedValue.slice(0, 34);
            setValue('supplier_account_number', truncatedValue, { shouldValidate: true });
            return;
        }

        const invalidChars = /[^A-Za-z0-9]/g;
        if (invalidChars.test(cleanedValue)) {
            const filteredValue = cleanedValue.replace(invalidChars, '');
            setValue('supplier_account_number', filteredValue, { shouldValidate: true });

            const now = Date.now();
            if (now - lastToastTime.current > TOAST_COOLDOWN) {
                showError("Le numéro de compte ne peut contenir que des lettres et chiffres");
                lastToastTime.current = now;
            }
            return;
        }

        const finalValue = cleanedValue.toUpperCase();
        setValue('supplier_account_number', finalValue, { shouldValidate: true });

        setTimeout(() => trigger('supplier_account_number'), 0);

        // CORRECTION : MÊME LOGIQUE QUE LE TÉLÉPHONE
        if (finalValue && finalValue.length >= 6) {
            // 1. Vérification immédiate du compte (comme pour le téléphone)
            searchSupplier('accountNumber', finalValue, 'conflict:accountNumber');

            // 2. Vérification globale si téléphone valide (EXACTEMENT comme pour le téléphone)
            if (supplierPhone && supplierPhone.includes('+223') && supplierPhone.replace(/\s/g, '').length >= 10 && supplierPhone.replace(/\s/g, '').length < 13) {
                setTimeout(() => {
                    searchSupplier('accountNumber', `${finalValue},${supplierPhone}`, 'conflict:global');
                }, 200);
            }
        }

        checkConflicts('accountNumber', finalValue);
    }, [setValue, trigger, showError, searchSupplier, checkConflicts, supplierPhone]);

    const handlePhoneInput = useCallback((e) => {
        const filteredEvent = filterPhone(e);
        const value = filteredEvent ? filteredEvent.target.value : e.target.value;

        setValue('supplier_phone', value, { shouldValidate: true });

        setTimeout(() => trigger('supplier_phone'), 0);

        if (value && value.includes('+223')) {
            // 1. Vérification immédiate du téléphone
            searchSupplier('phone', value, 'conflict:phone');

            // 2. Vérification globale si compte valide
            if (supplierAccount && supplierAccount.length >= 6) {
                setTimeout(() => {
                    searchSupplier('phone', `${supplierAccount},${value}`, 'conflict:global');
                }, 200);
            }
        }

        checkConflicts('phone', value);
    }, [filterPhone, setValue, trigger, searchSupplier, checkConflicts, supplierAccount]);

    const handleInputFocus = useCallback(() => {
        if (supplierList?.length > 0 && !shouldShowConflicts) {
            setIsSuggestionsOpen(true);
        }

        setFocusedSuggestionIndex(-1);
    }, [supplierList, shouldShowConflicts]);

    // CORRECTION : Navigation avec les touches du pavé numérique directionnel
    useEffect(() => {
        const handleNumpadNavigation = (e) => {
            if (!shouldShowSuggestions) return;

            const numpadKeys = {
                'Numpad8': 'ArrowUp',
                'Numpad2': 'ArrowDown',
                'Numpad4': 'ArrowLeft',
                'Numpad6': 'ArrowRight',
                'NumpadEnter': 'Enter'
            };

            const mappedKey = numpadKeys[e.code];
            if (mappedKey) {
                e.preventDefault();

                const newEvent = new KeyboardEvent('keydown', {
                    key: mappedKey,
                    code: mappedKey,
                    bubbles: true,
                    cancelable: true
                });

                const activeElement = document.activeElement;
                if (activeElement) {
                    activeElement.dispatchEvent(newEvent);
                }
            }
        };

        document.addEventListener('keydown', handleNumpadNavigation);
        return () => document.removeEventListener('keydown', handleNumpadNavigation);
    }, [shouldShowSuggestions]);

    // Fermer les suggestions en cliquant à l'extérieur
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) &&
                nameInputRef.current && !nameInputRef.current.contains(event.target)) {
                setIsSuggestionsOpen(false);
                setFocusedSuggestionIndex(-1);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Nettoyage des timers au démontage
    useEffect(() => {
        return () => {
            Object.values(debounceTimers.current).forEach(timer => {
                if (timer) clearTimeout(timer);
            });
        };
    }, []);

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

    // Composant unifié pour l'affichage des conflits
    const UnifiedConflictPanel = () => {
        if (!shouldShowConflicts) return null;

        const conflictingSuppliers = supplierConflictingData.existingSupplierList;
        const conflictType = supplierConflictingData.conflictType;

        const getConflictTitle = () => {
            switch (conflictType) {
                case 'both':
                    return 'Conflit détecté sur le compte et le téléphone';
                case 'phone':
                    return 'Numéro de téléphone déjà utilisé';
                case 'account_number':
                    return 'Numéro de compte déjà utilisé';
                default:
                    return 'Conflit détecté';
            }
        };

        return (
            <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start gap-3 mb-4">
                    <div className="flex-shrink-0 mt-0.5">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-orange-800 mb-1">
                            {getConflictTitle()}
                        </h4>
                        <p className="text-sm text-orange-700">
                            {supplierConflictingData.message || 'Un fournisseur existe déjà avec ces informations.'}
                        </p>
                        <p className="text-xs text-orange-600 mt-1">
                            {conflictingSuppliers.length} fournisseur(s) en conflit
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={clearAllConflicts}
                        className="flex-shrink-0 text-orange-600 hover:text-orange-800 hover:bg-orange-100 rounded p-1 transition-colors"
                        title="Ignorer tous les conflits"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Fournisseurs en conflit */}
                <div className="space-y-3">
                    {conflictingSuppliers.map((supplier, index) => (
                        <div key={supplier.id || index} className="bg-white p-3 rounded border border-orange-100">
                            <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="text-sm font-medium text-gray-900 truncate">
                                            {supplier.name}
                                        </div>
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                            Existant
                                        </span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-4 text-xs text-gray-600">
                                        <div className="flex items-center gap-1.5">
                                            <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                            </svg>
                                            <span className="font-mono">{supplier.phone}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
                                            </svg>
                                            <span className="font-mono text-xs break-all">{supplier.account_number}</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleSupplierSelect(supplier)}
                                    className="ml-3 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors whitespace-nowrap"
                                >
                                    Utiliser
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Actions */}
                <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t border-orange-200">
                    <button
                        type="button"
                        onClick={clearAllConflicts}
                        className="px-4 py-2 text-sm bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-md transition-colors border border-orange-200"
                    >
                        Ignorer les conflits
                    </button>
                    {conflictType === 'phone' && (
                        <button
                            type="button"
                            onClick={clearPhoneConflicts}
                            className="px-4 py-2 text-sm bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-md transition-colors"
                        >
                            Ignorer seulement le téléphone
                        </button>
                    )}
                    {conflictType === 'account_number' && (
                        <button
                            type="button"
                            onClick={clearAccountNumberConflicts}
                            className="px-4 py-2 text-sm bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-md transition-colors"
                        >
                            Ignorer seulement le compte
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="mb-1" ref={containerRef}>
            {/* CORRECTION : Layout égal pour tous les champs */}
            <div className="flex flex-col md:flex-row gap-4 w-full">
                {/* Tous les champs ont la même largeur */}
                <div className="flex-1 min-w-0">
                    <label htmlFor="supplier_name" className="block text-sm font-medium text-gray-700 mb-1">
                        Nom complet du fournisseur *
                    </label>
                    <div className="relative">
                        <input
                            ref={nameInputRef}
                            type="text"
                            placeholder="TWINS SERVICE"
                            {...register('supplier_name')}
                            onInput={handleNameInput}
                            onKeyDown={handleKeyDown}
                            onFocus={handleInputFocus}
                            id="supplier_name"
                            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none transition-all duration-200 ${
                                errors['supplier_name'] || fieldConflicts.name
                                    ? "border-red-500 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            }`}
                            maxLength={45}
                        />
                        {isLoading && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            </div>
                        )}
                    </div>

                    {errors['supplier_name'] && (
                        <p className='text-red-600 text-sm mt-1 break-words animate-fadeIn'>
                            {errors['supplier_name'].message}
                        </p>
                    )}

                    <div className="flex justify-between items-center mt-1">
                        <div className="text-xs text-gray-500">
                            {supplierName?.length || 0}/45 caractères
                        </div>
                        {supplierName && supplierName.length > 0 && (
                            <div className={`text-xs ${
                                supplierName.length > 40 ? 'text-red-500' :
                                    supplierName.length > 30 ? 'text-orange-500' : 'text-green-500'
                            }`}>
                                {supplierName.length > 40 ? 'Presque plein' :
                                    supplierName.length > 30 ? 'Bon' : 'Parfait'}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    <label htmlFor="supplier_phone" className="block text-sm font-medium text-gray-700 mb-1">
                        Téléphone *
                    </label>
                    <input
                        type="tel"
                        placeholder="ex. +223 77 00 11 22"
                        {...register('supplier_phone')}
                        onInput={handlePhoneInput}
                        onKeyDown={handleKeyDown}
                        onFocus={handleInputFocus}
                        id="supplier_phone"
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none transition-all duration-200 ${
                            errors['supplier_phone'] || fieldConflicts.phone
                                ? "border-red-500 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        }`}
                    />
                    {errors['supplier_phone'] && (
                        <p className='text-red-600 text-sm mt-1 break-words animate-fadeIn'>
                            {errors['supplier_phone'].message}
                        </p>
                    )}
                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Format requis : +223 XX XX XX XX
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    <label htmlFor="supplier_account_number" className="block text-sm font-medium text-gray-700 mb-1">
                        Numéro de compte *
                    </label>
                    <input
                        type="text"
                        placeholder="FR1420041010050500013M02606"
                        {...register('supplier_account_number')}
                        onInput={handleAccountNumberInput}
                        onKeyDown={handleKeyDown}
                        onFocus={handleInputFocus}
                        id="supplier_account_number"
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none transition-all duration-200 ${
                            errors['supplier_account_number'] || fieldConflicts.account
                                ? "border-red-500 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        }`}
                        maxLength={34}
                    />
                    {errors['supplier_account_number'] && (
                        <p className='text-red-600 text-sm mt-1 break-words animate-fadeIn'>
                            {errors['supplier_account_number'].message}
                        </p>
                    )}
                    <div className="flex justify-between items-center mt-1">
                        <div className="text-xs text-gray-500">
                            {supplierAccount?.length || 0}/34 caractères
                        </div>
                        {supplierAccount && supplierAccount.length > 0 && (
                            <div className={`text-xs ${
                                supplierAccount.length >= 30 ? 'text-green-500' :
                                    supplierAccount.length >= 20 ? 'text-orange-500' : 'text-gray-500'
                            }`}>
                                {supplierAccount.length >= 30 ? 'Longueur OK' :
                                    supplierAccount.length >= 20 ? 'Moyen' : 'Trop court'}
                            </div>
                        )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Lettres et chiffres uniquement
                    </div>
                </div>
            </div>

            {/* Suggestions - Logique d'auto-complétion intacte */}
            {shouldShowSuggestions && (
                <div
                    ref={suggestionsRef}
                    className="absolute z-50 left-0 right-0 mt-3 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-80 overflow-y-auto"
                >
                    <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-gray-50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-gray-900">
                                        {supplierList.length} fournisseur(s) trouvé(s)
                                    </div>
                                    <div className="text-xs text-gray-600 mt-1">
                                        Sélectionnez un fournisseur pour remplir automatiquement les champs
                                    </div>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsSuggestionsOpen(false)}
                                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-0">
                        {supplierList.map((s, idx) => (
                            <button
                                key={s.id || idx}
                                type="button"
                                onClick={() => handleSupplierSelect(s)}
                                onMouseEnter={() => setFocusedSuggestionIndex(idx)}
                                className={`p-4 text-left transition-all duration-200 border-b border-r border-gray-100 hover:bg-blue-50 group ${
                                    focusedSuggestionIndex === idx
                                        ? 'bg-blue-50 border-l-4 border-l-blue-500 shadow-inner'
                                        : 'hover:border-l-4 hover:border-l-blue-300'
                                }`}
                            >
                                <div className="flex flex-col h-full">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-700">
                                                    {s.name}
                                                </div>
                                                {s.name === supplierName && (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 shrink-0">
                                                        Correspond
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className={`ml-2 text-sm font-medium transition-colors ${
                                            focusedSuggestionIndex === idx
                                                ? 'text-blue-600'
                                                : 'text-gray-400 group-hover:text-blue-500'
                                        }`}>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>

                                    <div className="space-y-2 flex-1">
                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                            </svg>
                                            <span className="font-mono bg-gray-50 px-2 py-1 rounded text-xs truncate">
                                                {s.phone}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
                                            </svg>
                                            <span className="font-mono bg-gray-50 px-2 py-1 rounded text-xs break-all">
                                                {s.account_number}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-3 pt-2 border-t border-gray-100">
                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                            Cliquer pour sélectionner
                                        </span>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="p-4 border-t border-gray-100 bg-gray-50">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Utilisez les flèches ↑↓←→ ou Numpad 8/2/4/6 pour naviguer, Entrée pour sélectionner
                            </div>
                            <div>
                                {supplierList.length} résultat(s)
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Conflits unifiés */}
            <UnifiedConflictPanel />

            {/* Message de feedback des suggestions */}
            {suppliersData.message && !isSuggestionsOpen && !shouldShowConflicts && (
                <div className="mt-2 text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        {suppliersData.message}
                    </div>
                </div>
            )}
        </div>
    );
}

export default ValidateSupplierInput;