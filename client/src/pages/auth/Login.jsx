// Login.jsx
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '../../shema/loginShema.ts';
import useTitle from '../../hooks/ui/useTitle.js';
import { Link, useNavigate } from 'react-router-dom';
import { useInputFilters } from '../../hooks/ui/useInputFilter.js';
import SubmitBtn from '../../components/form/SubmitBtn.jsx';
import { useAuth } from '../../hooks/auth/useAuth.js';
import useToastFeedback from '../../hooks/ui/useToastFeedBack.js';

function Login() {
  useTitle('CMDT - Connexion');

  // Définition des rôles disponibles
  const ROLES = {
    ADMIN: 'admin',
    DFC_AGENT: 'dfc_agent',
    INVOICE_MANAGER: 'invoice_manager'
  };

  // État pour le rôle sélectionné - invoice_manager par défaut
  const [role, setRole] = useState(ROLES.INVOICE_MANAGER);
  const { filterEmail, filterPassword } = useInputFilters();
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { success, error } = useToastFeedback();
  const navigate = useNavigate();
  
  const { register, formState: { errors }, handleSubmit, setValue, reset } = useForm({
    mode: 'onChange',
    reValidateMode: 'onChange',
    criteriaMode: 'all',
    defaultValues: { 
      email: '', 
      password: '', 
      rememberMe: false, 
      role: ROLES.INVOICE_MANAGER // Valeur par défaut
    },
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    setValue('role', role, { shouldValidate: true, shouldDirty: true });
  }, [role, setValue]);

  const [showPassword, setShowPassword] = useState(false);
  
  const onSubmit = async (data) => { 
    console.log('Données de connexion:', data); 
    try {
      setLoading(true);
      await new Promise((res) => setTimeout(res, 2000));
      const result = await login({
        password: data.password,
        email: data.email,
        role: data.role,
        rememberMe: data.rememberMe,
      });

      if (result.success) {
        success(result.message || 'Connexion réussie');
        reset()
        // Redirection basée sur le rôle
        let redirectPath = '/profile';
        if (data.role === ROLES.ADMIN) {
          redirectPath = '/dashboard';
        } else if (data.role === ROLES.INVOICE_MANAGER || data.role === ROLES.DFC_AGENT) {
          redirectPath = '/profile';
        }
        
        setTimeout(() => {
          navigate(redirectPath, { replace: true });
        }, 2000); // Réduction du délai pour une meilleure UX
      } else {
        error(result.message || 'Une erreur interne est survenue');
      }
    } catch (err) {
      error(err?.message || 'Erreur de connexion');
      console.error('Erreur de connexion:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour gérer le changement de rôle
  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
  };

  // Texte descriptif basé sur le rôle sélectionné
  const getRoleDescription = () => {
    switch(role) {
      case ROLES.ADMIN:
        return "Accès complet à l'administration du système";
      case ROLES.DFC_AGENT:
        return "Gestion des opérations DFC";
      case ROLES.INVOICE_MANAGER:
        return "Gestion des factures cotonnières";
      default:
        return "Accédez à votre espace personnel";
    }
  };

  // Icônes pour chaque rôle
  const getRoleIcon = (roleType) => {
    switch(roleType) {
      case ROLES.ADMIN:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case ROLES.DFC_AGENT:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case ROLES.INVOICE_MANAGER:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-login">
      {/* Section illustration */}
      <div className="md:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-green-600 to-green-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 max-w-md text-center">
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17 14H7C4.23858 14 2 16.2386 2 19C2 20.6569 3.34315 22 5 22H19C20.6569 22 22 20.6569 22 19C22 16.2386 19.7614 14 17 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 className="text-4xl font-bold mb-3">CMDT Mali</h1>
            <p className="text-xl text-green-100">Plateforme de gestion des factures cotonnières</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <h3 className="font-semibold mb-3 text-lg">Système sécurisé</h3>
            <p className="text-green-100 text-sm leading-relaxed">
              Accédez à la plateforme de gestion des factures pour la filière cotonnière malienne. 
              Interface optimisée pour une expérience utilisateur fluide et sécurisée.
            </p>
          </div>
        </div>
        
        {/* Éléments décoratifs */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/5 rounded-full blur-xl"></div>
      </div>

      {/* Formulaire de connexion */}
      <div className="md:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Connexion</h2>
            <p className="text-gray-600 mt-2 text-sm">{getRoleDescription()}</p>
          </div>

          {/* Sélection du types d'utilisateur */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Je suis :</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: ROLES.ADMIN, label: "Admin", color: "red" },
                { key: ROLES.DFC_AGENT, label: "Agent DFC", color: "green" },
                { key: ROLES.INVOICE_MANAGER, label: "Chargé factures", color: "blue" }
              ].map(({ key, label, color }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleRoleChange(key)}
                  className={`p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                    role === key
                      ? `bg-${color}-50 border-${color}-500 shadow-sm scale-[1.02]`
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${
                    role === key ? `bg-${color}-100 text-${color}-600` : 'bg-gray-100 text-gray-500'
                  }`}>
                    {getRoleIcon(key)}
                  </div>
                  <span className={`text-xs font-medium ${
                    role === key ? `text-${color}-700` : 'text-gray-600'
                  }`}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Adresse email
              </label>
              <input
                type="email"
                id="email"
                onInput={filterEmail}
                {...register('email')}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                  errors.email?.message 
                    ? 'border-red-500 focus:border-red-600 bg-red-50' 
                    : 'border-gray-200 focus:border-green-500 focus:bg-white'
                }`}
                placeholder="votre@email.com"
              />
              {errors.email?.message && (
                <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  onInput={filterPassword}
                  {...register('password')}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors pr-12 ${
                    errors.password?.message 
                      ? 'border-red-500 focus:border-red-600 bg-red-50' 
                      : 'border-gray-200 focus:border-green-500 focus:bg-white'
                  }`}
                  placeholder="Votre mot de passe"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute inset-y-0 right-0 px-4 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password?.message && (
                <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  {...register('rememberMe')}
                />
                <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                  Se souvenir de moi
                </label>
              </div>

              <Link 
                to="/forgot-password" 
                className="text-sm font-medium text-green-600 hover:text-green-800 transition-colors"
              >
                Mot de passe oublié?
              </Link>
            </div>
            
            {/* Champ caché pour le rôle */}
            <input type="hidden" {...register("role")} />

            <SubmitBtn
              fullWidth
              loading={loading}
              loadingLabel="Connexion en cours..."
              label="Se connecter"
              className="py-3 rounded-xl font-semibold text-lg"
            />

            <div className="text-center pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                Vous n'avez pas de compte?{' '}
                <Link 
                  to="/register" 
                  className="font-semibold text-green-600 hover:text-green-800 transition-colors"
                >
                  Créer un compte
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;