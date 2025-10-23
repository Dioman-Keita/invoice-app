import { useState } from 'react';
import { 
  QuestionMarkCircleIcon, 
  DocumentTextIcon, 
  PhoneIcon, 
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  DocumentArrowDownIcon,
  MagnifyingGlassIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import Navbar from '../../components/navbar/Navbar.jsx';
import useTitle from '../../hooks/ui/useTitle.js';

function Help() {
  const [activeSection, setActiveSection] = useState('faq');
  const [searchQuery, setSearchQuery] = useState('');
  useTitle('CMDT - Aide & Support')
  const faqData = [
    {
      category: 'Général',
      questions: [
        {
          question: 'Comment créer une nouvelle facture ?',
          answer: 'Pour créer une nouvelle facture, cliquez sur "Nouvelle facture" dans le menu principal. Remplissez les informations du client et les détails de la facture, puis validez.'
        },
        {
          question: 'Comment exporter mes factures en PDF ?',
          answer: 'Utilisez la fonction "Exporter en PDF" disponible dans le menu. Vous pouvez sélectionner les factures à exporter et choisir le format de sortie.'
        },
        {
          question: 'Comment rechercher une facture ?',
          answer: 'La fonction "Rechercher" vous permet de filtrer les factures par numéro, client, date ou montant. Utilisez les critères de recherche pour affiner vos résultats.'
        }
      ]
    },
    {
      category: 'Technique',
      questions: [
        {
          question: 'Le système est-il compatible avec tous les navigateurs ?',
          answer: 'Oui, le système fonctionne sur tous les navigateurs modernes (Chrome, Firefox, Safari, Edge). Nous recommandons d\'utiliser la dernière version pour une expérience optimale.'
        },
        {
          question: 'Que faire si je rencontre des erreurs de connexion ?',
          answer: 'Vérifiez votre connexion internet. Si le problème persiste, contactez le support technique. Les erreurs de connexion sont généralement temporaires.'
        },
        {
          question: 'Comment mettre à jour mes informations de profil ?',
          answer: 'Accédez aux paramètres via l\'icône d\'engrenage dans le menu. Vous pouvez modifier vos informations personnelles et préférences.'
        }
      ]
    },
    {
      category: 'Facturation',
      questions: [
        {
          question: 'Comment modifier une facture déjà créée ?',
          answer: 'Les factures peuvent être modifiées avant validation. Une fois validées, contactez l\'administration pour toute modification.'
        },
        {
          question: 'Quels sont les formats de paiement acceptés ?',
          answer: 'Le système accepte les paiements par virement, chèque et espèces. Les détails de paiement sont configurés selon les paramètres de votre organisation.'
        },
        {
          question: 'Comment imprimer une facture ?',
          answer: 'Utilisez la fonction "Imprimer une facture" du menu. Sélectionnez la facture et choisissez les options d\'impression.'
        }
      ]
    }
  ];

  const contactInfo = [
    {
      icon: <PhoneIcon className="w-6 h-6" />,
      title: 'Support téléphonique',
      details: 'Lundi - Vendredi: 8h00 - 17h00',
      contact: '+225 XX XX XX XX',
      color: 'text-blue-600 bg-blue-100'
    },
    {
      icon: <EnvelopeIcon className="w-6 h-6" />,
      title: 'Email de support',
      details: 'Réponse sous 24h',
      contact: 'support@cmdt.ci',
      color: 'text-green-600 bg-green-100'
    },
    {
      icon: <ChatBubbleLeftRightIcon className="w-6 h-6" />,
      title: 'Chat en direct',
      details: 'Disponible 24h/24',
      contact: 'Cliquez pour démarrer',
      color: 'text-purple-600 bg-purple-100'
    }
  ];

  const filteredFaq = faqData.map(category => ({
    ...category,
    questions: category.questions.filter(q => 
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <>
        <Navbar />
        <div className="min-h-screen bg-help py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
                <div className="p-3 bg-blue-100 rounded-full">
                <QuestionMarkCircleIcon className="w-12 h-12 text-blue-600" />
                </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Aide & Support</h1>
            <p className="text-xl text-gray-900 max-w-3xl mx-auto">
                Trouvez rapidement les réponses à vos questions et accédez à notre support technique
            </p>
            </div>

            {/* Navigation */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
            {[
                { id: 'faq', label: 'FAQ', icon: <QuestionMarkCircleIcon className="w-5 h-5" /> },
                { id: 'contact', label: 'Contact', icon: <PhoneIcon className="w-5 h-5" /> },
                { id: 'guides', label: 'Guides', icon: <DocumentTextIcon className="w-5 h-5" /> }
            ].map(({ id, label, icon }) => (
                <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                    activeSection === id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
                >
                {icon}
                {label}
                </button>
            ))}
            </div>

            {/* FAQ Section */}
            {activeSection === 'faq' && (
            <div className="space-y-8">
                {/* Search */}
                <div className="max-w-2xl mx-auto">
                <div className="relative">
                    <input
                    type="text"
                    placeholder="Rechercher dans la FAQ..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                    />
                    <QuestionMarkCircleIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                </div>

                {/* FAQ Content */}
                <div className="space-y-8">
                {filteredFaq.map((category, categoryIndex) => (
                    <div key={categoryIndex} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">{category.category}</h3>
                    </div>
                    <div className="divide-y divide-gray-200">
                        {category.questions.map((item, index) => (
                        <div key={index} className="p-6">
                            <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-start gap-3">
                            <InformationCircleIcon className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                            {item.question}
                            </h4>
                            <p className="text-gray-600 leading-relaxed pl-8">{item.answer}</p>
                        </div>
                        ))}
                    </div>
                    </div>
                ))}
                </div>

                {filteredFaq.length === 0 && searchQuery && (
                <div className="text-center py-12">
                    <div className="bg-red-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                        <ExclamationTriangleIcon className="w-10 h-10 text-red-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun résultat trouvé</h3>
                    <p className="text-gray-600 mb-4">Aucune question ne correspond à votre recherche "<span className="font-medium text-gray-800">{searchQuery}</span>"</p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                        <p className="text-blue-800 text-sm">
                            <strong>Suggestions :</strong>
                        </p>
                        <ul className="text-blue-700 text-sm mt-2 space-y-1">
                            <li>• Vérifiez l'orthographe</li>
                            <li>• Essayez des mots-clés plus généraux</li>
                            <li>• Contactez notre support technique</li>
                        </ul>
                    </div>
                </div>
                )}
            </div>
            )}

            {/* Contact Section */}
            {activeSection === 'contact' && (
            <div className="space-y-8">
                <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Contactez notre équipe</h2>
                <p className="text-gray-900">Nous sommes là pour vous aider. Choisissez le moyen de contact qui vous convient le mieux.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                {contactInfo.map((contact, index) => (
                    <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center hover:shadow-md transition-shadow">
                    <div className={`w-16 h-16 ${contact.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                        {contact.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{contact.title}</h3>
                    <p className="text-gray-600 mb-3">{contact.details}</p>
                    <p className="text-blue-600 font-medium">{contact.contact}</p>
                    </div>
                ))}
                </div>

                {/* Status indicators */}
                <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Statut des services</h3>
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    <span className="text-gray-900">Système de facturation - Opérationnel</span>
                    </div>
                    <div className="flex items-center gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    <span className="text-gray-900">Base de données - Opérationnelle</span>
                    </div>
                    <div className="flex items-center gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    <span className="text-gray-900">Support technique - Disponible</span>
                    </div>
                </div>
                </div>
            </div>
            )}

            {/* Guides Section */}
            {activeSection === 'guides' && (
            <div className="space-y-8">
                <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Guides d'utilisation</h2>
                <p className="text-gray-900">Consultez nos guides détaillés pour maîtriser toutes les fonctionnalités du système.</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                    {
                    title: 'Guide de création de factures',
                    description: 'Apprenez à créer et gérer vos factures efficacement',
                    icon: <DocumentTextIcon className="w-8 h-8" />,
                    color: 'bg-blue-100 text-blue-600'
                    },
                    {
                    title: 'Guide d\'export et impression',
                    description: 'Maîtrisez l\'export PDF et l\'impression des documents',
                    icon: <DocumentArrowDownIcon className="w-8 h-8" />,
                    color: 'bg-green-100 text-green-600'
                    },
                    {
                    title: 'Guide de recherche avancée',
                    description: 'Utilisez efficacement les outils de recherche et filtrage',
                    icon: <MagnifyingGlassIcon className="w-8 h-8" />,
                    color: 'bg-purple-100 text-purple-600'
                    },
                    {
                    title: 'Guide des paramètres',
                    description: 'Configurez votre profil et vos préférences',
                    icon: <Cog6ToothIcon className="w-8 h-8" />,
                    color: 'bg-orange-100 text-orange-600'
                    },
                    {
                    title: 'Guide de sécurité',
                    description: 'Bonnes pratiques pour sécuriser vos données',
                    icon: <ShieldCheckIcon className="w-8 h-8" />,
                    color: 'bg-red-100 text-red-600'
                    },
                    {
                    title: 'Guide d\'administration',
                    description: 'Fonctionnalités avancées pour les administrateurs',
                    icon: <UserGroupIcon className="w-8 h-8" />,
                    color: 'bg-indigo-100 text-indigo-600'
                    }
                ].map((guide, index) => (
                    <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className={`w-16 h-16 ${guide.color} rounded-lg flex items-center justify-center mb-4`}>
                        {guide.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{guide.title}</h3>
                    <p className="text-gray-600 mb-4">{guide.description}</p>
                    <button className="text-blue-600 font-medium hover:text-blue-700 transition-colors">
                        Consulter le guide →
                    </button>
                    </div>
                ))}
                </div>
            </div>
            )}
        </div>
        </div>
    </>
  );
}

export default Help;
