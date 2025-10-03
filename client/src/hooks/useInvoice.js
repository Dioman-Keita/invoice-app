import { useCallback } from "react";
import api from '../services/api';

export default function useInvoice() {
  const saveInvoice = useCallback(async (invoiceData) => {
    try {
      const response = await api.post('/invoices', invoiceData);
      if (response.success === true) {
        return {
          success: true,
          message: response?.message || 'Facture envoyée avec succès'
        };
      }
      return {
        success: false,
        message: 'Une erreur inattendue est survenue. Veuillez réessayer ultérieurement'
      };
    } catch (error) {
      const isBackendMessage = error?.response?.status >= 400 &&
                               error.response?.status <= 500;
      if (isBackendMessage) {
        return {
          success: false,
          message: error?.response?.data?.message
        };
      } else {
        return {
          message: error.message || 'Une erreur interne est survenue',
          success: false
        };
      }
    }
  }, []);

  return { saveInvoice };
}
