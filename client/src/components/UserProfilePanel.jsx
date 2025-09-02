import SlideOutPanel from './SlideOutPanel';

function UserProfilePanel({ isOpen, onClose, userName = "Employé", userPhoto = "/image-coton-1.jpg" }) {
  const handleAction = (action) => {
    console.log(`Action: ${action}`);
    onClose();
    // Ajoutez votre logique ici pour chaque action
  };

  return (
    <SlideOutPanel 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Mon Profil"
      position="right"
      width="w-96"
    >
      {/* User Info Section */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-6">
          <img 
            src={userPhoto} 
            alt={userName}
            className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
          />
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{userName}</h3>
            <p className="text-sm text-gray-500">Utilisateur actif</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="space-y-2">
        <button
          onClick={() => handleAction('profile')}
          className="w-full flex items-center space-x-3 p-4 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-left group"
        >
          <div className="p-2 rounded-lg bg-blue-50 group-hover:bg-blue-100 transition-colors duration-200">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-gray-800">Voir mon profil</p>
            <p className="text-sm text-gray-500">Gérer vos informations personnelles</p>
          </div>
        </button>

        <button
          onClick={() => handleAction('settings')}
          className="w-full flex items-center space-x-3 p-4 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-left group"
        >
          <div className="p-2 rounded-lg bg-gray-50 group-hover:bg-gray-100 transition-colors duration-200">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-gray-800">Paramètres</p>
            <p className="text-sm text-gray-500">Configurer vos préférences</p>
          </div>
        </button>

        <button
          onClick={() => handleAction('notifications')}
          className="w-full flex items-center space-x-3 p-4 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-left group"
        >
          <div className="p-2 rounded-lg bg-yellow-50 group-hover:bg-yellow-100 transition-colors duration-200">
            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.19 4.19A2 2 0 006 3h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-gray-800">Notifications</p>
            <p className="text-sm text-gray-500">Gérer vos alertes</p>
          </div>
        </button>

        <button
          onClick={() => handleAction('help')}
          className="w-full flex items-center space-x-3 p-4 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-left group"
        >
          <div className="p-2 rounded-lg bg-green-50 group-hover:bg-green-100 transition-colors duration-200">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-gray-800">Aide & Support</p>
            <p className="text-sm text-gray-500">Besoin d'assistance ?</p>
          </div>
        </button>
      </div>

      {/* Divider */}
      <div className="my-6 border-t border-gray-200"></div>

      {/* Logout Button */}
      <button
        onClick={() => handleAction('logout')}
        className="w-full flex items-center space-x-3 p-4 rounded-lg hover:bg-red-50 transition-colors duration-200 text-left group"
      >
        <div className="p-2 rounded-lg bg-red-50 group-hover:bg-red-100 transition-colors duration-200">
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </div>
        <div>
          <p className="font-medium text-red-600">Se déconnecter</p>
          <p className="text-sm text-red-500">Fermer votre session</p>
        </div>
      </button>
    </SlideOutPanel>
  );
}

export default UserProfilePanel;
