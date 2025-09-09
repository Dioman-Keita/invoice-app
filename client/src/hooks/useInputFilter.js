// hooks/useInputFilters.js
import useProgressiveValidation from './useProgressiveValidation';

export const useInputFilters = () => {
  const { validateLength } = useProgressiveValidation();

  const createLengthFilter = (maxLength, fieldName) => {
    return (e) => {
      const input = e.target;
      const value = input.value;
      
      const validation = validateLength(value, maxLength, fieldName, {
        warningThreshold: 0.8, // 80% de la limite
        infoThreshold: 0.6,    // 60% de la limite
        showCount: true,
        cooldownMs: 3000       // 3 secondes entre les notifications
      });
      
      if (validation.shouldTruncate) {
        input.value = value.slice(0, maxLength);
      }
    };
  };

  return {
    filterFirstName: createLengthFilter(50, "Le prénom"),
    filterLastName: createLengthFilter(50, "Le nom"),
    filterEmail: createLengthFilter(50, "L'email"),
    filterEmployeeId: createLengthFilter(5, "L'identifiant CMDT"),
    filterPassword: createLengthFilter(20, "Le mot de passe"),
    filterConfirmPassword: createLengthFilter(20, "La confirmation de mot de passe")
  };
};