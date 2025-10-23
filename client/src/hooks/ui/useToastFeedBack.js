// hooks/useToastFeedBack.js
import { useNotification } from '../../context/useNotification.js';

export default function useToastFeedback() {
  const { success, error, warning, info } = useNotification();

  return {
    success,
    error,
    warning,
    info
  };
}