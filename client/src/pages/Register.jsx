// Register.jsx
import { useState } from 'react';
import useTitle from '../hooks/useTitle';
import { Link } from 'react-router-dom';

function Register() {
  useTitle('CMDT - Inscription');
  const [userType, setUserType] = useState('dfc');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    employeeId: '',
    department: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Ici, vous ajouterez la logique d'inscription
    console.log('Inscription en tant que:', userType, formData);
  };

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
      <div className="md:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
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
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Votre prénom"
                  required
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Nom
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Votre nom"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Adresse email professionnelle
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="prenom.nom@cmdt.ml"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700 mb-1">
                Identifiant employé
              </label>
              <input
                type="text"
                id="employeeId"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Votre identifiant CMDT"
                required
              />
            </div>

            {userType === 'dfc' && (
              <div className="mb-4">
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                  Département DFC
                </label>
                <select
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                >
                  <option value="">Sélectionnez votre département</option>
                  <option value="finance">Finance</option>
                  <option value="comptabilite">Comptabilité</option>
                  <option value="controle">Contrôle de gestion</option>
                  <option value="audit">Audit interne</option>
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
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
                  placeholder="Créez un mot de passe"
                  required
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmation
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Confirmez le mot de passe"
                  required
                />
              </div>
            </div>

            <div className="flex items-center mb-6">
              <input
                type="checkbox"
                id="terms"
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                required
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                J'accepte les <a href="#" className="text-green-600 hover:text-green-800">conditions d'utilisation</a> et la <a href="#" className="text-green-600 hover:text-green-800">politique de confidentialité</a>
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Créer mon compte
            </button>

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