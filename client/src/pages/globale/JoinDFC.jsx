import { useState } from 'react';
import useTitle from '../../hooks/ui/useTitle.js';
import useBackground from '../../hooks/ui/useBackground.js';
import Navbar from '../../components/navbar/Navbar.jsx';
import Footer from '../../components/global/Footer.jsx';
import { 
  UserPlusIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

function JoinDFC() {
  useTitle('CMDT - Devenir agent DFC');
  useBackground('bg-joinDFC');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    employeeId: '',
    motivation: '',
    experience: '',
    skills: []
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  const skillsList = [
    'Comptabilité',
    'Finance',
    'Gestion de projet',
    'Analyse de données',
    'Relation fournisseurs',
    'Négociation',
    'Logiciels de gestion',
    'Excel avancé'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('DFC Application:', formData);
    // Logique de soumission ici
    setSubmitted(true);
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      // Soumettre le formulaire
      handleSubmit(new Event('submit'));
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen  py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-md p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
              <ShieldCheckIcon className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Candidature envoyée !</h1>
            <p className="text-gray-600 mb-6">
              Votre demande pour devenir agent DFC a été soumise avec succès.
              Notre équipe va examiner votre candidature et vous contactera sous peu.
            </p>
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Délai de traitement :</strong> 3 à 5 jours ouvrables
              </p>
            </div>
            <button
              onClick={() => setSubmitted(false)}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium"
            >
              Soumettre une nouvelle candidature
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Navbar */}
          <Navbar />
          {/* En-tête */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <UserPlusIcon className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Devenir Agent DFC</h1>
            <p className="text-gray-900">Rejoignez l'équipe des agents Département Finances et Comptabilité</p>
          </div>

          {/* Barre de progression */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    currentStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step}
                  </div>
                  <span className="text-[1rem] mt-2 text-gray-900">
                    {step === 1 ? 'Informations' : step === 2 ? 'Compétences' : 'Validation'}
                  </span>
                </div>
              ))}
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-between">
                {[1, 2].map((step) => (
                  <div
                    key={step}
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  ></div>
                ))}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6">
            {/* Étape 1: Informations personnelles */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-6">Informations personnelles</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Prénom *</label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email professionnel *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Département *</label>
                    <select
                      required
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Sélectionnez un département</option>
                      <option value="finance">Finance</option>
                      <option value="comptabilite">Comptabilité</option>
                      <option value="achats">Achats</option>
                      <option value="controle">Contrôle de gestion</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Poste actuel *</label>
                    <input
                      type="text"
                      required
                      value={formData.position}
                      onChange={(e) => setFormData({...formData, position: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Identifiant employé *</label>
                  <input
                    type="text"
                    required
                    value={formData.employeeId}
                    onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Étape 2: Compétences et expérience */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-6">Compétences et expérience</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Compétences *</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {skillsList.map((skill) => (
                      <label key={skill} className="flex items-center p-3 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors duration-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.skills.includes(skill)}
                          onChange={(e) => {
                            const newSkills = e.target.checked
                              ? [...formData.skills, skill]
                              : formData.skills.filter(s => s !== skill);
                            setFormData({...formData, skills: newSkills});
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-3 text-sm text-gray-700">{skill}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Années d'expérience *</label>
                  <select
                    required
                    value={formData.experience}
                    onChange={(e) => setFormData({...formData, experience: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Sélectionnez</option>
                    <option value="0-2">0-2 ans</option>
                    <option value="2-5">2-5 ans</option>
                    <option value="5-10">5-10 ans</option>
                    <option value="10+">10+ ans</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lettre de motivation *</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.motivation}
                    onChange={(e) => setFormData({...formData, motivation: e.target.value})}
                    placeholder="Expliquez pourquoi vous souhaitez devenir agent DFC..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Étape 3: Validation */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-6">Validation de la candidature</h2>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <CheckCircleIcon className="w-6 h-6 text-green-600 mr-2" />
                    <h3 className="font-medium text-green-800">Récapitulatif de votre candidature</h3>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nom complet:</span>
                      <span className="font-medium">{formData.firstName} {formData.lastName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Département:</span>
                      <span className="font-medium">{formData.department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Poste:</span>
                      <span className="font-medium">{formData.position}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Expérience:</span>
                      <span className="font-medium">{formData.experience}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Compétences:</span>
                      <span className="font-medium">{formData.skills.length} sélectionnées</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="font-medium text-blue-800 mb-3">Conditions requises</h3>
                  <ul className="text-sm text-blue-700 space-y-2">
                    <li className="flex items-center">
                      <CheckCircleIcon className="w-4 h-4 mr-2 text-blue-600" />
                      Être employé de la CMDT depuis plus de 6 mois
                    </li>
                    <li className="flex items-center">
                      <CheckCircleIcon className="w-4 h-4 mr-2 text-blue-600" />
                      Avoir une expérience en gestion financière
                    </li>
                    <li className="flex items-center">
                      <CheckCircleIcon className="w-4 h-4 mr-2 text-blue-600" />
                      Être recommandé par son supérieur hiérarchique
                    </li>
                  </ul>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    required
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-sm text-gray-700">
                    Je certifie que les informations fournies sont exactes et complètes
                  </span>
                </div>
              </div>
            )}

            {/* Boutons de navigation */}
            <div className="flex justify-between pt-8 mt-8 border-t border-gray-200">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
                >
                  Retour
                </button>
              ) : (
                <div></div>
              )}
              
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
              >
                {currentStep === 3 ? 'Soumettre la candidature' : 'Suivant'}
              </button>
            </div>
          </form>

          {/* Informations supplémentaires */}
          <div className="mt-8 bg-gray-100 rounded-xl p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">À propos du rôle d'Agent DFC</h3>
            <p className="text-gray-600 text-sm mb-4">
              Les agents DFC (Département Finances et Comptabilité) sont responsables de la gestion 
              des flux financiers, de la vérification des factures et de la maintenance des registres 
              comptables de la CMDT.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Avantages</h4>
                <ul className="text-gray-600 space-y-1">
                  <li>• Formation continue gratuite</li>
                  <li>• Accès aux outils professionnels</li>
                  <li>• Évolution de carrière</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Responsabilités</h4>
                <ul className="text-gray-600 space-y-1">
                  <li>• Vérification des factures</li>
                  <li>• Gestion des paiements</li>
                  <li>• Reporting financier</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default JoinDFC;