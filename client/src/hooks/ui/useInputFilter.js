import useProgressiveValidation from './useProgressiveValidation.js';

export const useInputFilters = () => {
  const { validateLength, validatePattern } = useProgressiveValidation();

  const createLengthFilter = (maxLength, fieldName) => {
    return (e) => {
      const input = e.target;
      const value = input.value;

      const validation = validateLength(value, maxLength, fieldName, {
        warningThreshold: 0.8, // 80% of the limit
        infoThreshold: 0.6,    // 60% of the limit
        showCount: true,
        cooldownMs: 3000       // 3 seconds between notifications
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
    // Employee ID: 5 to 7 digits, progressive return + truncation to 7 + notification of overflow
    filterEmployeeId: (e) => {
      const input = e.target;
      const raw = input.value;
      const digitsOnly = raw.replace(/\D/g, '');
      if (raw !== digitsOnly) {
        validatePattern(digitsOnly, /^\d*$/, "L'identifiant CMDT", "Seuls les chiffres sont autorisés");
      }
      const validation = validateLength(digitsOnly, 7, "L'identifiant CMDT", {
        warningThreshold: 1.0,    // Alert at limit (7)
        infoThreshold: 0.8,     // Info at ~5 characters
        showCount: true,
        cooldownMs: 3000
      });

      input.value = validation.shouldTruncate ? digitsOnly.slice(0, 7) : digitsOnly;
    },

    // Phone: auto-format to "+223 XX XX XX XX" with blocking and overflow notification
    filterPhone: (e) => {
      const input = e.target;
      const raw = String(input.value || '');
      // Extract all digits
      let digits = raw.replace(/\D/g, '');
      // Remove any prefix 223 if present (we will add it formatted)
      if (digits.startsWith('223')) {
        digits = digits.slice(3);
      }
      // Limit to 8 subscriber digits
      if (digits.length > 8) {
        validatePattern(digits, /^\d{0,8}$/, 'Téléphone', 'Format +223 XX XX XX XX atteint', { cooldownMs: 2000 });
        digits = digits.slice(0, 8);
      }
      // Group by 2: XX XX XX XX
      const groups = digits.match(/.{1,2}/g) || [];
      const grouped = groups.join(' ');
      const formatted = groups.length > 0 ? `+223 ${grouped}` : '+223 ';
      input.value = formatted;
    },
    filterPassword: createLengthFilter(20, "Le mot de passe"),
    filterConfirmPassword: createLengthFilter(20, "La confirmation de mot de passe")
  };
};