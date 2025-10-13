import { useState, useEffect } from 'react';
import useTitle from '../hooks/useTitle';
import { useInputFilters } from '../hooks/useInputFilter';
import { Link } from 'react-router-dom';
import { registerSchema } from '../features/connection/loginShema';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AsyncSubmitBtn from '../components/AsyncSubmitBtn';
import { useAuth } from '../services/useAuth';
import useToastFeedback from '../hooks/useToastFeedback';

function Register() {
  useTitle('CMDT - Inscription');
  const [role, setRole] = useState('dfc_agent');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { 
    filterEmail, 
    filterFirstName,
    filterLastName, 
    filterPassword, 
    filterConfirmPassword,
    filterEmployeeId,
    filterPhone
  } = useInputFilters();
  
  const { error, success } = useToastFeedback();

  const { register: registerUser } = useAuth();
  const { 
    register, 
    handleSubmit, 
    formState: {errors}, 
    control, 
    trigger, 
    setValue,
    reset
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
      terms: false,
      role: 'dfc_agent',
    }
  });
  const password = useWatch({control, name: "password"});
  const confirmPassword = useWatch({control, name: "confirm_password"});

  useEffect(() => {
    if (password && confirmPassword) {
      trigger("confirm_password");
    }
  }, [password, confirmPassword, trigger]);
  
  const onSubmit = async (data) => {
    try {
      setLoading(true);
      await new Promise((res) => setTimeout(res, 2000));
      const result = await registerUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        employeeId: data.employeeId,
        password: data.password,
        confirm_password: data.confirm_password,
        phone: data.phone,
        role: data.role,
        department: data.department,
        terms: data.terms,
      });

      if (result?.success) {
        console.log('Donnees soumises : ', data);
        success(result.message || "Consultez votre email pour finaliser l'inscription");
        reset()
      } else {
        error(result.message || "Erreur lors de l'inscription");
      }
    } catch (error) {
      console.error('Erreurs de validation : ', error);
      error(result.message || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    setValue('role', role, { shouldValidate: true, shouldDirty: true });
  }, [role, setValue]);

  // Icônes pour chaque rôle
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
  
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-blue-50 to-green-50">
      {/* Section illustration */}
      <div className="md:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-blue-600 to-green-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 max-w-md text-center">
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 className="text-4xl font-bold mb-3">CMDT Mali</h1>
            <p className="text-xl text-blue-100">Rejoignez notre plateforme de gestion</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <h3 className="font-semibold mb-3 text-lg">Créez votre compte</h3>
            <p className="text-blue-100 text-sm leading-relaxed">
              Accédez à tous les outils de gestion des factures cotonnières. 
              Inscrivez-vous pour bénéficier d'une expérience optimisée et sécurisée.
            </p>
          </div>
        </div>
        
        {/* Éléments décoratifs */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/5 rounded-full blur-xl"></div>
      </div>

      {/* Formulaire d'inscription */}
      <div className="md:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Inscription</h2>
            <p className="text-gray-600 mt-2 text-sm">Créez votre compte personnel</p>
          </div>

          {/* Sélection du type d'utilisateur */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Je suis :</label>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'dfc_agent', label: "Agent DFC", color: "green" },
                { key: 'invoice_manager', label: "Chargé factures", color: "blue" }
              ].map(({ key, label, color }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setRole(key)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-3 ${
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
                  <span className={`text-sm font-medium ${
                    role === key ? `text-${color}-700` : 'text-gray-600'
                  }`}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <form noValidate onSubmit={handleSubmit(onSubmit)} method='post' className="space-y-6">
            {/* Nom et Prénom */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 mb-2">
                  Prénom
                </label>
                <input
                  type="text"
                  id="firstName"
                  onInput={filterFirstName}
                  {...register("firstName")}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                    errors['firstName']?.message 
                      ? 'border-red-500 focus:border-red-600 bg-red-50' 
                      : 'border-gray-200 focus:border-blue-500 focus:bg-white'
                  }`}
                  placeholder="Votre prénom"
                />
                {errors['firstName'] && (
                  <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    {errors['firstName'].message}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom
                </label>
                <input
                  type="text"
                  id="lastName"
                  onInput={filterLastName}
                  {...register("lastName")}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                    errors['lastName']?.message 
                      ? 'border-red-500 focus:border-red-600 bg-red-50' 
                      : 'border-gray-200 focus:border-blue-500 focus:bg-white'
                  }`}
                  placeholder="Votre nom"
                />
                {errors['lastName']?.message && (
                  <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            {/* Email et Identifiant employé */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Adresse email professionnelle
                </label>
                <input
                  type="email"
                  id="email"
                  {...register("email")}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                    errors['email']?.message 
                      ? 'border-red-500 focus:border-red-600 bg-red-50' 
                      : 'border-gray-200 focus:border-blue-500 focus:bg-white'
                  }`}
                  placeholder="prenom.nom@cmdt.ml"
                  onInput={filterEmail}
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
                <label htmlFor="employeeId" className="block text-sm font-semibold text-gray-700 mb-2">
                  Identifiant employé
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  onInput={filterEmployeeId}
                  id="employeeId"
                  {...register("employeeId")}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                    errors.employeeId?.message 
                      ? 'border-red-500 focus:border-red-600 bg-red-50' 
                      : 'border-gray-200 focus:border-blue-500 focus:bg-white'
                  }`}
                  placeholder="Votre identifiant CMDT"
                />
                {errors.employeeId?.message && (
                  <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    {errors.employeeId.message}
                  </p>
                )}
              </div>
            </div>

            {/* Téléphone et Département */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                  Numéro de téléphone
                </label>
                <input
                  type="tel"
                  id="phone"
                  onInput={filterPhone}
                  onFocus={(e) => {
                    if (e.target.value === '') {
                      e.target.value = '+223 ';
                    }
                  }}
                  {...register("phone")}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                    errors.phone?.message 
                      ? 'border-red-500 focus:border-red-600 bg-red-50' 
                      : 'border-gray-200 focus:border-blue-500 focus:bg-white'
                  }`}
                  placeholder="+223 00 00 00 00"
                />
                {errors.phone?.message && (
                  <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="department" className="block text-sm font-semibold text-gray-700 mb-2">
                  Département DFC
                </label>
                <select
                  id="department"
                  {...register("department")}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                    errors.department?.message 
                      ? 'border-red-500 focus:border-red-600 bg-red-50' 
                      : 'border-gray-200 focus:border-blue-500 focus:bg-white'
                  }`}
                >
                  {role === 'dfc_agent' ? (
                    <>
                      <option value="">Sélectionnez votre département</option>
                      <option value="Finance">Finance</option>
                      <option value="Comptabilité">Comptabilité</option>
                      <option value="Contrôle de gestion">Contrôle de gestion</option>
                      <option value="Audit interne">Audit interne</option>
                    </>
                  ) : (
                   <>
                    <option value="">Sélectionnez votre département</option>
                    <option value="Facturation">Facturation</option>
                    <option value="Comptabilité Client">Comptabilité Client</option>
                    <option value="Gestion des factures">Gestion des Factures</option>
                  </>
                  )}
                </select>
                {errors.department?.message && (
                  <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    {errors.department.message}
                  </p>
                )}
              </div>
            </div>

            {/* Mot de passe et Confirmation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    onInput={filterPassword}
                    className={`w-full px-4 py-3 pr-12 border-2 rounded-xl focus:outline-none transition-colors appearance-none [&::-ms-reveal]:hidden [&::-ms-clear]:hidden ${
                      errors.password?.message 
                        ? 'border-red-500 focus:border-red-600 bg-red-50' 
                        : 'border-gray-200 focus:border-blue-500 focus:bg-white'
                    }`}
                    placeholder="Mot de passe"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute inset-y-0 right-0 px-4 text-gray-500 hover:text-gray-700 transition-colors"
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

              <div>
                <label htmlFor="confirm_password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirmation
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirm_password"
                    onInput={filterConfirmPassword}
                    className={`w-full px-4 py-3 pr-12 border-2 rounded-xl focus:outline-none transition-colors appearance-none [&::-ms-reveal]:hidden [&::-ms-clear]:hidden ${
                      errors.confirm_password?.message 
                        ? 'border-red-500 focus:border-red-600 bg-red-50' 
                        : 'border-gray-200 focus:border-blue-500 focus:bg-white'
                    }`}
                    placeholder="Confirmez le mot de passe"
                    {...register("confirm_password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(v => !v)}
                    className="absolute inset-y-0 right-0 px-4 text-gray-500 hover:text-gray-700 transition-colors"
                    aria-label={showConfirmPassword ? 'Masquer la confirmation' : 'Afficher la confirmation'}
                  >
                    {showConfirmPassword ? (
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
                {errors.confirm_password?.message && (
                  <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    {errors.confirm_password.message}
                  </p>
                )}
              </div>
            </div>

            {/* Conditions d'utilisation */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="terms"
                  {...register("terms")}
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
                />
                <label htmlFor="terms" className="ml-3 block text-sm text-gray-700">
                  J'accepte les{' '}
                  <a href="#" className="font-medium text-blue-600 hover:text-blue-800 transition-colors">
                    conditions d'utilisation
                  </a>{' '}
                  et la{' '}
                  <a href="#" className="font-medium text-blue-600 hover:text-blue-800 transition-colors">
                    politique de confidentialité
                  </a>
                </label>
              </div>
              {errors.terms?.message && (
                <p className="text-sm text-red-600 mt-2 ml-8 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  {errors.terms.message}
                </p>
              )}
            </div>

            <input type="hidden" {...register("role")} name="role" value={role} />

            <AsyncSubmitBtn 
              fullWidth
              label="Créer mon compte"
              loadingLabel="Création en cours..."
              loading={loading}
              className="py-3 rounded-xl font-semibold text-lg"
            />

            <div className="text-center pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                Vous avez déjà un compte?{' '}
                <Link 
                  to="/login" 
                  className="font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Se connecter
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;