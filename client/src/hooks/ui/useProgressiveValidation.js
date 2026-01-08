import { useCallback, useRef } from 'react';
import useToastFeedback from './useToastFeedBack.js';

export const useProgressiveValidation = () => {
  const { warning, info, error } = useToastFeedback();
  const lastNotificationRef = useRef({});
  const notificationTimeoutsRef = useRef({});

  const validateLength = useCallback((value, maxLength, fieldName, options = {}) => {
    const {
      warningThreshold = 0.8, // 80% of the limit
      infoThreshold = 0.6,    // 60% of the limit
      showCount = true,
      cooldownMs = 3000       // 3 seconds between notifications
    } = options;

    const currentLength = value.length;
    const warningLimit = Math.ceil(maxLength * warningThreshold);
    const infoLimit = Math.ceil(maxLength * infoThreshold);

    const fieldKey = `${fieldName}_${maxLength}`;
    const now = Date.now();
    const lastNotification = lastNotificationRef.current[fieldKey] || 0;

    // Check if in cooldown
    if (now - lastNotification < cooldownMs) {
      return { isValid: currentLength <= maxLength, shouldTruncate: currentLength > maxLength };
    }

    // Clean up previous timeouts
    if (notificationTimeoutsRef.current[fieldKey]) {
      clearTimeout(notificationTimeoutsRef.current[fieldKey]);
    }

    if (currentLength > maxLength) {
      const message = showCount
        ? `${fieldName} limité à ${maxLength} caractères (${currentLength}/${maxLength})`
        : `${fieldName} limité à ${maxLength} caractères`;

      // Schedule notification with delay
      notificationTimeoutsRef.current[fieldKey] = setTimeout(() => {
        error(message);
        lastNotificationRef.current[fieldKey] = Date.now();
      }, 500);

      return { isValid: false, shouldTruncate: true };
    } else if (currentLength >= warningLimit) {
      const message = showCount
        ? `Attention : ${currentLength}/${maxLength} caractères`
        : `Attention : vous approchez de la limite de ${maxLength} caractères`;

      // Schedule notification with delay
      notificationTimeoutsRef.current[fieldKey] = setTimeout(() => {
        warning(message);
        lastNotificationRef.current[fieldKey] = Date.now();
      }, 500);

      return { isValid: true, shouldTruncate: false };
    } else if (currentLength >= infoLimit) {
      const message = showCount
        ? `${currentLength}/${maxLength} caractères`
        : `Vous avez utilisé ${currentLength} caractères sur ${maxLength}`;

      // Schedule notification with delay
      notificationTimeoutsRef.current[fieldKey] = setTimeout(() => {
        info(message);
        lastNotificationRef.current[fieldKey] = Date.now();
      }, 500);

      return { isValid: true, shouldTruncate: false };
    }

    return { isValid: true, shouldTruncate: false };
  }, [warning, info, error]);

  const validatePattern = useCallback((value, pattern, fieldName, errorMessage, options = {}) => {
    const { cooldownMs = 3000 } = options;

    if (!pattern.test(value)) {
      const fieldKey = `${fieldName}_pattern`;
      const now = Date.now();
      const lastNotification = lastNotificationRef.current[fieldKey] || 0;

      // Check if in cooldown
      if (now - lastNotification < cooldownMs) {
        return { isValid: false, shouldTruncate: false };
      }

      // Clean up previous timeouts
      if (notificationTimeoutsRef.current[fieldKey]) {
        clearTimeout(notificationTimeoutsRef.current[fieldKey]);
      }

      // Schedule notification with delay
      notificationTimeoutsRef.current[fieldKey] = setTimeout(() => {
        warning(errorMessage || `${fieldName} contient des caractères invalides`);
        lastNotificationRef.current[fieldKey] = Date.now();
      }, 500);

      return { isValid: false, shouldTruncate: false };
    }
    return { isValid: true, shouldTruncate: false };
  }, [warning]);

  return {
    validateLength,
    validatePattern
  };
};

export default useProgressiveValidation;
