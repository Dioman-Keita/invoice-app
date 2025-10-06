// hooks/useSupplierAutocomplete.js
import { useState, useCallback, useRef } from 'react';
import api from '../services/api';
import useToastFeedback from './useToastFeedback';

export function useSupplierAutocomplete() {
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedField, setSelectedField] = useState(null);
    const [fieldConflicts, setFieldConflicts] = useState({
        account_number: false,
        phone: false
    });
    const [conflictData, setConflictData] = useState({
        account_number: null,
        phone: null
    });
    const [isAutoCompleted, setIsAutoCompleted] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    
    const timeoutRef = useRef(null);
    const { info, error } = useToastFeedback();

    const searchSuppliers = useCallback(async (field, value) => {
        if (!value || value.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        setLoading(true);
        setShowSuggestions(true);
        try {
            // Encoder la valeur pour l'URL (le backend va la décoder)
            const encodedValue = encodeURIComponent(value);
            console.log(`🔍 Recherche ${field}:`, { original: value, encoded: encodedValue });

            const response = await api.get(`/suppliers/search?field=${field}&value=${encodedValue}`);
            setSuggestions(response.data || []);
        } catch (err) {
            console.error('Erreur recherche fournisseurs:', err);
            setSuggestions([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const debouncedSearch = useCallback((field, value) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
            searchSuppliers(field, value);
        }, 400);
    }, [searchSuppliers]);

    const checkFieldConflicts = useCallback(async (account_number, phone, name, isFromSuggestion = false) => {
        if (isFromSuggestion) {
            setIsAutoCompleted(true);
            setFieldConflicts({ account_number: false, phone: false });
            setConflictData({ account_number: null, phone: null });
            return null;
        }
    
        setIsAutoCompleted(false);
    
        const isAccountComplete = account_number?.length === 12;
        const isPhoneComplete = phone?.replace(/\D/g, '').length >= 8 && phone?.includes('+223');
        const hasName = name && name.length >= 2;
    
        console.log('🔍 Vérification conflits - État des champs:', {
            accountComplete: isAccountComplete,
            phoneComplete: isPhoneComplete,
            hasName
        });
    
        // Cas 1: Recherche normale si seul un champ est rempli
        if ((hasName && !isAccountComplete && !isPhoneComplete) || 
            (!hasName && isAccountComplete && !isPhoneComplete) ||
            (!hasName && !isAccountComplete && isPhoneComplete)) {
            
            setFieldConflicts({ account_number: false, phone: false });
            setConflictData({ account_number: null, phone: null });
            setShowSuggestions(false);
            return null;
        }
    
        // Cas 2: Vérification de conflit seulement si au moins deux champs sont remplis
        // OU si un champ unique est complet (account de 12 chiffres ou phone avec 8+ chiffres)
        const shouldCheckConflict = (isAccountComplete && isPhoneComplete) || 
                                  (hasName && isAccountComplete) ||
                                  (hasName && isPhoneComplete) ||
                                  (isAccountComplete && !hasName) || 
                                  (isPhoneComplete && !hasName);
    
        if (!shouldCheckConflict) {
            setFieldConflicts({ account_number: false, phone: false });
            setConflictData({ account_number: null, phone: null });
            setShowSuggestions(false);
            return null;
        }
    
        try {
            // NOUVELLE APPROCHE : Vérifier les deux champs séparément et accumuler les conflits
            const conflicts = [];
            const conflictSuppliers = [];
    
            // Vérifier le compte
            if (isAccountComplete && account_number) {
                const accountParams = new URLSearchParams();
                accountParams.append('account_number', encodeURIComponent(account_number));
                
                try {
                    const accountResponse = await api.get(`/suppliers/verify-conflicts?${accountParams.toString()}`);
                    if (accountResponse.data?.success === false) {
                        conflicts.push('account_number');
                        if (accountResponse.data.error?.existingSupplier) {
                            conflictSuppliers.push({
                                type: 'account_number',
                                supplier: accountResponse.data.error.existingSupplier
                            });
                        }
                    }
                } catch (accountErr) {
                    if (accountErr.response?.status === 400) {
                        conflicts.push('account_number');
                        if (accountErr.response.data?.error?.existingSupplier) {
                            conflictSuppliers.push({
                                type: 'account_number',
                                supplier: accountErr.response.data.error.existingSupplier
                            });
                        }
                    }
                }
            }
    
            // Vérifier le téléphone
            if (isPhoneComplete && phone) {
                const phoneParams = new URLSearchParams();
                phoneParams.append('phone', encodeURIComponent(phone));
                
                try {
                    const phoneResponse = await api.get(`/suppliers/verify-conflicts?${phoneParams.toString()}`);
                    if (phoneResponse.data?.success === false) {
                        conflicts.push('phone');
                        if (phoneResponse.data.error?.existingSupplier) {
                            conflictSuppliers.push({
                                type: 'phone',
                                supplier: phoneResponse.data.error.existingSupplier
                            });
                        }
                    }
                } catch (phoneErr) {
                    if (phoneErr.response?.status === 400) {
                        conflicts.push('phone');
                        if (phoneErr.response.data?.error?.existingSupplier) {
                            conflictSuppliers.push({
                                type: 'phone',
                                supplier: phoneErr.response.data.error.existingSupplier
                            });
                        }
                    }
                }
            }
    
            console.log('🔍 Conflits détectés:', conflicts);
            console.log('🔍 Fournisseurs en conflit:', conflictSuppliers);
    
            // Mettre à jour l'état des conflits
            const newFieldConflicts = {
                account_number: conflicts.includes('account_number'),
                phone: conflicts.includes('phone')
            };
    
            const newConflictData = {
                account_number: conflictSuppliers.find(c => c.type === 'account_number')?.supplier || null,
                phone: conflictSuppliers.find(c => c.type === 'phone')?.supplier || null
            };
    
            setFieldConflicts(newFieldConflicts);
            setConflictData(newConflictData);
            
            // Afficher les suggestions seulement si au moins un conflit est détecté
            if (conflicts.length > 0) {
                setShowSuggestions(true);
            } else {
                setShowSuggestions(false);
            }
    
            return conflictSuppliers.length > 0 ? conflictSuppliers[0].supplier : null;
            
        } catch (err) {
            console.error('Erreur générale vérification conflits:', err);
            setFieldConflicts({ account_number: false, phone: false });
            setConflictData({ account_number: null, phone: null });
            setShowSuggestions(false);
            return null;
        }
    }, []);

    const clearSuggestions = useCallback(() => {
        setSuggestions([]);
        setSelectedField(null);
        setShowSuggestions(false);
    }, []);

    const clearConflicts = useCallback(() => {
        setFieldConflicts({
            account_number: false,
            phone: false
        });
        setConflictData({
            account_number: null,
            phone: null
        });
        setIsAutoCompleted(false);
        setShowSuggestions(false);
    }, []);

    const clearFieldConflict = useCallback((field) => {
        setFieldConflicts(prev => ({ ...prev, [field]: false }));
        setConflictData(prev => ({ ...prev, [field]: null }));
    }, []);

    const hideSuggestions = useCallback(() => {
        setShowSuggestions(false);
    }, []);

    const markAsAutoCompleted = useCallback(() => {
        setIsAutoCompleted(true);
        setFieldConflicts({ account_number: false, phone: false });
        setConflictData({ account_number: null, phone: null });
        setShowSuggestions(false);
    }, []);

    return {
        suggestions,
        loading,
        selectedField,
        fieldConflicts,
        conflictData,
        isAutoCompleted,
        showSuggestions,
        setSelectedField,
        searchSuppliers: debouncedSearch,
        checkFieldConflicts,
        clearSuggestions,
        clearConflicts,
        clearFieldConflict,
        hideSuggestions,
        markAsAutoCompleted
    };
}