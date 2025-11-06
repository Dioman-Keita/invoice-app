import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import api from '../../services/api.js';

export default function useInvoice() {
  const [lastInvoiceNumber, setLastInvoiceNumber] = useState('0000');
  const [nextNumberExpected, setNextNumberExpected] = useState(null);
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear());
  const [isLoading, setLoading] = useState(false);
  const location = useLocation();
  
  const getLastInvoiceNum = useCallback(async (force = false) => {
    try {
      console.log('🔄 Appel API last-form-num', { force });
      const response = await api.get('api/invoices/last-num');
      
      if (response?.success === true) {
        const lastInvoiceNum = response?.data?.lastInvoiceNum || '0000';
        const currentFiscalYear = response?.data?.fiscalYear || new Date().getFullYear();
        console.log('📦 Nouveau numéro reçu:', lastInvoiceNum);
        console.log('Annee fiscal recue : ', currentFiscalYear);
        setLastInvoiceNumber(lastInvoiceNum);
        setFiscalYear(currentFiscalYear);
        return lastInvoiceNum;
      } else {
        setLastInvoiceNumber('0000');
        return '0000';
      }
    } catch (error) {
      setLastInvoiceNumber('0000');
      console.log(error,  '❌ Erreur récupération numéro:', error?.response?.data?.message || error.message);
      return '0000';
    } finally {
      setLoading(false);
    }
  }, []);

  const getNextNumberExpected = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('api/invoices/next-num');
      if (response?.success ===  true) {
        const nextNumberExpected = response?.data?.nextInvoiceNum;
        setNextNumberExpected(nextNumberExpected);
      }
    } catch (error) {
      setLoading(false);
      const isBackendMessage = error?.response?.status >= 400 &&
                               error?.response?.status <= 500
      if (isBackendMessage) {
        setNextNumberExpected(error?.response?.data?.nextInvoiceNum || '----');
      } else {
        setNextNumberExpected('Une erreur interne est survenue');
        console.log('backend error : ', error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Appel initial
  useEffect(() => {
    if (location.pathname === '/facture') {
      getLastInvoiceNum();
      getNextNumberExpected();
    }
  }, [location.pathname, getLastInvoiceNum, getNextNumberExpected]);

  const saveInvoice = useCallback(async (invoiceData) => {
    try {
      setLoading(true);
      const response = await api.post('api/invoices', invoiceData);
      if (response.success === true) {
        console.log('✅ Facture créée, mise à jour du numéro...');
        
        // Attendre un peu pour que le backend ait le temps de traiter
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Recharger le dernier numéro
        const newNum = await getLastInvoiceNum(true);
        await getNextNumberExpected();
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
      setLoading(false);
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
    } finally {
      setLoading(false);
    }
  }, [getLastInvoiceNum, getNextNumberExpected]);

  return { 
    saveInvoice,
    getLastInvoiceNum,
    lastInvoiceNumber,
    fiscalYear,
    nextNumberExpected,
    loading: isLoading
  };
}