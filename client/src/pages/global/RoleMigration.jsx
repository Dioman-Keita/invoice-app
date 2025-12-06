import api from '../../services/api';
import useToastFeedback from '../../hooks/ui/useToastFeedBack.js';
import { useState } from 'react';
import useTitle from '../../hooks/ui/useTitle.js';
import { useAuth } from '../../hooks/auth/useAuth.js';
import Navbar from '../../components/navbar/Navbar.jsx';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  UsersIcon,
  DocumentTextIcon,
  ClockIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

function RoleMigration() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useTitle('CMDT - Demande de changement de rôle');

  // Configuration simple
  const getMigrationConfig = () => {
    if (!user?.role) return null;

    if (user.role === 'dfc_agent') {
      return {
        fromRole: 'Agent DFC',
        toRole: 'Gestionnaire de Factures',
        targetRole: 'invoice_manager',
        departments: ['Facturation', 'Comptabilité Client', 'Gestion des factures'],
        description: 'Gestion des factures clients et fournisseurs'
      };
    }

    if (user.role === 'invoice_manager') {
      return {
        fromRole: 'Gestionnaire de Factures',
        toRole: 'Agent DFC',
        targetRole: 'dfc_agent',
        departments: ['Finance', 'Comptabilité', 'Contrôle de gestion', 'Audit interne'],
        description: 'Gestion des données financières centralisées'
      };
    }

    return null;
  };

  const config = getMigrationConfig();
  const [department, setDepartment] = useState('');
  const [motivation, setMotivation] = useState('');
  const { success, error } = useToastFeedback();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!department || !motivation.trim()) return;

    setLoading(true);
    try {
      await api.post('/api/migration/request', {
        department,
        motivation,
        targetRole: config.targetRole
      });
      setSubmitted(true);
      success('Demande envoyée avec succès');
    } catch (err) {
      console.error('Erreur migration:', err);
      // Use standard error handling logic
      error(err.response?.data?.message || 'Erreur lors de l\'envoi de la demande');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setDepartment('');
    setMotivation('');
  };

  // Vérifications
  if (!user) return <AccessScreen />;
  if (user.role === 'admin') return <AdminScreen />;
  if (!config) return <NoAccessScreen />;
  if (submitted) return <SuccessScreen config={config} department={department} resetForm={resetForm} user={user} />;

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex flex-col md:flex-row bg-roleMigration bg-cover bg-center">
        {/* Section formulaire (gauche) */}
        <div className="md:w-1/2 flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="p-8">
              {/* En-tête */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-xl mb-4">
                  <ArrowPathIcon className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Demande de changement de rôle</h1>
                <p className="text-gray-600 mt-2">Formulaire de migration interne CMDT</p>
              </div>

              {/* Carte info utilisateur simplifiée */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <EnvelopeIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Demandeur</div>
                    <div className="font-medium text-gray-800">{user.email}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div>
                    <div className="text-sm text-gray-500">Rôle actuel</div>
                    <div className="font-medium text-gray-800">{config.fromRole}</div>
                  </div>
                  <ArrowPathIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Rôle souhaité</div>
                    <div className="font-medium text-blue-600">{config.toRole}</div>
                  </div>
                </div>
              </div>

              {/* Formulaire */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Département */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <BuildingOfficeIcon className="w-4 h-4 text-gray-500" />
                    Département pour {config.toRole}
                  </label>
                  <select
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="">Sélectionnez un département</option>
                    {config.departments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                {/* Motivation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <ChatBubbleLeftRightIcon className="w-4 h-4 text-gray-500" />
                    Motivation
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={motivation}
                    onChange={(e) => setMotivation(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder="Expliquez brièvement les raisons de votre demande de changement de rôle..."
                  />
                </div>

                {/* Boutons */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="space-y-4">
                    <button
                      type="submit"
                      disabled={loading || !department || !motivation.trim()}
                      className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? 'Envoi en cours...' : 'Envoyer la demande'}
                    </button>

                    <button
                      type="button"
                      onClick={() => window.location.href = '/dashboard'}
                      className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Section informative (droite) */}
        <div className="md:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-green-600 to-green-800 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10 max-w-md w-full">
            {/* En-tête section info */}
            <div className="mb-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <UsersIcon className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-center mb-3">Processus de Migration</h2>
              <p className="text-green-100 text-center">Demande de changement de rôle interne</p>
            </div>

            {/* Carte informative principale */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/20 rounded-lg">
                  <UserCircleIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Procédure de validation</h3>
                  <p className="text-green-100 text-sm">Votre demande sera examinée par l'administration</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Étape 1 */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Soumission de la demande</h4>
                    <p className="text-green-100 text-sm">
                      Vous remplissez ce formulaire qui sera transmis à l'administrateur
                    </p>
                  </div>
                </div>

                {/* Étape 2 */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Examen par l'administrateur</h4>
                    <p className="text-green-100 text-sm">
                      L'administrateur examine votre profil, compétences et motivations
                    </p>
                  </div>
                </div>

                {/* Étape 3 */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Décision administrative</h4>
                    <p className="text-green-100 text-sm">
                      L'administrateur prend une décision basée sur votre demande
                    </p>
                  </div>
                </div>

                {/* Étape 4 */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="font-bold">4</span>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Notification du résultat</h4>
                    <p className="text-green-100 text-sm">
                      Vous êtes informé de la décision par email
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Informations complémentaires */}
            <div className="mt-6 space-y-4">
              {/* Délai de traitement */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <ClockIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium">Délai de traitement</h4>
                    <p className="text-green-100 text-sm">24 à 48 heures maximum</p>
                  </div>
                </div>
              </div>

              {/* Confidentialité */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <ShieldCheckIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium">Confidentialité</h4>
                    <p className="text-green-100 text-sm">
                      Votre demande est traitée de manière strictement confidentielle
                    </p>
                  </div>
                </div>
              </div>

              {/* Documentation */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <DocumentTextIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium">Politique interne</h4>
                    <p className="text-green-100 text-sm">
                      Conformité avec les procédures internes CMDT
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Information importante */}
            <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-center">
                <p className="text-sm text-green-100">
                  <strong>Important :</strong> Une copie de votre demande sera automatiquement envoyée à votre adresse email.
                </p>
                <p className="text-xs text-green-200 mt-1">
                  La réponse vous parviendra à cette même adresse
                </p>
              </div>
            </div>
          </div>

          {/* Éléments décoratifs */}
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/5 rounded-full blur-xl"></div>
        </div>
      </div>
    </>
  );
}

// Écrans simples
const AccessScreen = () => (
  <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
    <div className="text-center">
      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
        <ArrowPathIcon className="w-6 h-6 text-gray-600" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Connexion requise</h2>
      <p className="text-gray-600 mb-6">Veuillez vous connecter pour accéder à cette page.</p>
      <button
        onClick={() => window.location.href = '/login'}
        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Se connecter
      </button>
    </div>
  </div>
);

const AdminScreen = () => (
  <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
    <div className="text-center">
      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
        <CheckCircleIcon className="w-6 h-6 text-green-600" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Rôle administrateur</h2>
      <p className="text-gray-600 mb-6">Vous disposez déjà de tous les accès.</p>
      <button
        onClick={() => window.location.href = '/dashboard'}
        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Tableau de bord
      </button>
    </div>
  </div>
);

const NoAccessScreen = () => (
  <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
    <div className="text-center">
      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
        <ArrowPathIcon className="w-6 h-6 text-gray-600" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Non disponible</h2>
      <p className="text-gray-600 mb-6">Cette fonctionnalité n'est pas accessible pour votre rôle.</p>
      <button
        onClick={() => window.location.href = '/dashboard'}
        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Retour
      </button>
    </div>
  </div>
);

const SuccessScreen = ({ config, department, resetForm, user }) => (
  <div className="min-h-screen flex items-center justify-center p-4 bg-roleMigration bg-cover bg-center">
    <div className="max-w-md w-full">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircleIcon className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Demande transmise à l'administrateur</h1>
        <p className="text-gray-600">Votre demande a été soumise avec succès.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <div className="text-sm text-gray-500">Migration demandée</div>
            <div className="font-medium text-gray-800 flex items-center gap-3">
              <span>{config.fromRole}</span>
              <ArrowPathIcon className="w-4 h-4 text-gray-400" />
              <span className="text-blue-600">{config.toRole}</span>
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-500">Département</div>
            <div className="font-medium text-gray-800">{department}</div>
          </div>

          <div>
            <div className="text-sm text-gray-500">Demandeur</div>
            <div className="font-medium text-gray-800">{user?.email}</div>
          </div>

          <div>
            <div className="text-sm text-gray-500">Statut</div>
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              En attente de validation par l'administrateur
            </div>
          </div>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
        <div className="text-center">
          <p className="text-sm text-green-700">
            Une confirmation a été envoyée à l'<strong>administrateur</strong> et à votre adresse email
          </p>
          <p className="text-xs text-green-600 mt-2">
            Vous recevrez une réponse sous 24 à 48 heures.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={resetForm}
          className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Nouvelle demande
        </button>
        <button
          onClick={() => window.location.href = '/'}
          className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Retour à l'accueil
        </button>
      </div>
    </div>
  </div>
);

export default RoleMigration;