import { useState, useCallback, useRef, useEffect } from 'react';
import api from '../../services/api.js';
import {
    isValidAccountNumber,
    normalizeAccountNumber,
    formatAccountCanonical
} from "../../utils/formatAccountNumber";

// Constants to avoid magic strings
const SEARCH_TYPES = {
    GLOBAL: 'supplier:global',
    ANY_FIELD: 'supplier:anyField',
    CONFLICT_GLOBAL: 'conflict:global',
    CONFLICT_PHONE: 'conflict:phone',
    CONFLICT_ACCOUNT: 'conflict:accountNumber',
};

const CONFLICT_TYPES = {
    PHONE: 'phone',
    ACCOUNT_NUMBER: 'account_number',
    BOTH: 'both'
};

// Validation helpers
const validatePhone = (phone) => /^\+223(\s\d{2}){4}$/.test(phone);
const validateAccountNumber = (accountNumber) =>
    isValidAccountNumber(normalizeAccountNumber(accountNumber));

export function useSupplierAutocomplete() {
    const [suppliersData, setSuppliersData] = useState({
        suppliersSuggestions: [],
        message: null
    });

    const [supplierConflictingData, setSupplierConflictingData] = useState({
        conflictType: null,
        existingSupplierList: [],
        message: null,
        isGlobalVerification: false,
        isPhoneVerification: false,
        isAccountVerification: false,
    });

    const [loading, setLoading] = useState(false);
    const searchRef = useRef(null);

    // Helper function to deduplicate suppliers
    const getUniqueConflictingSuppliers = (conflictData) => {
        const suppliersMap = new Map();

        // Add existingSupplier if it exists
        if (conflictData.existingSupplier && conflictData.existingSupplier.id) {
            suppliersMap.set(conflictData.existingSupplier.id, conflictData.existingSupplier);
        }

        // Add conflictingSuppliers while avoiding duplicates
        if (conflictData.conflictingSuppliers && Array.isArray(conflictData.conflictingSuppliers)) {
            conflictData.conflictingSuppliers.forEach(supplier => {
                if (supplier.id && !suppliersMap.has(supplier.id)) {
                    suppliersMap.set(supplier.id, supplier);
                }
            });
        }

        return Array.from(suppliersMap.values());
    };

    // Helper pour les validations communes
    const validateField = (field, value) => {
        if (!field || !value) {
            throw new Error(`Field and value are required. field: "${field}", value: "${value}"`);
        }

        switch (field) {
            case 'phone':
                if (!validatePhone(value)) {
                    throw new Error(`Phone has invalid format: "${value}"`);
                }
                break;
            case 'accountNumber':
                if (!validateAccountNumber(value)) {
                    throw new Error(`Account number has invalid format: "${value}"`);
                }
                break;
            case 'name':
                if (value.trim().length < 2) {
                    throw new Error(`Field must be at least 2 characters. field: "${value}"`);
                }
                break;
            default:
                throw new Error(`Unknown field "${field}"`);
        }
    };

    // Helper to format values according to field
    const formatFieldValue = (field, value) => {
        return field === 'accountNumber' ? formatAccountCanonical(value) : value;
    };

    // Helper to manage loading and error states
    const withLoading = async (asyncFn) => {
        setLoading(true);
        try {
            await asyncFn();
        } catch (error) {
            console.error('Supplier autocomplete error:', error);
            setSuppliersData(prev => ({
                ...prev,
                message: 'Erreur lors de la recherche'
            }));
        } finally {
            setLoading(false);
        }
    };

    const getSupplierList = useCallback(async (field, value) => {
        await withLoading(async () => {
            try {
                validateField(field, value);

                const formattedValue = formatFieldValue(field, value);
                const serverField = field === 'accountNumber' ? 'account_number' : field;

                const response = await api.get(
                    `/suppliers/search?field=${encodeURIComponent(serverField)}&value=${encodeURIComponent(formattedValue)}`
                );

                console.log('Search response:', response);

                if (response?.success) {
                    setSuppliersData({
                        suppliersSuggestions: response.data || [],
                        message: response.message || null,
                    });
                } else {
                    setSuppliersData({
                        suppliersSuggestions: [],
                        message: response?.message || 'Aucun résultat'
                    });
                }
            } catch (error) {
                console.error('Search error:', error);
                setSuppliersData({
                    suppliersSuggestions: [],
                    message: 'Erreur lors de la recherche'
                });
            }
        });
    }, []);

    const getSupplierListByAnyField = useCallback(async (field, value) => {
        await withLoading(async () => {
            try {
                validateField(field, value);

                const formattedValue = formatFieldValue(field, value);
                const serverField = field === 'accountNumber' ? 'account_number' : field;

                if (field === 'name') {
                    const response = await api.get(
                        `/suppliers/find?name=${encodeURIComponent(formattedValue)}`
                    );

                    if (response?.success) {
                        setSuppliersData({
                            suppliersSuggestions: response.data || [],
                            message: response.message || null,
                        });
                    } else {
                        setSuppliersData({
                            suppliersSuggestions: [],
                            message: response?.message || 'Aucun résultat'
                        });
                    }
                } else {
                    const response = await api.get(
                        `/suppliers/search?field=${encodeURIComponent(serverField)}&value=${encodeURIComponent(formattedValue)}`
                    );

                    if (response?.success) {
                        setSuppliersData({
                            suppliersSuggestions: response.data || [],
                            message: response.message || null,
                        });
                    } else {
                        setSuppliersData({
                            suppliersSuggestions: [],
                            message: response?.message || 'Aucun résultat'
                        });
                    }
                }
            } catch (error) {
                console.error('Search by any field error:', error);
                setSuppliersData({
                    suppliersSuggestions: [],
                    message: 'Erreur lors de la recherche'
                });
            }
        });
    }, []);

    // Helper for conflict configuration
    const setConflictData = (config) => {
        setSupplierConflictingData(prev => ({
            ...prev,
            ...config
        }));
    };

    const verifySupplierGlobalConflicts = useCallback(async (accountNumber, phone) => {
        await withLoading(async () => {
            try {
                if (!accountNumber || !phone) {
                    throw new Error(`AccountNumber and phone are required. accountNumber: "${accountNumber}", phone: "${phone}"`);
                }

                validateField('accountNumber', accountNumber);
                validateField('phone', phone);

                const response = await api.get(
                    `/suppliers/verify-conflicts?account_number=${encodeURIComponent(formatAccountCanonical(accountNumber))}&phone=${encodeURIComponent(phone)}`
                );

                if (response?.success) {
                    setConflictData({
                        existingSupplierList: [],
                        message: null,
                        conflictType: null,
                        isGlobalVerification: true,
                        isPhoneVerification: false,
                        isAccountVerification: false,
                    });
                }
            } catch (error) {
                console.log('Conflict error:', error);
                const conflictData = error?.response?.data?.error || error?.response?.data || {};

                // CORRECTION : Utiliser la fonction de déduplication
                const conflictingSuppliers = getUniqueConflictingSuppliers(conflictData);

                setConflictData({
                    existingSupplierList: conflictingSuppliers,
                    message: error?.response?.data?.message || 'Conflit détecté',
                    conflictType: conflictData.conflictType || null,
                    isGlobalVerification: true,
                    isPhoneVerification: false,
                    isAccountVerification: false,
                });
            }
        });
    }, []);

    const verifySupplierPhoneConflicts = useCallback(async (phone) => {
        await withLoading(async () => {
            try {
                validateField('phone', phone);

                const response = await api.get(`/suppliers/verify-conflicts?phone=${encodeURIComponent(phone)}`);

                if (response?.success) {
                    setConflictData({
                        existingSupplierList: [],
                        message: null,
                        conflictType: null,
                        isPhoneVerification: true,
                        isAccountVerification: false,
                        isGlobalVerification: false,
                    });
                }
            } catch (error) {
                const conflictData = error?.response?.data?.error || error?.response?.data || {};

                // CORRECTION : Utiliser la fonction de déduplication
                const conflictingSuppliers = getUniqueConflictingSuppliers(conflictData);

                setConflictData({
                    existingSupplierList: conflictingSuppliers,
                    message: error?.response?.data?.message || 'Conflit détecté',
                    conflictType: conflictData.conflictType || null,
                    isPhoneVerification: true,
                    isAccountVerification: false,
                    isGlobalVerification: false,
                });
            }
        });
    }, []);

    const verifySupplierAccountNumberConflict = useCallback(async (accountNumber) => {
        await withLoading(async () => {
            try {
                validateField('accountNumber', accountNumber);

                const response = await api.get(
                    `/suppliers/verify-conflicts?account_number=${encodeURIComponent(formatAccountCanonical(accountNumber))}`
                );

                if (response?.success) {
                    setConflictData({
                        existingSupplierList: [],
                        message: null,
                        conflictType: null,
                        isPhoneVerification: false,
                        isAccountVerification: true,
                        isGlobalVerification: false,
                    });
                }
            } catch (error) {
                const conflictData = error?.response?.data?.error || error?.response?.data || {};

                // CORRECTION : Utiliser la fonction de déduplication
                const conflictingSuppliers = getUniqueConflictingSuppliers(conflictData);

                setConflictData({
                    existingSupplierList: conflictingSuppliers,
                    message: error?.response?.data?.message || 'Conflit détecté',
                    conflictType: conflictData.conflictType || null,
                    isPhoneVerification: false,
                    isAccountVerification: true,
                    isGlobalVerification: false,
                });
            }
        });
    }, []);

    const debouncedSearchSupplier = useCallback((field, value, searchType) => {
        if (searchRef.current) {
            clearTimeout(searchRef.current);
        }

        searchRef.current = setTimeout(async () => {
            if (!field || !searchType || !value) {
                return;
            }

            console.log('Searching:', { field, value, searchType });

            const searchHandlers = {
                [SEARCH_TYPES.GLOBAL]: () => getSupplierList(field, value),
                [SEARCH_TYPES.ANY_FIELD]: () => getSupplierListByAnyField(field, value),
                [SEARCH_TYPES.CONFLICT_GLOBAL]: () => {
                    const [accountValue, phoneValue] = value.split(',');
                    return verifySupplierGlobalConflicts(accountValue, phoneValue);
                },
                [SEARCH_TYPES.CONFLICT_PHONE]: () => {
                    if (field !== 'phone') {
                        throw new Error(`Field "${field}" is invalid for phone conflict verification`);
                    }
                    return verifySupplierPhoneConflicts(value);
                },
                [SEARCH_TYPES.CONFLICT_ACCOUNT]: () => {
                    if (field !== 'accountNumber') {
                        throw new Error(`Field "${field}" is invalid for account number conflict verification`);
                    }
                    return verifySupplierAccountNumberConflict(value);
                }
            };

            const handler = searchHandlers[searchType];
            if (!handler) {
                console.error(`Unsupported search type: ${searchType}`);
                return;
            }

            try {
                await handler();
            } catch (error) {
                console.error('Search error:', error);
            }
        }, 500);
    }, [
        getSupplierList,
        getSupplierListByAnyField,
        verifySupplierGlobalConflicts,
        verifySupplierPhoneConflicts,
        verifySupplierAccountNumberConflict
    ]);

    useEffect(() => {
        return () => {
            if (searchRef.current) {
                clearTimeout(searchRef.current);
            }
        };
    }, []);

    const clearSuggestions = useCallback(() => {
        setSuppliersData({
            suppliersSuggestions: [],
            message: null,
        });
    }, []);

    const clearAllConflicts = useCallback(() => {
        setSupplierConflictingData({
            conflictType: null,
            existingSupplierList: [],
            message: null,
            isPhoneVerification: false,
            isGlobalVerification: false,
            isAccountVerification: false,
        });
    }, []);

    const clearPhoneConflicts = useCallback(() => {
        if (supplierConflictingData.conflictType !== CONFLICT_TYPES.PHONE) {
            console.warn(`Unable to delete phone conflicts. Conflict type = ${supplierConflictingData.conflictType}`);
            return;
        }
        clearAllConflicts();
    }, [supplierConflictingData.conflictType, clearAllConflicts]);

    const clearAccountNumberConflicts = useCallback(() => {
        if (supplierConflictingData.conflictType !== CONFLICT_TYPES.ACCOUNT_NUMBER) {
            console.warn(`Unable to delete account number conflicts. Conflict type = ${supplierConflictingData.conflictType}`);
            return;
        }
        clearAllConflicts();
    }, [supplierConflictingData.conflictType, clearAllConflicts]);

    return {
        isLoading: loading,
        searchSupplier: debouncedSearchSupplier,
        supplierConflictingData,
        suppliersSuggestions: suppliersData.suppliersSuggestions,
        supplierList: suppliersData.suppliersSuggestions,
        suppliersData,
        clearAllConflicts,
        clearPhoneConflicts,
        clearAccountNumberConflicts,
        clearSuggestions,
        conflictType: supplierConflictingData.conflictType,
    };
}