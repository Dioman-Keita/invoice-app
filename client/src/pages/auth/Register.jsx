import { useState, useEffect } from 'react';
import useTitle from '../../hooks/ui/useTitle.js';
import { useInputFilters } from '../../hooks/ui/useInputFilter.js';
import { Link } from 'react-router-dom';
import { registerSchema } from '../../shema/loginShema.ts';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import SubmitBtn from '../../components/form/SubmitBtn.jsx';
import { useAuth } from '../../hooks/auth/useAuth.js';
import useToastFeedback from '../../hooks/ui/useToastFeedBack.js';

function Register() {
  useTitle('CMDT - Inscription');
  const [role, setRole] = useState('dfc_agent');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  
  // --- NOUVEAU : État pour le timer ---
  const [resendTimer, setResendTimer] = useState(0);

  // --- NOUVEAU : Gestion du décompte ---
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const { error, success } = useToastFeedback();
  const { register: registerUser, resendVerification } = useAuth();

  const handleResendEmail = async () => {
    if (!userEmail || resendTimer > 0) return; // Empêcher le clic si timer actif
    
    try {
      const res = await resendVerification(userEmail);
      if (res?.success) {
        success(res.message || "Email renvoyé avec succès");
        setResendTimer(60); // Démarrer le timer de 60 secondes
      } else {
        error(res?.message || "Échec du renvoi");
      }
    } catch (e) {
      error(e?.message || "Erreur lors du renvoi");
    }
  }

  const { 
    filterEmail, 
    filterFirstName,
    filterLastName, 
    filterPassword, 
    filterConfirmPassword,
    filterEmployeeId,
    filterPhone
  } = useInputFilters();
  
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
      await new Promise((res) => setTimeout(res, 1000));
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
        setUserEmail(data.email);
        setRegistrationSuccess(true);
        reset();
      } else {
        error(result.message || "Erreur lors de l'inscription");
      }
    } catch (error) {
      console.error('Erreurs de validation : ', error);
      error(error.message || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  }
  
  useEffect(() => {
    setValue('role', role, { shouldValidate: true, shouldDirty: true });
  }, [role, setValue]);

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

  // Composant Vestiaire d'attente
  const WaitingRoom = () => (
    <div className="min-h-screen flex flex-col md:flex-row bg-register">
      {/* Section illustration (inchangée) */}
      <div className="md:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-blue-600 to-green-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 max-w-md text-center">
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold mb-3">CMDT Mali</h1>
            <p className="text-xl text-blue-100">Vérification en cours</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <h3 className="font-semibold mb-3 text-lg">Email envoyé !</h3>
            <p className="text-blue-100 text-sm leading-relaxed">
              Un lien de vérification a été envoyé à votre adresse email professionnelle.
            </p>
          </div>
        </div>
        
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/5 rounded-full blur-xl"></div>
      </div>

      {/* Section Vestiaire d'attente */}
      <div className="md:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Vérifiez votre email</h2>
            <p className="text-gray-600 mt-2 text-sm">Finalisez votre inscription</p>
          </div>

          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>

            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Consultez votre boîte email
              </h3>
              <p className="text-gray-600 mb-4">
                Un email de vérification a été envoyé à :
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                <p className="text-blue-700 font-medium">{userEmail}</p>
              </div>
              <p className="text-sm text-gray-500">
                Cliquez sur le lien dans l'email pour finaliser votre inscription
              </p>
            </div>

            {/* Étapes (inchangées) */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h4 className="font-semibold text-gray-800 mb-4">Prochaines étapes :</h4>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold mt-0.5">1</div>
                  <div>
                    <p className="font-medium text-gray-700">Ouvrez votre email</p>
                    <p className="text-sm text-gray-500">Vérifiez votre boîte de réception et vos spams</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold mt-0.5">2</div>
                  <div>
                    <p className="font-medium text-gray-700">Cliquez sur le lien</p>
                    <p className="text-sm text-gray-500">Le lien vous redirigera vers la page de vérification</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold mt-0.5">3</div>
                  <div>
                    <p className="font-medium text-gray-700">Finalisez l'inscription</p>
                    <p className="text-sm text-gray-500">Votre compte sera activé automatiquement</p>
                  </div>
                </div>
              </div>
            </div>

            {/* --- NOUVELLE SECTION BOUTONS --- */}
            <div className="space-y-3 pt-2">
              <button
                onClick={() => setRegistrationSuccess(false)}
                className="w-full py-3 px-4 bg-gray-100 text-gray-700 border border-gray-200 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                Retour au formulaire
              </button>
              
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-500">Vous n'avez pas reçu l'email ?</p>
                <button 
                  onClick={handleResendEmail}
                  disabled={resendTimer > 0}
                  className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 border-2 flex items-center justify-center gap-2
                    ${resendTimer > 0 
                      ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed' 
                      : 'bg-white border-blue-600 text-blue-600 hover:bg-blue-50 hover:shadow-sm'
                    }`}
                >
                  {resendTimer > 0 ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Renvoyer dans {resendTimer}s</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Renvoyer l'email</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );

  // Afficher le vestiaire d'attente si l'inscription est réussie
  if (registrationSuccess) {
    return <WaitingRoom />;
  }

  // Retourner le formulaire d'inscription normal (reste du code inchangé)
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-register">
       {/* ... Contenu du formulaire d'inscription (inchangé) ... */}
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

          {/* Sélection du types d'utilisateur */}
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

            <SubmitBtn
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