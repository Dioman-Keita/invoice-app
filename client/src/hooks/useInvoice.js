import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import api from '../services/api';

export default function useInvoice() {
  const [lastInvoiceNumber, setLastInvoiceNumber] = useState('0000');
  const location = useLocation();
  
  const getLastInvoiceNum = useCallback(async (force = false) => {
    try {
      console.log('🔄 Appel API last-invoice-num', { force });
      const response = await api.get('/invoices/last-invoice-num');
      
      if (response?.success === true) {
        const newInvoiceNum = response?.data?.lastInvoiceNum || '0000';
        console.log('📦 Nouveau numéro reçu:', newInvoiceNum);
        setLastInvoiceNumber(newInvoiceNum);
        return newInvoiceNum;
      } else {
        setLastInvoiceNumber('0000');
        return '0000';
      }
    } catch (error) {
      setLastInvoiceNumber('0000');
      console.log('❌ Erreur récupération numéro:', error?.response?.data?.message || error.message);
      return '0000';
    }
  }, []);

  // Appel initial
  useEffect(() => {
    if (location.pathname === '/facture') {
      getLastInvoiceNum();
    }
  }, [location.pathname, getLastInvoiceNum]);

  const saveInvoice = useCallback(async (invoiceData) => {
    try {
      const response = await api.post('/invoices', invoiceData);
      if (response.success === true) {
        console.log('✅ Facture créée, mise à jour du numéro...');
        
        // Attendre un peu pour que le backend ait le temps de traiter
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Recharger le dernier numéro
        const newNum = await getLastInvoiceNum(true);
        console.log('🎯 Numéro après création:', newNum);
        
        return {
          success: true,
          message: response?.message || 'Facture envoyée avec succès',
          newInvoiceNumber: newNum
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
  }, [getLastInvoiceNum]);

  return { 
    saveInvoice,
    getLastInvoiceNum,
    lastInvoiceNumber
  };
}