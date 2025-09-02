// Login.jsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import useTitle from '../hooks/useTitle';
import { Link } from 'react-router-dom';

function Login() {
  useTitle('CMDT - Connexion');
  const [userType, setUserType] = useState('dfc');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const { register, formState: {errors}, handleSubmit } = useForm();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-green-50 via-white to-amber-50">
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
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
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
                onClick={() => setUserType('dfc')}
                className={`py-3 px-4 rounded-lg border ${
                  userType === 'dfc'
                    ? 'bg-green-100 border-green-500 text-green-700'
                    : 'bg-gray-100 border-gray-300 text-gray-700'
                } transition-colors`}
              >
                Agent DFC
              </button>
              <button
                type="button"
                onClick={() => setUserType('factures')}
                className={`py-3 px-4 rounded-lg border ${
                  userType === 'factures'
                    ? 'bg-green-100 border-green-500 text-green-700'
                    : 'bg-gray-100 border-gray-300 text-gray-700'
                } transition-colors`}
              >
                Chargé des factures
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Adresse email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="votre@email.com"
                required
              />
            </div>

            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Votre mot de passe"
                required
              />
            </div>

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                  Se souvenir de moi
                </label>
              </div>

              <a href="#" className="text-sm text-green-600 hover:text-green-800">
                Mot de passe oublié?
              </a>
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Se connecter
            </button>

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