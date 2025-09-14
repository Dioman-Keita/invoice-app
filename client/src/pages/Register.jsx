// Register.jsx
import { useState, useEffect } from 'react';
import useTitle from '../hooks/useTitle';
import { useInputFilters } from '../hooks/useInputFilter';
import { usePhoneFormatter } from '../hooks/usePhoneFormater';
import useToastFeedback from '../hooks/useToastFeedBack';
import { Link } from 'react-router-dom';
import { registerSchema } from '../features/connection/loginShema';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AsyncSubmitBtn from '../components/AsyncSubmitBtn';

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
    filterEmployeeId
  } = useInputFilters();

  const { formatPhoneNumber, handlePhoneKeyDown } = usePhoneFormatter();
  const { success } = useToastFeedback();

  const { 
    register, 
    handleSubmit, 
    formState: {errors}, 
    control, 
    trigger, 
    setValue
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
      success("Compte créé avec succès !");
      console.log('Donnees soumises : ', data);
    } catch (error) {
      console.error('Erreurs de validation : ', error);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    setValue('role', role, { shouldValidate: true, shouldDirty: true });
  }, [role, setValue]);
  
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-register">
      {/* Section illustration */}
      <div className="md:w-1/2 flex items-center justify-center p-8 bg-green-700 text-white">
        <div className="max-w-md text-center">
          <h1 className="text-4xl font-bold mb-6">CMDT Mali</h1>
          <p className="text-xl mb-6">Rejoignez notre plateforme de gestion</p>
          <div className="w-64 h-64 mx-auto bg-white/20 rounded-full flex items-center justify-center">
            <svg className="w-32 h-32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15 7C15 8.65685 13.6569 10 12 10C10.3431 10 9 8.65685 9 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="mt-8">Accédez à tous les outils de gestion des factures cotonnières</p>
        </div>
      </div>

      {/* Formulaire d'inscription */}
      <div className="md:w-1/2 flex items-center justify-center p-10">
        <div className="w-full max-w-lg bg-white/90 backdrop-blur-md rounded-2xl shadow-lg p-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-green-800">Inscription</h2>
            <p className="text-gray-600 mt-2">Créez votre compte personnel</p>
          </div>

          {/* Sélection du type d'utilisateur */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Je suis :</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole('dfc_agent')}
                className={`py-3 px-4 rounded-lg border ${
                  role === 'dfc_agent'
                    ? 'bg-green-100 border-green-500 text-green-700'
                    : 'bg-gray-100 border-gray-300 text-gray-700'
                } transition-colors`}
              >
                Agent DFC
              </button>
              <button
                type="button"
                onClick={() => setRole('invoice_manager')}
                className={`py-3 px-4 rounded-lg border ${
                  role === 'invoice_manager'
                    ? 'bg-green-100 border-green-500 text-green-700'
                    : 'bg-gray-100 border-gray-300 text-gray-700'
                } transition-colors`}
              >
                Chargé des factures
              </button>
            </div>
          </div>

          <form noValidate onSubmit={handleSubmit(onSubmit)} method='post'>
            <div className="grid grid-cols-1 gap-4 mb-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom
                </label>
                <input
                  type="text"
                  id="firstName"
                  onInput={filterFirstName}
                  {...register("firstName")}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none ${errors['firstName']?.message ? 'border-red-500 focus:border-red-600' : 'border-gray-400 focus:border-gray-600'}`}
                  placeholder="Votre prénom"
                />
                {errors['firstName'] && (
                <p className="text-sm text-red-600 mt-1">{errors['firstName'].message}</p>)}

              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Nom
                </label>
                <input
                  type="text"
                  id="lastName"
                  onInput={filterLastName}
                  {...register("lastName")}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none ${errors['lastName']?.message ? 'border-red-500 focus:border-red-600' : 'border-gray-400 focus:border-gray-600'}`}
                  placeholder="Votre nom"
                />
                {errors['lastName']?.message && (<p className="text-sm text-red-600 mt-1">{errors.lastName.message}</p>)}
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Adresse email professionnelle
              </label>
              <input
                type="email"
                id="email"
                {...register("email")}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none ${errors['email']?.message ? 'border-red-500 focus:border-red-600' : 'border-gray-400 focus:border-gray-600'}`}
                placeholder="prenom.nom@cmdt.ml"
                onInput={filterEmail}
              />
              {errors.email?.message && (
                <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700 mb-1">
                Identifiant employé
              </label>
              <input
                type="text"
                onInput={filterEmployeeId}
                id="employeeId"
                {...register("employeeId")}
                className = {`w-full px-4 py-3 rounded-lg border focus:outline-none ${errors.employeeId?.message ? 'border-red-500 focus:border-red-600' : 'border-gray-400 focus:border-gray-600'}`}
                placeholder="Votre identifiant CMDT"
              />
              {errors.employeeId?.message && <p className="text-sm text-red-600 mt-1">{errors.employeeId.message}</p>}
            </div>
            <div className="mb-4">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Numéro de téléphone
              </label>
              <input
                type="tel"
                id="phone"
                onInput={formatPhoneNumber}
                onKeyDown={handlePhoneKeyDown}
                onFocus={(e) => {
                    if (e.target.value === '') {
                      e.target.value = '+223 ';
                    }
                }}
                {...register("phone")}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none ${errors.phone?.message ? 'border-red-500 focus:border-red-600' : 'border-gray-400 focus:border-gray-600'}`}
                placeholder="+223 00 00 00 00"
              />
              {errors.phone?.message && <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>}
            </div>

              <div className="mb-4">
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                  Département DFC
                </label>
                <select
                  id="department"
                  {...register("department")}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none ${errors.department?.message ? 'border-red-500 focus:border-red-600' : 'border-gray-400 focus:border-gray-600'}`}
                >
                {role === 'dfc_agent' ? (
                  <>
                    <option value="">Sélectionnez votre département</option>
                    <option value="finance">Finance</option>
                    <option value="comptabilité">Comptabilité</option>
                    <option value="contrôle_de_gestion">Contrôle de gestion</option>
                    <option value="audit_interne">Audit interne</option>
                  </>
                ) : (
                 <>
                  <option value="">Sélectionnez votre département</option>
                  <option value="facturation">Facturation</option>
                  <option value="comptabilité_client">Comptabilité Client</option>
                  <option value="gestion_factures">Gestion des Factures</option>
                </>
                )}
                </select>
                {errors.department?.message && (
                  <p className="text-sm text-red-500 mt-1">{errors.department.message}</p>
                )}
              </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    onInput={filterPassword}
                    className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none ${errors.password?.message ? 'border-red-500 focus:border-red-600' : 'border-gray-400 focus:border-gray-600'} appearance-none [&::-ms-reveal]:hidden [&::-ms-clear]:hidden`}
                    placeholder="mot de passe"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute inset-y-0 right-0 my-1 mr-1 px-3 text-xs text-gray-500 hover:text-gray-700 rounded-md"
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showPassword ? 'Masquer' : 'Afficher'}
                  </button>
                </div>
                {errors.password?.message && <p className="text-sm text-red-500">{errors.password.message}</p>}
              </div>
              <div>
                <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmation
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirm_password"
                    onInput={filterConfirmPassword}
                    className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none ${errors.confirm_password?.message ? 'border-red-500 focus:border-red-600' : 'border-gray-400 focus:border-gray-600'} appearance-none [&::-ms-reveal]:hidden [&::-ms-clear]:hidden`}
                    placeholder="Confirmez"
                    {...register("confirm_password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(v => !v)}
                    className="absolute inset-y-0 right-0 my-1 mr-1 px-3 text-xs text-gray-500 hover:text-gray-700 rounded-md"
                    aria-label={showConfirmPassword ? 'Masquer la confirmation' : 'Afficher la confirmation'}
                  >
                    {showConfirmPassword ? 'Masquer' : 'Afficher'}
                  </button>
                </div>
                {errors.confirm_password?.message && <p className="text-sm text-red-600 mt-1">{errors.confirm_password.message}</p>}
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="terms"
                  {...register("terms")}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                  J'accepte les <a href="#" className="text-green-600 hover:text-green-800">conditions d'utilisation</a> et la <a href="#" className="text-green-600 hover:text-green-800">politique de confidentialité</a>
                </label>
              </div>
              {errors.terms?.message && <p className="text-sm text-red-600 mt-1 ml-6">{errors.terms.message}</p>}
            </div>
            <input type="hidden" {...register("role")} name="role" value={role} />

            <AsyncSubmitBtn 
              fullWidth
              label="Créer mon compte"
              loadingLabel="Création en cours..."
              loading={loading}
            />

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Vous avez déjà un compte?{' '}
                <Link to="/login" className="text-green-600 font-medium hover:text-green-800">
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