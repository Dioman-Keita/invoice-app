import { useCallback, useRef } from 'react';
import useToastFeedback from './useToastFeedBack.js';

export const useDateValidation = () => {
  const { warning } = useToastFeedback();
  const lastNotificationRef = useRef({});
  const notificationTimeoutsRef = useRef({});

  const validateDateOrder = useCallback((invoiceDate, arrivalDate, options = {}) => {
    const {
      showWarning = true,
      cooldownMs = 5000, // 5 seconds between notifications
      fieldNames = {
        invoice: "Date de la facture",
        arrival: "Date d'arrivée du courrier"
      }
    } = options;

    // Check if both dates are present and properly formatted
    if (!invoiceDate || !arrivalDate) {
      return { isValid: true };
    }

    // Check date format (DD/MM/YYYY)
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateRegex.test(invoiceDate) || !dateRegex.test(arrivalDate)) {
      return { isValid: true }; // Let Zod handle invalid formats
    }

    // Convert dates to Date objects
    const invoiceDateObj = new Date(invoiceDate.split('/').reverse().join('-'));
    const arrivalDateObj = new Date(arrivalDate.split('/').reverse().join('-'));

    // Check if dates are valid
    if (isNaN(invoiceDateObj.getTime()) || isNaN(arrivalDateObj.getTime())) {
      return { isValid: true }; // Let Zod handle invalid dates
    }

    // Compare dates - only if both are valid
    if (arrivalDateObj < invoiceDateObj) {
      const fieldKey = `date_order_${invoiceDate}_${arrivalDate}`;
      const now = Date.now();
      const lastNotification = lastNotificationRef.current[fieldKey] || 0;

      // Check if in cooldown
      if (now - lastNotification < cooldownMs) {
        return { isValid: false };
      }

      if (showWarning) {
        // Clean up previous timeouts
        if (notificationTimeoutsRef.current[fieldKey]) {
          clearTimeout(notificationTimeoutsRef.current[fieldKey]);
        }

        // Schedule notification with delay
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
