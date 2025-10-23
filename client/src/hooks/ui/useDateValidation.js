import { useCallback, useRef } from 'react';
import useToastFeedback from './useToastFeedBack.js';

export const useDateValidation = () => {
  const { warning } = useToastFeedback();
  const lastNotificationRef = useRef({});
  const notificationTimeoutsRef = useRef({});

  const validateDateOrder = useCallback((invoiceDate, arrivalDate, options = {}) => {
    const { 
      showWarning = true,
      cooldownMs = 5000, // 5 secondes entre les notifications
      fieldNames = {
        invoice: "Date de la facture",
        arrival: "Date d'arrivée du courrier"
      }
    } = options;

    // Vérifier si les deux dates sont présentes et bien formatées
    if (!invoiceDate || !arrivalDate) {
      return { isValid: true };
    }

    // Vérifier le format des dates (DD/MM/YYYY)
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateRegex.test(invoiceDate) || !dateRegex.test(arrivalDate)) {
      return { isValid: true }; // Laisser Zod gérer les formats invalides
    }

    // Convertir les dates en objets Date
    const invoiceDateObj = new Date(invoiceDate.split('/').reverse().join('-'));
    const arrivalDateObj = new Date(arrivalDate.split('/').reverse().join('-'));

    // Vérifier si les dates sont valides
    if (isNaN(invoiceDateObj.getTime()) || isNaN(arrivalDateObj.getTime())) {
      return { isValid: true }; // Laisser Zod gérer les dates invalides
    }

    // Comparer les dates - seulement si les deux sont valides
    if (arrivalDateObj < invoiceDateObj) {
      const fieldKey = `date_order_${invoiceDate}_${arrivalDate}`;
      const now = Date.now();
      const lastNotification = lastNotificationRef.current[fieldKey] || 0;

      // Vérifier si on est en cooldown
      if (now - lastNotification < cooldownMs) {
        return { isValid: false };
      }

      if (showWarning) {
        // Nettoyer les timeouts précédents
        if (notificationTimeoutsRef.current[fieldKey]) {
          clearTimeout(notificationTimeoutsRef.current[fieldKey]);
        }

        // Programmer la notification avec un délai
        notificationTimeoutsRef.current[fieldKey] = setTimeout(() => {
          warning(
            `Attention : La ${fieldNames.arrival.toLowerCase()} (${arrivalDate}) est antérieure à la ${fieldNames.invoice.toLowerCase()} (${invoiceDate}). Vérifiez la cohérence.`
          );
          lastNotificationRef.current[fieldKey] = Date.now();
        }, 1000);
      }
      
      return { isValid: false };
    }

    return { isValid: true };
  }, [warning]);

  const validateDateRange = useCallback((date, minDate, maxDate, fieldName, options = {}) => {
    const { showWarning = true } = options;

    if (!date) {
      return { isValid: true, canSubmit: true };
    }

    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return { isValid: true, canSubmit: true };
    }

    if (minDate && dateObj < new Date(minDate)) {
      if (showWarning) {
        warning(`${fieldName} ne peut pas être antérieure au ${minDate}`);
      }
      return { isValid: false, canSubmit: true };
    }

    if (maxDate && dateObj > new Date(maxDate)) {
      if (showWarning) {
        warning(`${fieldName} ne peut pas être postérieure au ${maxDate}`);
      }
      return { isValid: false, canSubmit: true };
    }

    return { isValid: true, canSubmit: true };
  }, [warning]);

  return {
    validateDateOrder,
    validateDateRange
  };
};

export default useDateValidation;
