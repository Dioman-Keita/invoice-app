import { useState, useCallback, useRef, useEffect } from 'react';
import api from '../../services/api.js';
import {
    isValidAccountNumber,
    normalizeAccountNumber,
    formatAccountCanonical
} from "../../../../common/helpers/formatAccountNumber.js";

// Constantes pour éviter les magic strings
const SEARCH_TYPES = {
    GLOBAL: 'supplier:global',
    ANY_FIELD: 'supplier:anyField',
    CONFLICT_GLOBAL: 'conflict:global',
    CONFLICT_PHONE: 'conflict:phone',
    CONFLICT_ACCOUNT: 'conflict:accountNumber'
};

const CONFLICT_TYPES = {
    PHONE: 'phone',
    ACCOUNT_NUMBER: 'account_number'
};

// Validation helpers
const validatePhone = (phone) => /^\+223(\s\d{2}){4}$/.test(phone);
const validateAccountNumber = (accountNumber) =>
    isValidAccountNumber(normalizeAccountNumber(accountNumber));

export function useSupplierAutocomplete() {
    const [suppliersList, setSuppliersList] = useState({
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
            default:
                throw new Error(`Unknown field "${field}"`);
        }
    };

    // Helper pour formater les valeurs selon le field
    const formatFieldValue = (field, value) => {
        return field === 'accountNumber' ? formatAccountCanonical(value) : value;
    };

    // Helper pour gérer les états de loading et erreurs
    const withLoading = async (asyncFn) => {
        setLoading(true);
        try {
            await asyncFn();
        } catch (error) {
            console.error(error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const getSupplierList = useCallback(async (field, value) => {
        await withLoading(async () => {
            validateField(field, value);

            const formattedValue = formatFieldValue(field, value);
            const response = await api.post(
                `/suppliers/search?field=${encodeURIComponent(field)}&value=${encodeURIComponent(formattedValue)}`
            );

            setSuppliersList(prev => ({
                ...prev,
                suppliersSuggestions: response?.success ? response.data : [],
                message: response?.success ? response?.data?.message : null,
            }));
        });
    }, []);

    const getSupplierListByAnyField = useCallback(async (field, value) => {
        await withLoading(async () => {
            validateField(field, value);

            const formattedValue = formatFieldValue(field, value);
            const response = await api.post(
                `/suppliers/find?${encodeURIComponent(field)}=${encodeURIComponent(formattedValue)}`
            );

            setSuppliersList(prev => ({
                ...prev,
                suppliersSuggestions: response?.success ? response.data : [],
                message: response?.success ? response?.data?.message : null,
            }));
        });
    }, []);

    // Helper pour la configuration des conflits
    const setConflictData = (config) => {
        setSupplierConflictingData(prev => ({
            ...prev,
            ...config
        }));
    };

    const verifySupplierGlobalConflicts = useCallback(async (accountNumber, phone) => {
        await withLoading(async () => {
            if (!accountNumber || !phone) {
                throw new Error(`AccountNumber and phone are required. accountNumber: "${accountNumber}", phone: "${phone}"`);
            }

            validateField('accountNumber', accountNumber);
            validateField('phone', phone);

            const response = await api.post(
                `/suppliers/verify-conflicts?account_number=${encodeURIComponent(formatAccountCanonical(accountNumber))}&phone=${encodeURIComponent(phone)}`
            );

            if (response?.success) {
                setConflictData({
                    existingSupplierList: response.data || [],
                    message: response?.data?.message || '',
                    conflictType: response?.conflictType || null,
                    isGlobalVerification: true,
                    isPhoneVerification: false,
                    isAccountVerification: false,
                });
            } else {
                setConflictData({
                    existingSupplierList: [],
                    message: null,
                    conflictType: null,
                    isGlobalVerification: true,
                    isPhoneVerification: false,
                    isAccountVerification: false,
                });
            }
        });
    }, []);

    const verifySupplierPhoneConflicts = useCallback(async (phone) => {
        await withLoading(async () => {
            validateField('phone', phone);

            const response = await api.post(`/suppliers/verify-conflicts?phone=${encodeURIComponent(phone)}`);

            setConflictData({
                conflictType: response?.success ? response?.conflictType : null,
                existingSupplierList: response?.success ? response.data : [],
                message: response?.success ? response?.data?.message : null,
                isPhoneVerification: true,
                isAccountVerification: false,
                isGlobalVerification: false,
            });
        });
    }, []);

    const verifySupplierAccountNumberConflict = useCallback(async (accountNumber) => {
        await withLoading(async () => {
            validateField('accountNumber', accountNumber);

            const response = await api.post(
                `/suppliers/verify-accounts?account_number=${encodeURIComponent(formatAccountCanonical(accountNumber))}`
            );

            setConflictData({
                conflictType: response?.success ? response?.conflictType : null,
                existingSupplierList: response?.success ? response.data : [],
                message: response?.success ? response?.data?.message : null,
                isPhoneVerification: false,
                isAccountVerification: true,
                isGlobalVerification: false,
            });
        });
    }, []);

    const debouncedSearchSupplier = useCallback((field, value, searchType) => {
        if (searchRef.current) {
            clearTimeout(searchRef.current);
        }

        searchRef.current = setTimeout(async () => {
            if (!field || !searchType || !value) {
                throw new Error(`Field, value and searchType are required. searchType: "${searchType}", field: "${field}", value: "${value}"`);
            }

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
                throw new Error(`Unsupported search type: ${searchType}`);
            }

            await handler();
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
        setSuppliersList(prev => ({
            ...prev,
            suppliersSuggestions: [],
            message: null,
        }));
    }, []);

    const clearAllConflicts = useCallback(() => {
        setSupplierConflictingData(prev => ({
            ...prev,
            conflictType: null,
            existingSupplierList: [],
            isPhoneVerification: false,
            isGlobalVerification: false,
            isAccountVerification: false,
        }));
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
        suppliersList,
        clearAllConflicts,
        clearPhoneConflicts,
        clearAccountNumberConflicts,
        clearSuggestions,
        conflictType: supplierConflictingData.conflictType,
    };
}