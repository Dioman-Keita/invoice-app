import Header from '../components/Header';
import { useAuth } from '../services/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

function Profile() {
    const { user, isAuthenticated, isLoading, isInitialized, fetchUserProfile } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLoading && isInitialized) {
            if (!isAuthenticated) {
                navigate('/login');
            } else if (!user) {
                fetchUserProfile();
            }
        }
    }, [isAuthenticated, isLoading, isInitialized, user, fetchUserProfile, navigate]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
            <Header />
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
                        <h1 className="text-2xl font-bold text-white">Mon profil</h1>
                        <p className="text-blue-100">Gérez vos informations personnelles</p>
                    </div>

                    <div className="p-6">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-700">
                                {user?.firstName?.[0]?.toUpperCase()}{user?.lastName?.[0]?.toUpperCase()}
                            </div>
                            <div>
                                <p className="text-xl font-semibold text-gray-900">{user?.firstName} {user?.lastName}</p>
                                <p className="text-gray-600">{user?.email}</p>
                                <span className="inline-flex mt-2 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                                    {user?.role}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Coordonnées</h3>
                                <p className="text-gray-900">Téléphone: <span className="text-gray-700">{user?.phone || '—'}</span></p>
                                <p className="text-gray-900">Matricule: <span className="text-gray-700">{user?.employeeId || '—'}</span></p>
                                <p className="text-gray-900">Département: <span className="text-gray-700">{user?.department || '—'}</span></p>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Sécurité</h3>
                                <p className="text-gray-900">Statut: <span className="text-gray-700">{user?.isActive ? 'Actif' : 'Inactif'}</span></p>
                                <p className="text-gray-900">Vérification: <span className="text-gray-700">{user?.isVerified ? 'Vérifié' : 'Non vérifié'}</span></p>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3">
                            <button className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white">Modifier mes infos</button>
                            <button className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300">Changer le mot de passe</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Profile;
