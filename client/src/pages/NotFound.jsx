import useTitle from "../hooks/useTitle";
import { Link } from "react-router-dom";
import { 
  HomeIcon, 
  ArrowPathIcon, 
  ExclamationTriangleIcon 
} from "@heroicons/react/24/outline";

function NotFound() {
    useTitle('CMDT - Page non trouvée');
    
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-amber-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 text-center">
                {/* Icone d'attention */}
                <div className="flex justify-center">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-amber-100 text-amber-600">
                        <ExclamationTriangleIcon className="w-12 h-12" />
                    </div>
                </div>
                
                {/* Message d'erreur */}
                <div>
                    <h1 className="text-9xl font-bold text-gray-900">404</h1>
                    <h2 className="mt-4 text-3xl font-extrabold text-gray-900">Page non trouvée</h2>
                    <p className="mt-4 text-lg text-gray-600">
                        Désolé, nous n'avons pas trouvé la page que vous recherchez.
                    </p>
                </div>
                
                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        to="/"
                        className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors duration-200"
                    >
                        <HomeIcon className="w-5 h-5 mr-2" />
                        Retour à l'accueil
                    </Link>
                    <button
                        onClick={() => window.location.reload()}
                        className="inline-flex items-center justify-center px-5 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                    >
                        <ArrowPathIcon className="w-5 h-5 mr-2" />
                        Recharger la page
                    </button>
                </div>
                
                {/* Informations supplémentaires */}
                <div className="mt-8 pt-8 border-t border-gray-200">
                    <p className="text-sm text-gray-500">
                        Si vous pensez qu'il s'agit d'une erreur, veuillez contacter le support technique.
                    </p>
                    <div className="mt-4">
                        <a 
                            href="mailto:support@cmdt.ml" 
                            className="text-green-600 hover:text-green-800 text-sm font-medium transition-colors duration-200"
                        >
                            support@cmdt.ml
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default NotFound;