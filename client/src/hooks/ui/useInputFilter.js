import useProgressiveValidation from './useProgressiveValidation.js';

export const useInputFilters = () => {
  const { validateLength, validatePattern } = useProgressiveValidation();

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
    // Identifiant CMDT : 5 à 7 chiffres, retour progressif + troncature à 7 + notification dépassement
    filterEmployeeId: (e) => {
      const input = e.target;
      const raw = input.value;
      const digitsOnly = raw.replace(/\D/g, '');
      if (raw !== digitsOnly) {
        validatePattern(digitsOnly, /^\d*$/, "L'identifiant CMDT", "Seuls les chiffres sont autorisés");
      }
      const validation = validateLength(digitsOnly, 7, "L'identifiant CMDT", {
        warningThreshold: 1.0,    // Avertir à la limite (7)
        infoThreshold: 0.8,     // Info dès ~5 caractères
        showCount: true,
        cooldownMs: 3000
      });
      
      input.value = validation.shouldTruncate ? digitsOnly.slice(0, 7) : digitsOnly;
    },
    
    // Téléphone : auto-format en "+223 XX XX XX XX" avec blocage et notification de dépassement
    filterPhone: (e) => {
      const input = e.target;
      const raw = String(input.value || '');
      // Extraire tous les chiffres
      let digits = raw.replace(/\D/g, '');
      // Retirer un éventuel préfixe 223 s'il est présent (nous allons l'ajouter formaté)
      if (digits.startsWith('223')) {
        digits = digits.slice(3);
      }
      // Limiter à 8 chiffres d'abonné
      if (digits.length > 8) {
        validatePattern(digits, /^\d{0,8}$/, 'Téléphone', 'Format +223 XX XX XX XX atteint', { cooldownMs: 2000 });
        digits = digits.slice(0, 8);
      }
      // Regrouper par 2: XX XX XX XX
      const groups = digits.match(/.{1,2}/g) || [];
      const grouped = groups.join(' ');
      const formatted = groups.length > 0 ? `+223 ${grouped}` : '+223 ';
      input.value = formatted;
    },
    filterPassword: createLengthFilter(20, "Le mot de passe"),
    filterConfirmPassword: createLengthFilter(20, "La confirmation de mot de passe")
  };
};