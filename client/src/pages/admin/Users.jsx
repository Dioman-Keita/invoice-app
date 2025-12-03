import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/auth/useAuth.js';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/global/Header.jsx';
import useBackground from '../../hooks/ui/useBackground.js';
import useTitle from '../../hooks/ui/useTitle.js';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema } from '../../shema/loginShema.ts';

import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  FunnelIcon,
  UserIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon,
  EyeSlashIcon,
  EyeIcon as EyeOpenIcon,
  ExclamationTriangleIcon,
  NoSymbolIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline';
import Navbar from '../../components/navbar/Navbar.jsx';
import api from '../../services/api.js';
import Footer from '../../components/global/Footer.jsx';

function Users({ requireAuth = false }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  useTitle('CMDT - Gestion des utilisateurs');
  useBackground('bg-settings');
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [actionLoading, setActionLoading] = useState({ active: false, label: '', seconds: 0 });
  const actionTimerRef = useRef(null);

  const startAction = (label) => {
    setActionLoading({ active: true, label, seconds: 0 });
    if (actionTimerRef.current) clearInterval(actionTimerRef.current);
    actionTimerRef.current = setInterval(() => {
      setActionLoading(prev => ({ ...prev, seconds: prev.seconds + 1 }));
    }, 1000);
  };

  const handleFirstNameInput = (e) => {
    const v = e.target.value;
    e.target.value = v.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ'\-\s]/g, '').replace(/\s{2,}/g, ' ');
  };

  const handleLastNameInput = (e) => {
    const v = e.target.value;
    e.target.value = v.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ'\-\s]/g, '').replace(/\s{2,}/g, ' ');
  };

  const handleEmailInput = (e) => {
    const v = e.target.value;
    e.target.value = v.replace(/\s+/g, '').toLowerCase();
  };

  const handleEmployeeIdInput = (e) => {
    const v = e.target.value;
    e.target.value = v.replace(/[^0-9]/g, '');
  };

  const handlePhoneInput = (e) => {
    let v = e.target.value;
    if (!v.startsWith('+223')) {
      v = '+223 ' + v.replace(/[^0-9\s]/g, '').trim();
    } else {
      const rest = v.slice(4);
      v = '+223 ' + rest.replace(/[^0-9\s]/g, '');
    }
    e.target.value = v.replace(/\s{2,}/g, ' ');
  };

  const handlePasswordInput = (e) => {
    const v = e.target.value;
    e.target.value = v.replace(/\s+/g, ' ');
  };

  const handleConfirmPasswordInput = (e) => {
    const v = e.target.value;
    e.target.value = v.replace(/\s+/g, ' ');
  };

  const stopAction = () => {
    if (actionTimerRef.current) {
      clearInterval(actionTimerRef.current);
      actionTimerRef.current = null;
    }
    setActionLoading({ active: false, label: '', seconds: 0 });
  };

  // Gestion du focus pour la recherche - CORRIGÉ: useRef au lieu de useState
  const searchInputRef = useRef(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    control, 
    trigger,
    setValue,
    reset,
  } = useForm({
    mode: "onChange",
    reValidateMode: "onChange",
    shouldFocusError: true,
    resolver: zodResolver(registerSchema),
    criteriaMode: 'all',
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      employeeId: "",
      phone: "",
      password: "",
      confirm_password: "",
      department: "",
      role: 'invoice_manager',
      terms: true,
    }
  });

  useEffect(() => {
    return () => {
      if (actionTimerRef.current) {
        clearInterval(actionTimerRef.current);
      }
    };
  }, [actionTimerRef]);

  const password = useWatch({ control, name: "password" });
  const confirmPassword = useWatch({ control, name: "confirm_password" });
  const formRole = useWatch({ control, name: "role" });

  useEffect(() => {
    if (requireAuth && (!user || user.role !== 'admin')) {
      navigate('/unauthorized');
      return;
    }

    fetchUsers();
  }, [requireAuth, user, navigate]);

  useEffect(() => {
    if (password && confirmPassword) {
      trigger("confirm_password");
    }
  }, [password, confirmPassword, trigger]);

  useEffect(() => {
    if (showUserModal) {
      if (selectedUser) {
        // Pour la modification, email en read-only
        reset({
          firstName: selectedUser.firstName || '',
          lastName: selectedUser.lastName || '',
          email: selectedUser.email || '',
          employeeId: selectedUser.employeeId || '',
          phone: selectedUser.phone || '',
          department: selectedUser.department || '',
          role: selectedUser.role === 'admin' ? 'admin' : selectedUser.role,
          password: '',
          confirm_password: '',
          terms: true,
        });
      } else {
        // Pour la création
        reset({
          firstName: '',
          lastName: '',
          email: '',
          employeeId: '',
          phone: '',
          department: '',
          role: 'invoice_manager',
          password: '',
          confirm_password: '',
          terms: true,
        });
      }
      setErrorMsg('');
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [showUserModal, selectedUser, reset]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/users');
      const list = response?.data?.users || [];
      setUsers(list);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      setLoading(false);
    }
  };

  const showCustomMessage = ({ type, title, message, detail, buttons = ['OK'] }) => {
    // Correction du problème d'icône: créer les icônes sous forme de chaînes HTML
    const icons = {
      warning: `
        <div class="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
          <svg class="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
          </svg>
        </div>
      `,
      error: `
        <div class="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
          <svg class="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
          </svg>
        </div>
      `,
      info: `
        <div class="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
          <svg class="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
          </svg>
        </div>
      `,
      success: `
        <div class="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
          <svg class="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
          </svg>
        </div>
      `
    };

    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center p-4';
      modal.innerHTML = `
        <div class="fixed inset-0 bg-black/50"></div>
        <div class="relative bg-white rounded-lg shadow-xl w-full max-w-md">
          <div class="p-6">
            <div class="flex items-start gap-3">
              <div class="flex-shrink-0">
                ${icons[type] || icons.info}
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-semibold text-gray-900">${title}</h3>
                <div class="mt-2">
                  <p class="text-sm font-medium text-gray-700">${message}</p>
                  <p class="mt-2 text-sm text-gray-600">${detail}</p>
                </div>
                <div class="mt-6 flex justify-end gap-3">
                  ${buttons.map((btn, index) => `
                    <button 
                      type="button" 
                      class="px-4 py-2 text-sm font-medium ${index === buttons.length - 1 ? 'text-white bg-blue-600 hover:bg-blue-700' : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'} rounded-md transition-colors"
                      data-action="${btn.toLowerCase()}"
                    >
                      ${btn}
                    </button>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      
      buttons.forEach((btn) => {
        modal.querySelector(`[data-action="${btn.toLowerCase()}"]`).addEventListener('click', () => {
          document.body.removeChild(modal);
          resolve(btn);
        });
      });
      
      modal.querySelector('.fixed.inset-0').addEventListener('click', () => {
        document.body.removeChild(modal);
        resolve('Cancel');
      });
    });
  };

  const handleDisableUser = async (user) => {
    if (user.role === 'admin') {
      await showCustomMessage({
        type: 'warning',
        title: 'Action non autorisée',
        message: 'Impossible de désactiver',
        detail: 'Vous ne pouvez pas désactiver un administrateur.'
      });
      return;
    }

    const confirm = await showCustomMessage({
      type: 'warning',
      title: 'Désactiver l\'utilisateur',
      message: 'Confirmer la désactivation ?',
      detail: `${user.firstName} ${user.lastName} ne pourra plus se connecter.`,
      buttons: ['Annuler', 'Désactiver']
    });

    if (confirm !== 'Désactiver') return;

    try {
      startAction('Désactivation en cours');
      await api.post(`/api/users/${user.id}/disable`);
      await fetchUsers();
      await showCustomMessage({
        type: 'success',
        title: 'Utilisateur désactivé',
        message: 'Désactivation réussie',
        detail: `${user.firstName} ${user.lastName} est maintenant inactif.`
      });
    } catch (err) {
      const backendError = err?.response?.data?.message || err?.response?.data?.error;
      await showCustomMessage({
        type: 'error',
        title: 'Erreur',
        message: 'Échec de la désactivation',
        detail: backendError || 'Impossible de désactiver cet utilisateur. Veuillez réessayer.'
      });
    } finally {
      stopAction();
    }
  };

  const handleEnableUser = async (user) => {
    const confirm = await showCustomMessage({
      type: 'info',
      title: 'Réactiver l\'utilisateur',
      message: 'Confirmer la réactivation ?',
      detail: `${user.firstName} ${user.lastName} pourra à nouveau se connecter.`,
      buttons: ['Annuler', 'Réactiver']
    });

    if (confirm !== 'Réactiver') return;

    try {
      startAction('Réactivation en cours');
      await api.post(`/api/users/${user.id}/enable`);
      await fetchUsers();
      await showCustomMessage({
        type: 'success',
        title: 'Utilisateur réactivé',
        message: 'Réactivation réussie',
        detail: `${user.firstName} ${user.lastName} est maintenant actif.`
      });
    } catch (err) {
      const backendError = err?.response?.data?.message || err?.response?.data?.error;
      await showCustomMessage({
        type: 'error',
        title: 'Erreur',
        message: 'Échec de la réactivation',
        detail: backendError || 'Impossible de réactiver cet utilisateur. Veuillez réessayer.'
      });
    } finally {
      stopAction();
    }
  };

  const handleVerifyUser = async (user) => {
    const confirm = await showCustomMessage({
      type: 'info',
      title: 'Vérifier l\'email',
      message: 'Confirmer la vérification ?',
      detail: `L'adresse email ${user.email} sera marquée comme vérifiée et le compte activé.`,
      buttons: ['Annuler', 'Vérifier']
    });

    if (confirm !== 'Vérifier') return;

    try {
      startAction('Vérification en cours');
      await api.post(`/api/users/${user.id}/verify`);
      await fetchUsers();
      await showCustomMessage({
        type: 'success',
        title: 'Email vérifié',
        message: 'Vérification réussie',
        detail: `Le compte de ${user.email} est maintenant vérifié et actif.`
      });
    } catch (err) {
      const backendError = err?.response?.data?.message || err?.response?.data?.error;
      await showCustomMessage({
        type: 'error',
        title: 'Erreur',
        message: 'Échec de la vérification',
        detail: backendError || `Impossible de vérifier l'email de ${user.email}. Veuillez réessayer.`
      });
    } finally {
      stopAction();
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'invoice_manager':
        return 'bg-blue-100 text-blue-800';
      case 'dfc_agent':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'admin':
        return 'Administrateur';
      case 'invoice_manager':
        return 'Gestionnaire de factures';
      case 'dfc_agent':
        return 'Agent DFC';
      default:
        return role;
    }
  };

  const getStatusDisplayName = (status) => {
    switch (status) {
      case 'active':
        return 'Actif';
      case 'inactive':
        return 'Inactif';
      case 'pending':
        return 'En attente';
      default:
        return status;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Jamais';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Date invalide';
    }
  };

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  const handleEditUser = async (user) => {
    if (user.role === 'admin') {
      await showCustomMessage({
        type: 'warning',
        title: 'Modification non autorisée',
        message: 'Modification des administrateurs',
        detail: 'Vous ne pouvez pas modifier les comptes administrateurs.'
      });
      return;
    }
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleDeleteUser = async (userId) => {
    const userToDelete = users.find(u => u.id === userId);
    
    if (userToDelete?.role === 'admin') {
      await showCustomMessage({
        type: 'error',
        title: 'Suppression non autorisée',
        message: 'Suppression des administrateurs',
        detail: 'Vous ne pouvez pas supprimer les comptes administrateurs.'
      });
      return;
    }

    const confirm = await showCustomMessage({
      type: 'warning',
      title: 'Confirmer la suppression',
      message: 'Supprimer cet utilisateur ?',
      detail: 'La suppression est irréversible et entraînera la perte de toutes les données associées à cet utilisateur.',
      buttons: ['Annuler', 'Supprimer']
    });

    if (confirm !== 'Supprimer') return;

    try {
      startAction('Suppression en cours');
      await api.delete(`/api/users/${userId}`);
      setUsers(users.filter(u => u.id !== userId));
      await showCustomMessage({
        type: 'success',
        title: 'Suppression réussie',
        message: 'Utilisateur supprimé',
        detail: 'L\'utilisateur a été supprimé avec succès.'
      });
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      const isConflict = error?.response?.status === 409;
      const backendError = error?.response?.data?.message || error?.response?.data?.error;
      
      await showCustomMessage({
        type: 'error',
        title: 'Erreur',
        message: 'Échec de la suppression',
        detail: backendError || (isConflict
          ? "Impossible de supprimer cet utilisateur: des ressources associées existent (factures, fournisseurs ou décisions)."
          : "Une erreur est survenue lors de la suppression de l'utilisateur.")
      });
    } finally {
      stopAction();
    }
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setShowUserModal(true);
  };

  const getRoleIcon = (roleType) => {
    switch(roleType) {
      case 'dfc_agent':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case 'invoice_manager':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const onSubmit = async (data) => {
    // Vérification JS: mots de passe identiques
    if (!selectedUser && data.password !== data.confirm_password) {
      setErrorMsg('Les mots de passe ne correspondent pas.');
      return;
    }
    // En mode édition: si un nouveau mot de passe est saisi, la confirmation doit correspondre
    if (selectedUser && data.password) {
      if (data.password !== data.confirm_password) {
        setErrorMsg('Les mots de passe ne correspondent pas.');
        return;
      }
    }
    setSubmitting(true);
    setErrorMsg('');
    
    try {
      if (selectedUser) {
        // Pour la modification
        // Avertissement si un changement de rôle est détecté
        if (data.role && data.role !== selectedUser.role) {
          const confirm = await showCustomMessage({
            type: 'warning',
            title: 'Changement de rôle',
            message: `Vous allez changer le rôle de ${selectedUser.firstName} ${selectedUser.lastName} de "${getRoleDisplayName(selectedUser.role)}" vers "${getRoleDisplayName(data.role)}"`,
            detail: `Conséquences:\n- Les factures déjà créées par cet utilisateur garderont l'information historique de leur rôle au moment de la création.\n- Après le changement :\n  - S'il passe à "Agent DFC", il ne pourra plus enregistrer de nouvelles factures.\n  - S'il passe à "Gestionnaire de factures", il ne pourra plus valider de factures.\n- Les validations déjà effectuées conserveront le rôle historique au moment de l'action.`,
            buttons: ['Annuler', 'Confirmer le changement']
          });
          if (confirm !== 'Confirmer le changement') {
            setSubmitting(false);
            return;
          }
        }
        const payload = {
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          role: selectedUser.role === 'admin' ? 'admin' : data.role,
          phone: data.phone.trim(),
          department: data.department.trim(),
          employeeId: data.employeeId.trim(),
        };
        
        if (data.password && data.password.trim().length > 0) {
          payload.password = data.password; // envoyé au backend, hashé côté serveur
        }
        
        await api.put(`/api/users/${selectedUser.id}`, payload, { timeout: 30000 });
        
        await showCustomMessage({
          type: 'success',
          title: 'Modification réussie',
          message: 'Utilisateur modifié',
          detail: 'L\'utilisateur a été modifié avec succès.'
        });
        
      } else {
        // Pour la création
        const payload = {
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          email: data.email.trim().toLowerCase(),
          password: data.password,
          employeeId: data.employeeId.trim(),
          role: data.role,
          phone: data.phone.trim(),
          department: data.department.trim(),
          terms: data.terms,
        };
        
        await api.post('/api/users', payload, { timeout: 30000 });
        
        await showCustomMessage({
          type: 'success',
          title: 'Email de vérification envoyé',
          message: 'Utilisateur créé en attente de vérification',
          detail: "Un email de vérification a été envoyé à cet utilisateur. Demandez-lui de cliquer sur le lien pour finaliser son inscription. Si vous êtes administrateur et certain de l'intégrité de son email, vous pouvez activer son compte manuellement."
        });
      }
      
      await fetchUsers();
      // Nettoyer le formulaire après soumission (surtout en création)
      if (!selectedUser) {
        reset({
          firstName: '',
          lastName: '',
          email: '',
          employeeId: '',
          phone: '',
          department: '',
          role: 'invoice_manager',
          password: '',
          confirm_password: '',
          terms: true,
        });
      }
      setShowUserModal(false);
      setSelectedUser(null);
      
    } catch (err) {
      console.error('Erreur détaillée:', err.response || err);
      const backendError = err?.response?.data?.message || err?.response?.data?.error;
      
      if (backendError) {
        setErrorMsg(backendError);
      } else if (err.response?.status === 409) {
        setErrorMsg('Cet email est déjà utilisé par un autre utilisateur.');
      } else if (err.response?.status === 400) {
        setErrorMsg('Données invalides. Vérifiez les informations saisies.');
      } else {
        setErrorMsg('Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowUserModal(false);
    setShowDetailModal(false);
    setSelectedUser(null);
    setErrorMsg('');
    reset();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="bg-white p-6 rounded-lg shadow">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <Navbar />
      {actionLoading.active && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg px-6 py-4 flex items-center gap-3">
            <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <div className="text-sm font-medium text-gray-700">
              {actionLoading.label} · {actionLoading.seconds}s
            </div>
          </div>
        </div>
      )}
      <div className="container mx-auto px-4 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des utilisateurs</h1>
          <p className="text-gray-900 font-semibold">Gérez les comptes utilisateurs et leurs permissions</p>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <UserGroupIcon className="w-8 h-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <CheckCircleIcon className="w-8 h-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Actifs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.status === 'active').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <ClockIcon className="w-8 h-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">En attente</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <ShieldCheckIcon className="w-8 h-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Administrateurs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.role === 'admin').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Barre d'outils */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Recherche améliorée */}
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors ${
                isSearchFocused ? 'text-blue-500' : 'text-gray-400'
              }`} />
              <input
                type="text"
                placeholder="Rechercher un utilisateur..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (e.target.value) {
                    setIsSearchFocused(true);
                  }
                }}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => {
                  if (!searchTerm) {
                    setIsSearchFocused(false);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setSearchTerm('');
                    e.target.blur();
                  }
                }}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                ref={searchInputRef} // Référence corrigée
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    if (searchInputRef.current) {
                      searchInputRef.current.focus();
                    }
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filtres */}
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <FunnelIcon className="w-5 h-5 text-gray-400" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tous les rôles</option>
                  <option value="admin">Administrateur</option>
                  <option value="invoice_manager">Gestionnaire</option>
                  <option value="dfc_agent">Agent DFC</option>
                </select>
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
                <option value="pending">En attente</option>
              </select>
            </div>

            {/* Bouton d'ajout */}
            <button
              onClick={handleCreateUser}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              Nouvel utilisateur
            </button>
          </div>
        </div>

        {/* Liste des utilisateurs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dernière connexion
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <UserIcon className="w-6 h-6 text-gray-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                        {getRoleDisplayName(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(user.status)}`}>
                        {getStatusDisplayName(user.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.lastLogin)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-wrap gap-1">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-blue-600 hover:text-blue-900 p-1.5 rounded hover:bg-blue-50 transition-colors"
                          title="Modifier"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleViewDetails(user)}
                          className="text-green-600 hover:text-green-900 p-1.5 rounded hover:bg-green-50 transition-colors"
                          title="Voir détails"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        {user.role !== 'admin' && user.status === 'active' && (
                          <button
                            onClick={() => handleDisableUser(user)}
                            className="text-amber-600 hover:text-amber-900 p-1.5 rounded hover:bg-amber-50 transition-colors flex items-center gap-1"
                            title="Désactiver l'utilisateur"
                          >
                            <NoSymbolIcon className="w-4 h-4" />
                          </button>
                        )}
                        {user.status === 'inactive' && (
                          <button
                            onClick={() => handleEnableUser(user)}
                            className="text-emerald-600 hover:text-emerald-900 p-1.5 rounded hover:bg-emerald-50 transition-colors flex items-center gap-1"
                            title="Réactiver l'utilisateur"
                          >
                            <CheckCircleIcon className="w-4 h-4" />
                          </button>
                        )}
                        {user.status === 'pending' && (
                          <button
                            onClick={() => handleVerifyUser(user)}
                            className="text-indigo-600 hover:text-indigo-900 p-1.5 rounded hover:bg-indigo-50 transition-colors flex items-center gap-1"
                            title="Vérifier l'email (activer le compte)"
                          >
                            <CheckBadgeIcon className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-900 p-1.5 rounded hover:bg-red-50 transition-colors"
                          title="Supprimer"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun utilisateur trouvé</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                  ? 'Essayez de modifier vos critères de recherche.'
                  : 'Commencez par ajouter un nouvel utilisateur.'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal création/édition utilisateur - Design simplifié */}
      {showUserModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/50"
            onClick={closeModal}
          />
          
          <div 
            className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header simplifié */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <UserIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {selectedUser ? 'Mettez à jour les informations' : 'Créez un nouveau compte utilisateur'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-500 transition-colors p-1 rounded-lg hover:bg-gray-100"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {errorMsg && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-800 mb-1">Erreur</p>
                    <p className="text-sm text-red-600">{errorMsg}</p>
                  </div>
                </div>
              )}
              
              {/* Sélection du type d'utilisateur - Style simplifié */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Type d'utilisateur
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'invoice_manager', label: "Gestionnaire de factures", icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )},
                    { key: 'dfc_agent', label: "Agent DFC", icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    )}
                  ].map(({ key, label, icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setValue('role', key, { shouldValidate: true })}
                      className={`p-4 rounded-lg border transition-all duration-200 flex items-center gap-3 ${
                        formRole === key
                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className={`p-2 rounded-md ${
                        formRole === key ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {icon}
                      </div>
                      <span className={`text-sm font-medium ${
                        formRole === key ? 'text-blue-700' : 'text-gray-700'
                      }`}>
                        {label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} method='post' className="space-y-6">
                <input type="hidden" {...register("role")} />
                <input type="checkbox" className="hidden" defaultChecked={true} {...register("terms")} />

                {/* Informations personnelles */}
                <div className="space-y-6">
                  <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                    Informations personnelles
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                        Prénom <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        onInput={handleFirstNameInput}
                        {...register("firstName")}
                        className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none transition-colors ${
                          errors['firstName']?.message 
                            ? 'border-red-300 focus:ring-2 focus:ring-red-200 focus:border-red-400' 
                            : 'border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-400'
                        }`}
                        placeholder="Votre prénom"
                      />

                      {errors['firstName'] && (
                        <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                          <ExclamationTriangleIcon className="w-4 h-4" />
                          {errors['firstName'].message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                        Nom <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        onInput={handleLastNameInput}
                        {...register("lastName")}
                        className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none transition-colors ${
                          errors['lastName']?.message 
                            ? 'border-red-300 focus:ring-2 focus:ring-red-200 focus:border-red-400' 
                            : 'border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-400'
                        }`}
                        placeholder="Votre nom"
                      />

                      {errors['lastName']?.message && (
                        <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                          <ExclamationTriangleIcon className="w-4 h-4" />
                          {errors.lastName.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Email et Identifiant employé */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Adresse email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        {...register("email")}
                        readOnly={!!selectedUser} // Email en read-only pour la modification
                        className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none transition-colors ${
                          errors['email']?.message 
                            ? 'border-red-300 focus:ring-2 focus:ring-red-200 focus:border-red-400' 
                            : selectedUser
                            ? 'border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed'
                            : 'border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-400'
                        }`}
                        placeholder="prenom.nom@cmdt.ml"
                        onInput={handleEmailInput}
                      />

                      {errors.email?.message && (
                        <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                          <ExclamationTriangleIcon className="w-4 h-4" />
                          {errors.email.message}
                        </p>
                      )}
                      {selectedUser && (
                        <p className="text-xs text-gray-500 mt-1.5">
                          L'adresse email ne peut pas être modifiée
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700 mb-2">
                        Identifiant employé <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        onInput={handleEmployeeIdInput}
                        id="employeeId"
                        {...register("employeeId")}
                        className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none transition-colors ${
                          errors.employeeId?.message 
                            ? 'border-red-300 focus:ring-2 focus:ring-red-200 focus:border-red-400' 
                            : 'border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-400'
                        }`}
                        placeholder="Votre identifiant CMDT"
                      />

                      {errors.employeeId?.message && (
                        <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                          <ExclamationTriangleIcon className="w-4 h-4" />
                          {errors.employeeId.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Téléphone et Département */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                        Numéro de téléphone
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        onInput={handlePhoneInput}
                        onFocus={(e) => {
                          if (e.target.value === '') {
                            e.target.value = '+223 ';
                          }
                        }}
                        {...register("phone")}
                        className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none transition-colors ${
                          errors.phone?.message 
                            ? 'border-red-300 focus:ring-2 focus:ring-red-200 focus:border-red-400' 
                            : 'border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-400'
                        }`}
                        placeholder="+223 00 00 00 00"
                      />

                      {errors.phone?.message && (
                        <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                          <ExclamationTriangleIcon className="w-4 h-4" />
                          {errors.phone.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                        Département <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="department"
                        {...register("department")}
                        className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none transition-colors ${
                          errors.department?.message 
                            ? 'border-red-300 focus:ring-2 focus:ring-red-200 focus:border-red-400' 
                            : 'border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-400'
                        }`}
                      >
                        <option value="">Sélectionnez un département</option>
                        {(() => {
                          const base = formRole === 'dfc_agent'
                            ? ['Finance', 'Comptabilité', 'Contrôle de gestion', 'Audit interne']
                            : ['Facturation', 'Comptabilité Client', 'Gestion des Factures'];
                          const current = selectedUser?.department || '';
                          let options = base;
                          if (current && !base.includes(current)) {
                            if (formRole !== 'dfc_agent') {
                              options = [current, ...base];
                            }
                          }
                          return options.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ));
                        })()}
                      </select>
                      {errors.department?.message && (
                        <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                          <ExclamationTriangleIcon className="w-4 h-4" />
                          {errors.department.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mot de passe (création) */}
                {!selectedUser && (
                  <div className="space-y-6">
                    <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                      Sécurité
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                          Mot de passe <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            onInput={handlePasswordInput}
                            className={`w-full px-3 py-2.5 pr-12 border rounded-lg focus:outline-none transition-colors appearance-none [&::-ms-reveal]:hidden [&::-ms-clear]:hidden ${
                              errors.password?.message 
                                ? 'border-red-300 focus:ring-2 focus:ring-red-200 focus:border-red-400' 
                                : 'border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-400'
                            }`}
                            placeholder="Mot de passe"
                            {...register("password")}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(v => !v)}
                            className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700 transition-colors"
                            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                          >
                            {showPassword ? (
                              <EyeSlashIcon className="w-5 h-5" />
                            ) : (
                              <EyeOpenIcon className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                        {errors.password?.message && (
                          <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                            <ExclamationTriangleIcon className="w-4 h-4" />
                            {errors.password.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-2">
                          Confirmation <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            id="confirm_password"
                            onInput={handleConfirmPasswordInput}
                            className={`w-full px-3 py-2.5 pr-12 border rounded-lg focus:outline-none transition-colors appearance-none [&::-ms-reveal]:hidden [&::-ms-clear]:hidden ${
                              errors.confirm_password?.message 
                                ? 'border-red-300 focus:ring-2 focus:ring-red-200 focus:border-red-400' 
                                : 'border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-400'
                            }`}
                            placeholder="Confirmez le mot de passe"
                            {...register("confirm_password")}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(v => !v)}
                            className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700 transition-colors"
                            aria-label={showConfirmPassword ? 'Masquer la confirmation' : 'Afficher la confirmation'}
                          >
                            {showConfirmPassword ? (
                              <EyeSlashIcon className="w-5 h-5" />
                            ) : (
                              <EyeOpenIcon className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                        {errors.confirm_password?.message && (
                          <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                            <ExclamationTriangleIcon className="w-4 h-4" />
                            {errors.confirm_password.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Changement de mot de passe (édition - optionnel) */}
                {selectedUser && (
                  <div className="space-y-6">
                    <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                      Changer le mot de passe (optionnel)
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                          Nouveau mot de passe
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            onInput={handlePasswordInput}
                            className={`w-full px-3 py-2.5 pr-12 border rounded-lg focus:outline-none transition-colors appearance-none [&::-ms-reveal]:hidden [&::-ms-clear]:hidden ${
                              errors.password?.message 
                                ? 'border-red-300 focus:ring-2 focus:ring-red-200 focus:border-red-400' 
                                : 'border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-400'
                            }`}
                            placeholder="Laisser vide pour ne pas changer"
                            {...register("password")}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(v => !v)}
                            className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700 transition-colors"
                            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                          >
                            {showPassword ? (
                              <EyeSlashIcon className="w-5 h-5" />
                            ) : (
                              <EyeOpenIcon className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                        {errors.password?.message && (
                          <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                            <ExclamationTriangleIcon className="w-4 h-4" />
                            {errors.password.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-2">
                          Confirmation (si changement)
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            id="confirm_password"
                            onInput={handleConfirmPasswordInput}
                            className={`w-full px-3 py-2.5 pr-12 border rounded-lg focus:outline-none transition-colors appearance-none [&::-ms-reveal]:hidden [&::-ms-clear]:hidden ${
                              errors.confirm_password?.message 
                                ? 'border-red-300 focus:ring-2 focus:ring-red-200 focus:border-red-400' 
                                : 'border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-400'
                            }`}
                            placeholder="Répétez le nouveau mot de passe"
                            {...register("confirm_password")}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(v => !v)}
                            className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700 transition-colors"
                            aria-label={showConfirmPassword ? 'Masquer la confirmation' : 'Afficher la confirmation'}
                          >
                            {showConfirmPassword ? (
                              <EyeSlashIcon className="w-5 h-5" />
                            ) : (
                              <EyeOpenIcon className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                        {errors.confirm_password?.message && (
                          <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                            <ExclamationTriangleIcon className="w-4 h-4" />
                            {errors.confirm_password.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                  <button 
                    type="button" 
                    onClick={closeModal}
                    className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Enregistrement...
                      </>
                    ) : selectedUser ? 'Mettre à jour' : 'Créer l\'utilisateur'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal détails utilisateur - Style simplifié */}
      {showDetailModal && selectedUser && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/50"
            onClick={closeModal}
          />
          
          <div 
            className="relative bg-white rounded-xl shadow-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                    <EyeIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Détails de l'utilisateur</h3>
                </div>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-500 transition-colors p-1 rounded-lg hover:bg-gray-100"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-gray-300 flex items-center justify-center">
                    <UserIcon className="w-7 h-7 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-lg">
                      {selectedUser.firstName} {selectedUser.lastName}
                    </h4>
                    <p className="text-sm text-gray-500">{selectedUser.email}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-500 mb-1">Rôle</p>
                      <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(selectedUser.role)}`}>
                        {getRoleDisplayName(selectedUser.role)}
                      </span>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-500 mb-1">Statut</p>
                      <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(selectedUser.status)}`}>
                        {getStatusDisplayName(selectedUser.status)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {selectedUser.employeeId && (
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-sm font-medium text-gray-500">Matricule</span>
                        <span className="text-sm text-gray-900">{selectedUser.employeeId}</span>
                      </div>
                    )}
                    {selectedUser.phone && (
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-sm font-medium text-gray-500">Téléphone</span>
                        <span className="text-sm text-gray-900">{selectedUser.phone}</span>
                      </div>
                    )}
                    
                    {selectedUser.department && (
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-sm font-medium text-gray-500">Département</span>
                        <span className="text-sm text-gray-900">{selectedUser.department}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-500">Dernière connexion</span>
                      <span className="text-sm text-gray-900">{formatDate(selectedUser.lastLogin)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm font-medium text-gray-500">Date de création</span>
                      <span className="text-sm text-gray-900">{formatDate(selectedUser.createdAt)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end pt-6">
                  <button
                    onClick={closeModal}
                    className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}

export default Users;