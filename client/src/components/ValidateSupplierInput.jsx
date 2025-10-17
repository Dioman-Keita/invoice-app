import { useFormContext } from "react-hook-form";
import useProgressiveValidation from "../hooks/useProgressiveValidation";
import { useInputFilters } from "../hooks/useInputFilter";
import useToastFeedback from "../hooks/useToastFeedback";
import { useRef, useEffect, useState, useCallback } from "react";
import { useSupplierAutocomplete } from "../hooks/useSupplierAutoComplete";

function ValidateSupplierInput() {
  const { 
    register, 
    formState: { errors }, 
    setValue, 
    trigger, 
    watch, 
    setError, 
    clearErrors 
  } = useFormContext();
  
  const { validateLength } = useProgressiveValidation();
  const { filterPhone } = useInputFilters();
  const { info, error: showError } = useToastFeedback();
  
  const {
    suggestions,
    loading,
    selectedField,
    fieldConflicts,
    conflictData,
    isAutoCompleted,
    showSuggestions,
    setSelectedField,
    searchSuppliers,
    checkFieldConflicts,
    clearSuggestions,
    clearConflicts,
    clearFieldConflict,
    hideSuggestions,
    markAsAutoCompleted
  } = useSupplierAutocomplete();

  const lastToastTime = useRef(0);
  const TOAST_COOLDOWN = 3000;
  
  const [isCheckingConflict, setIsCheckingConflict] = useState(false);
  const lastAutoCompletedData = useRef({ name: '', account: '', phone: '' });
  const lastValidSupplier = useRef(null);
  // NOUVEAU : Référence pour suivre les erreurs persistantes
  const persistentErrors = useRef({
    account_number: false,
    phone: false
  });

  const supplierName = watch('supplier_name');
  const supplierAccount = watch('supplier_account_number');
  const supplierPhone = watch('supplier_phone');

  // Gestion intelligente des vérifications - MODIFIÉ
  useEffect(() => {
    const verifyConflicts = async () => {
      if (isAutoCompleted) return;

      const isAccountComplete = supplierAccount?.length === 12;
      const isPhoneComplete = supplierPhone?.replace(/\D/g, '').length >= 8 && supplierPhone?.includes('+223');
      const hasName = supplierName && supplierName.length >= 2;

      console.log('🔍 Vérification conflits:', {
        account: supplierAccount,
        accountComplete: isAccountComplete,
        phone: supplierPhone,
        phoneComplete: isPhoneComplete,
        name: supplierName,
        hasName: hasName
      });

      // Déterminer le type d'action à effectuer
      const shouldSearchOnly = (hasName && !isAccountComplete && !isPhoneComplete) || 
                              (!hasName && isAccountComplete && !isPhoneComplete) ||
                              (!hasName && !isAccountComplete && isPhoneComplete);

      const shouldCheckConflict = (isAccountComplete && isPhoneComplete) || 
                                 (hasName && isAccountComplete) ||
                                 (hasName && isPhoneComplete) ||
                                 (isAccountComplete && !hasName) || 
                                 (isPhoneComplete && !hasName);

      console.log('🔍 Décision:', {
        shouldSearchOnly,
        shouldCheckConflict,
        isAutoCompleted
      });

      if (shouldSearchOnly) {
        // Recherche normale sans vérification de conflit
        if (hasName) {
          setSelectedField('name');
          searchSuppliers('name', supplierName);
        } else if (isAccountComplete) {
          setSelectedField('account_number');
          searchSuppliers('account_number', supplierAccount);
        } else if (isPhoneComplete) {
          setSelectedField('phone');
          searchSuppliers('phone', supplierPhone);
        }
        // NE PAS effacer les conflits existants automatiquement
      } else if (shouldCheckConflict) {
        // Vérification de conflit - utiliser les valeurs formatées
        console.log('🔍 Déclenchement vérification conflit');
        setIsCheckingConflict(true);
        await checkFieldConflicts(supplierAccount, supplierPhone, supplierName, false);
        setIsCheckingConflict(false);
      } else {
        // Aucune action nécessaire - NE PAS effacer les conflits automatiquement
        clearSuggestions();
      }
    };

    const timeoutId = setTimeout(verifyConflicts, 600);
    return () => clearTimeout(timeoutId);
  }, [
    supplierName, 
    supplierAccount, 
    supplierPhone, 
    checkFieldConflicts, 
    clearSuggestions, 
    isAutoCompleted, 
    searchSuppliers, 
    setSelectedField
  ]);

  // Gestion des changements après auto-complétion - MODIFIÉ
  useEffect(() => {
    if (isAutoCompleted) {
      const currentData = { 
        name: supplierName, 
        account: supplierAccount, 
        phone: supplierPhone 
      };
      
      const hasChanged = currentData.name !== lastAutoCompletedData.current.name ||
                        currentData.account !== lastAutoCompletedData.current.account ||
                        currentData.phone !== lastAutoCompletedData.current.phone;
      
      if (hasChanged) {
        // Si l'utilisateur modifie un champ après auto-complétion, on sort du mode auto-complété
        // Mais on conserve les erreurs existantes
        console.log("🔄 Sortie du mode auto-complété, conservation des erreurs");
      }
    }
  }, [supplierName, supplierAccount, supplierPhone, isAutoCompleted]);

  // NOUVELLE Gestion des erreurs persistantes - REMPLACE l'ancien useEffect
  useEffect(() => {
    if (!isAutoCompleted) {
      // Réinitialiser l'erreur générale
      clearErrors('supplier_conflict');
      
      // Vérifier si c'est le même fournisseur que celui déjà sélectionné
      const isSameSupplier = lastValidSupplier.current && 
          ((fieldConflicts.account_number && conflictData.account_number && lastValidSupplier.current.id === conflictData.account_number.id) ||
           (fieldConflicts.phone && conflictData.phone && lastValidSupplier.current.id === conflictData.phone.id));

      if (isSameSupplier) {
        return;
      }

      // Gestion des erreurs de compte - PERSISTANTES
      if (fieldConflicts.account_number && conflictData.account_number) {
        setError('supplier_account_number', { 
          type: 'manual', 
          message: `Ce numéro de compte est déjà utilisé par le fournisseur "${conflictData.account_number.name}"` 
        });
        persistentErrors.current.account_number = true;
      } 
      // NE PAS effacer l'erreur automatiquement - seulement si le conflit est résolu
      else if (!fieldConflicts.account_number && persistentErrors.current.account_number) {
        // Garder l'erreur jusqu'à ce que l'utilisateur change la valeur
        console.log("💾 Conservation de l'erreur de compte");
      }

      // Gestion des erreurs de téléphone - PERSISTANTES
      if (fieldConflicts.phone && conflictData.phone) {
        setError('supplier_phone', { 
          type: 'manual', 
          message: `Ce numéro de téléphone est déjà utilisé par le fournisseur "${conflictData.phone.name}"` 
        });
        persistentErrors.current.phone = true;
      }
      // NE PAS effacer l'erreur automatiquement - seulement si le conflit est résolu
      else if (!fieldConflicts.phone && persistentErrors.current.phone) {
        // Garder l'erreur jusqu'à ce que l'utilisateur change la valeur
        console.log("💾 Conservation de l'erreur de téléphone");
      }
    } else {
      // En mode auto-complété, effacer toutes les erreurs
      clearErrors('supplier_conflict');
      clearErrors('supplier_account_number');
      clearErrors('supplier_phone');
      persistentErrors.current.account_number = false;
      persistentErrors.current.phone = false;
    }
  }, [fieldConflicts, conflictData, setError, clearErrors, isAutoCompleted]);

  // NOUVELLE fonction pour effacer les erreurs seulement quand l'utilisateur corrige vraiment
  const clearErrorIfCorrected = useCallback((fieldName, currentValue, conflictType) => {
    const hasConflict = fieldConflicts[conflictType];
    const hasPersistentError = persistentErrors.current[conflictType];
    
    // Effacer l'erreur seulement si :
    // 1. Il y avait une erreur persistante
    // 2. ET le conflit n'existe plus 
    // 3. ET l'utilisateur a modifié la valeur (champ non vide)
    if (hasPersistentError && !hasConflict && currentValue) {
      clearErrors(fieldName);
      persistentErrors.current[conflictType] = false;
      console.log(`✅ Erreur ${conflictType} corrigée par l'utilisateur`);
    }
  }, [fieldConflicts, clearErrors]);

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
    const rawDigits = e.target.value.replace(/\D/g, "");
    
    // Si l'utilisateur essaie de saisir plus de 12 chiffres
    if (rawDigits.length > 12) {
      const now = Date.now();
      if (now - lastToastTime.current > TOAST_COOLDOWN) {
        showError("Le numéro de compte ne peut pas dépasser 12 chiffres");
        lastToastTime.current = now;
      }
    }
    
    const nextVal = rawDigits.slice(0, 12);
    e.target.value = nextVal;
    setValue('supplier_account_number', nextVal, { shouldValidate: true });
    
    // Vérifier si l'utilisateur a corrigé l'erreur
    clearErrorIfCorrected('supplier_account_number', nextVal, 'account_number');
    
    // Déclencher la validation Zod
    setTimeout(() => trigger('supplier_account_number'), 0);
  }, [setValue, trigger, showError, clearErrorIfCorrected]);

  const handlePhoneInput = useCallback((e) => {
    filterPhone(e);
    const value = e.target.value;
    
    setValue('supplier_phone', value, { shouldValidate: true });
    
    // Vérifier si l'utilisateur a corrigé l'erreur
    clearErrorIfCorrected('supplier_phone', value, 'phone');
    
    setTimeout(() => trigger('supplier_phone'), 0);
  }, [filterPhone, setValue, trigger, clearErrorIfCorrected]);

  const handleSuggestionClick = useCallback((supplier) => {
    const safeSupplier = {
      name: supplier.name || '',
      account_number: supplier.account_number || '',
      phone: supplier.phone || ''
    };

    lastAutoCompletedData.current = {
      name: safeSupplier.name,
      account: safeSupplier.account_number,
      phone: safeSupplier.phone
    };

    lastValidSupplier.current = supplier;

    setValue('supplier_name', safeSupplier.name, { shouldValidate: true });
    setValue('supplier_account_number', safeSupplier.account_number, { shouldValidate: true });
    setValue('supplier_phone', safeSupplier.phone, { shouldValidate: true });
    
    // Effacer toutes les erreurs persistantes lors de la sélection
    persistentErrors.current.account_number = false;
    persistentErrors.current.phone = false;
    
    setTimeout(() => {
      trigger(['supplier_name', 'supplier_account_number', 'supplier_phone']);
    }, 0);
    
    info(`Fournisseur "${safeSupplier.name}" sélectionné`);
    clearSuggestions();
    markAsAutoCompleted();
    setSelectedField(null);
  }, [setValue, trigger, clearSuggestions, markAsAutoCompleted, info]);

  // MODIFICATION : getDisplayedSuggestions pour gérer intelligemment l'affichage
  const getDisplayedSuggestions = useCallback(() => {
    if (fieldConflicts.account_number || fieldConflicts.phone) {
      const conflictSuggestions = new Map();
      
      // Ajouter le fournisseur en conflit de compte
      if (fieldConflicts.account_number && conflictData.account_number) {
        conflictSuggestions.set(conflictData.account_number.id, {
          ...conflictData.account_number,
          conflictTypes: ['account_number']
        });
      }
      
      // Ajouter le fournisseur en conflit de téléphone
      if (fieldConflicts.phone && conflictData.phone) {
        const existing = conflictSuggestions.get(conflictData.phone.id);
        if (existing) {
          // Même fournisseur pour les deux conflits
          existing.conflictTypes.push('phone');
        } else {
          conflictSuggestions.set(conflictData.phone.id, {
            ...conflictData.phone,
            conflictTypes: ['phone']
          });
        }
      }
      
      return Array.from(conflictSuggestions.values());
    }
    
    if (selectedField && suggestions.length > 0) {
      return suggestions;
    }
    
    return [];
  }, [selectedField, suggestions, fieldConflicts, conflictData]);

  const hasSuggestions = useCallback(() => {
    return getDisplayedSuggestions().length > 0;
  }, [getDisplayedSuggestions]);

  const shouldShowPanel = useCallback(() => {
    return showSuggestions && (hasSuggestions() || loading || isCheckingConflict || fieldConflicts.account_number || fieldConflicts.phone);
  }, [showSuggestions, hasSuggestions, loading, isCheckingConflict, fieldConflicts]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const panel = document.querySelector('.suggestions-panel');
      if (panel && !panel.contains(event.target)) {
        hideSuggestions();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [hideSuggestions]);

  // MODIFICATION : SuggestionItem pour afficher tous les types de conflits
  const SuggestionItem = ({ supplier, isConflict = false }) => {
    const conflictTypes = supplier.conflictTypes || [];
    const hasMultipleConflicts = conflictTypes.length > 1;
    
    return (
      <div
        className="px-4 py-3 cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-all duration-200 group"
        onClick={() => handleSuggestionClick(supplier)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="font-medium text-gray-900 flex items-center">
              {isConflict ? (
                <svg className="w-4 h-4 text-orange-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              )}
              <span className="truncate">{supplier.name || 'Nom non disponible'}</span>
            </div>
            <div className="text-sm text-gray-600 flex flex-wrap gap-4 mt-2">
              <span className="flex items-center">
                <svg className="w-3 h-3 mr-1 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                </svg>
                {supplier.account_number || 'Non renseigné'}
              </span>
              <span className="flex items-center">
                <svg className="w-3 h-3 mr-1 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                {supplier.phone || 'Non renseigné'}
              </span>
            </div>
          </div>
          <svg className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
        
        {isConflict && (
          <div className="text-xs text-orange-600 mt-2 flex items-center bg-orange-50 px-2 py-1 rounded">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {hasMultipleConflicts ? (
              "Compte et téléphone déjà utilisés - Cliquez pour sélectionner"
            ) : (
              conflictTypes.includes('account_number') ? 
              "Compte déjà utilisé - Cliquez pour sélectionner" : 
              "Téléphone déjà utilisé - Cliquez pour sélectionner"
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mb-4 relative">
      <div className="flex flex-col md:flex-row gap-4 w-full">
        
        <div className="flex-1 min-w-0 relative">
          <label htmlFor="supplier_name" className="block text-sm font-medium text-gray-700 mb-1">
            Nom complet du fournisseur
          </label>
          <input
            type="text"
            placeholder="TWINS SERVICE"
            {...register('supplier_name')}
            onInput={handleNameInput}
            onFocus={() => setSelectedField('name')}
            id="supplier_name"
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none transition-colors duration-200 ${
              errors['supplier_name'] 
                ? "border-red-500 focus:ring-red-500 focus:border-red-700" 
                : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            }`}
          />
          {errors['supplier_name'] && (
            <p className='text-red-600 text-sm mt-1 break-words animate-fadeIn'>{errors['supplier_name'].message}</p>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <label htmlFor="supplier_phone" className="block text-sm font-medium text-gray-700 mb-1">
            Téléphone
          </label>
          <input
            type="tel"
            placeholder="ex. +223 77 00 11 22"
            {...register('supplier_phone')}
            onInput={handlePhoneInput}
            onFocus={() => setSelectedField('phone')}
            id="supplier_phone"
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none transition-colors duration-200 ${
              errors['supplier_phone'] || fieldConflicts.phone
                ? "border-red-500 focus:ring-red-500 focus:border-red-700" 
                : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            }`}
          />
          {/* AFFICHAGE DES ERREURS DE CONFLIT SOUS LE CHAMP TÉLÉPHONE */}
          {errors['supplier_phone'] && (
            <p className='text-red-600 text-sm mt-1 break-words animate-fadeIn'>{errors['supplier_phone'].message}</p>
          )}
          {fieldConflicts.phone && conflictData.phone && !errors['supplier_phone'] && (
            <p className='text-red-600 text-sm mt-1 break-words animate-fadeIn'>
              ❌ Ce numéro de téléphone est déjà utilisé par le fournisseur "{conflictData.phone.name}"
            </p>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <label htmlFor="supplier_account_number" className="block text-sm font-medium text-gray-700 mb-1">
            Numéro de compte
          </label>
          <input
            type="text"
            placeholder="ex. 000123456789"
            inputMode="numeric"
            pattern="\d{12}"
            {...register('supplier_account_number')}
            onInput={handleAccountNumberInput}
            onFocus={() => setSelectedField('account_number')}
            id="supplier_account_number"
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none transition-colors duration-200 ${
              errors['supplier_account_number'] || fieldConflicts.account_number
                ? "border-red-500 focus:ring-red-500 focus:border-red-700" 
                : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            }`}
          />
          {/* AFFICHAGE DES ERREURS DE CONFLIT SOUS LE CHAMP COMPTE */}
          {errors['supplier_account_number'] && (
            <p className='text-red-600 text-sm mt-1 break-words animate-fadeIn'>{errors['supplier_account_number'].message}</p>
          )}
          {fieldConflicts.account_number && conflictData.account_number && !errors['supplier_account_number'] && (
            <p className='text-red-600 text-sm mt-1 break-words animate-fadeIn'>
              ❌ Ce numéro de compte est déjà utilisé par le fournisseur "{conflictData.account_number.name}"
            </p>
          )}
        </div>

      </div>
      
      {shouldShowPanel() && (
        <div className="suggestions-panel mt-2 border border-gray-200 rounded-lg shadow-xl bg-white backdrop-blur-sm animate-slideDown">
          <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center">
              {fieldConflicts.account_number || fieldConflicts.phone ? (
                <>
                  <svg className="w-4 h-4 mr-2 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {fieldConflicts.account_number && fieldConflicts.phone ? 
                    "📦📞 Fournisseur existant" : 
                    fieldConflicts.account_number ? "📦 Fournisseur existant" : "📞 Fournisseur existant"}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Suggestions de fournisseurs
                </>
              )}
            </h3>
          </div>
          
          <div className="max-h-48 overflow-auto">
            {loading || isCheckingConflict ? (
              <div className="px-4 py-3 text-sm text-gray-600 flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                {isCheckingConflict ? "Vérification..." : "Recherche..."}
              </div>
            ) : (
              getDisplayedSuggestions().map(supplier => (
                <SuggestionItem 
                  key={supplier.id} 
                  supplier={supplier} 
                  isConflict={fieldConflicts.account_number || fieldConflicts.phone}
                />
              ))
            )}
          </div>
          
          {(fieldConflicts.account_number || fieldConflicts.phone) && hasSuggestions() && (
            <div className="px-4 py-2 bg-orange-50 border-t border-orange-200">
              <p className="text-xs text-orange-700 flex items-center">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Un fournisseur existe déjà avec ces informations
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ValidateSupplierInput;