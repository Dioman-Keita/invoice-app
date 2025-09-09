// hooks/usePhoneFormatter.js
import useProgressiveValidation from './useProgressiveValidation';

export const usePhoneFormatter = () => {
  const { validateLength } = useProgressiveValidation();

  const formatPhoneNumber = (e) => {
    const input = e.target;
    let value = input.value;

    // Si le champ est vide, on ajoute +223
    if (value === '') {
      input.value = '+223 ';
      return;
    }

    // Garder seulement les chiffres pour le comptage
    const digitsOnly = value.replace(/\D/g, '');
    
    // Compter seulement les chiffres après +223 (8 max)
    const digitsAfterPrefix = digitsOnly.length > 3 ? digitsOnly.length - 3 : 0;

    if (digitsAfterPrefix > 8) {
      validateLength(digitsAfterPrefix.toString(), 8, "Numéro de téléphone", {
        warningThreshold: 1.0, // Pas de warning avant d'atteindre 8 chiffres
        infoThreshold: 0.75,   // Info à 6 chiffres
        showCount: false,      // Pas de compteur pour éviter le stress
        cooldownMs: 3000       // 3 secondes entre les notifications
      });
      return; // On ne fait rien, l'utilisateur ne peut pas taper plus
    }

    // Formater avec +223 et espaces
    if (digitsOnly.length >= 3) {
      let formattedValue = '+223';
      const mainDigits = digitsOnly.slice(3); // Chiffres après 223
      
      if (mainDigits.length > 0) {
        formattedValue += ' ' + mainDigits.slice(0, 2);
        if (mainDigits.length > 2) {
          formattedValue += ' ' + mainDigits.slice(2, 4);
          if (mainDigits.length > 4) {
            formattedValue += ' ' + mainDigits.slice(4, 6);
            if (mainDigits.length > 6) {
              formattedValue += ' ' + mainDigits.slice(6, 8);
            }
          }
        }
      }

      if (input.value !== formattedValue) {
        input.value = formattedValue;
      }
    }
  };

  const handlePhoneKeyDown = (e) => {
    // Empêcher la suppression du "+223"
    if (e.key === 'Backspace' && e.target.value === '+223 ') {
      e.preventDefault();
    }
  };

  return { formatPhoneNumber, handlePhoneKeyDown };
};