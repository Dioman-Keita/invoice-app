// Login.jsx
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '../features/connection/loginShema';
import useTitle from '../hooks/useTitle';
import useToastFeedback from '../hooks/useToastFeedBack';
import { Link } from 'react-router-dom';
import { useInputFilters } from '../hooks/useInputFilter';
import AsyncSubmitBtn from '../components/AsyncSubmitBtn';  

function Login() {
  useTitle('CMDT - Connexion');
  const [userType, setUserType] = useState('dfc_agent');
  const { filterEmail, filterPassword } = useInputFilters();
  const [loading, setLoading] = useState(false);
  const { success } = useToastFeedback();
  const { register, formState: { errors }, handleSubmit, setValue } = useForm({
    mode: 'onChange',
    reValidateMode: 'onChange',
    criteriaMode: 'all',
    defaultValues: { email: '', password: '', remember: false, user_type: 'dfc_agent' },
    resolver: zodResolver(loginSchema),
  });
  useEffect(() => {
    setValue('user_type', userType, { shouldValidate: true, shouldDirty: true });
  }, [userType, setValue]);
  const [showPassword, setShowPassword] = useState(false);
  const onSubmit = async (data) => { 
    console.log(data); 
    try {
      setLoading(true);
      await new Promise((res) => setTimeout(res, 2000));
      success('Connexion réussie');
      console.log('Donnees soumises : ', data);
    } catch (error) {
      console.error('Erreurs de validation : ', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-login">
      {/* Section illustration */}
      <div className="md:w-1/2 flex items-center justify-center p-8 bg-green-700 text-white">
        <div className="max-w-md text-center">
          <h1 className="text-4xl font-bold mb-6">CMDT Mali</h1>
          <p className="text-xl mb-6">Plateforme de gestion des factures cotonnières</p>
          <div className="w-64 h-64 mx-auto bg-white/20 rounded-full flex items-center justify-center">
            <svg className="w-32 h-32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M17 14H7C4.23858 14 2 16.2386 2 19C2 20.6569 3.34315 22 5 22H19C20.6569 22 22 20.6569 22 19C22 16.2386 19.7614 14 17 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 7C14 8.65685 12.6569 10 11 10C9.34315 10 8 8.65685 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="mt-8">Système sécurisé de gestion des factures pour la filière cotonnière malienne</p>
        </div>
      </div>

      {/* Formulaire de connexion */}
      <div className="md:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-green-800">Connexion</h2>
            <p className="text-gray-600 mt-2">Accédez à votre espace personnel</p>
          </div>

          {/* Sélection du type d'utilisateur */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Je suis :</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setUserType('dfc_agent')}
                className={`py-3 px-4 rounded-lg border ${
                  userType === 'dfc_agent'
                    ? 'bg-green-100 border-green-500 text-green-700'
                    : 'bg-gray-100 border-gray-300 text-gray-700'
                } transition-colors`}
              >
                Agent DFC
              </button>
              <button
                type="button"
                onClick={() => setUserType('invoice_manager')}
                className={`py-3 px-4 rounded-lg border ${
                  userType === 'invoice_manager'
                    ? 'bg-green-100 border-green-500 text-green-700'
                    : 'bg-gray-100 border-gray-300 text-gray-700'
                } transition-colors`}
              >
                Chargé des factures
              </button>
            </div>
          </div>

          <form noValidate onSubmit={handleSubmit(onSubmit)}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Adresse email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                onInput={filterEmail}
                {...register('email')}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none ${errors.email?.message ? 'border-red-500 focus:border-red-600' : 'border-gray-400 focus:border-gray-600'}`}
                placeholder="votre@email.com"
              />
              {errors.email?.message && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
            </div>

            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  onInput={filterPassword}
                  {...register('password')}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none pr-12 ${errors.password?.message ? 'border-red-500 focus:border-red-600' : 'border-gray-400 focus:border-gray-600'}`}
                  placeholder="Votre mot de passe"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute inset-y-0 right-0 px-3 text-sm text-gray-600 hover:text-gray-800"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? 'Masquer' : 'Afficher'}
                </button>
              </div>
              {errors.password?.message && <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  {...register('remember')}
                />
                <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                  Se souvenir de moi
                </label>
              </div>

              <a href="#" className="text-sm text-green-600 hover:text-green-800">
                Mot de passe oublié?
              </a>
            </div>
            <input type="hidden" {...register("user_type")} name="user_type" value={userType} />

            <AsyncSubmitBtn
              fullWidth
              loading={loading}
              loadingLabel="Connexion en cours..."
              label="Se connecter"
            />

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Vous n'avez pas de compte?{' '}
                <Link to="/register" className="text-green-600 font-medium hover:text-green-800">
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