import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import useTitle from '../hooks/useTitle';
import useBackground from '../hooks/useBackground';

import {
  Cog6ToothIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  MoonIcon,
  SunIcon
} from '@heroicons/react/24/outline';

function Settings() {
  useTitle('CMDT - Paramètres');
  useBackground('bg-settings');

  const [prefs, setPrefs] = useState(() => {
    try {
      const raw = localStorage.getItem('cmdt:prefs');
      return raw ? JSON.parse(raw) : { prefersDark: false };
    } catch {
      return { prefersDark: false };
    }
  });
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmNewYear, setConfirmNewYear] = useState(false);

  useEffect(() => {
    localStorage.setItem('cmdt:prefs', JSON.stringify(prefs));
  }, [prefs]);

  const togglePref = (key) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  const handleStartNewYear = () => {
    if (!confirmNewYear) { setConfirmNewYear(true); return; }
    try {
      localStorage.removeItem('cmdt:lastInvoiceNumber');
      // Ajoutez ici d'autres réinitialisations annuelles si nécessaire
    } finally {
      setConfirmNewYear(false);
    }
  };

  const handleResetSettings = () => {
    if (!confirmReset) { setConfirmReset(true); return; }
    try {
      const favorites = localStorage.getItem('cmdt:favorites');
      localStorage.clear();
      if (favorites) localStorage.setItem('cmdt:favorites', favorites);
    } finally {
      setConfirmReset(false);
      setPrefs({ prefersDark: false });
    }
  };

  return (
    <>
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-settings">
        <div className="max-w-4xl mx-auto">
          {/* Navbar */}
          <Navbar />

          {/* En-tête */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Cog6ToothIcon className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Paramètres</h1>
            <p className="text-gray-950">Configurez l'application selon vos préférences</p>
          </div>

          <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-md p-6 mb-8">
            {/* Apparence */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Apparence</h2>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    {prefs.prefersDark ? (
                      <MoonIcon className="w-5 h-5 text-gray-700" />
                    ) : (
                      <SunIcon className="w-5 h-5 text-yellow-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Mode sombre (préférence locale)</p>
                    <p className="text-sm text-gray-600">Enregistre votre préférence. L’application pourra l’utiliser ultérieurement.</p>
                  </div>
                </div>
                <button
                  onClick={() => togglePref('prefersDark')}
                  className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                >
                  {prefs.prefersDark ? 'Préférer clair' : 'Préférer sombre'}
                </button>
              </div>
            </div>

            {/* Données annuelles */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Données annuelles</h2>
              <div className="flex items-center justify-between p-4 border rounded-lg mb-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <CalendarDaysIcon className="w-5 h-5 text-gray-700" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Démarrer une nouvelle année</p>
                    <p className="text-sm text-gray-600">Réinitialise les compteurs annuels (ex: dernier numéro de facture).</p>
                  </div>
                </div>
                <button
                  onClick={handleStartNewYear}
                  className={"px-4 py-2 rounded-lg border " + (confirmNewYear ? 'border-red-300 bg-red-50 text-red-700' : 'border-gray-300 hover:bg-gray-50')}
                >
                  {confirmNewYear ? 'Confirmer' : 'Démarrer'}
                </button>
              </div>
            </div>

            {/* Réinitialiser */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Paramètres de l’application</h2>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <ArrowPathIcon className="w-5 h-5 text-gray-700" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Réinitialiser les paramètres</p>
                    <p className="text-sm text-gray-600">Restaure les valeurs par défaut. Les favoris sont conservés.</p>
                  </div>
                </div>
                <button
                  onClick={handleResetSettings}
                  className={"px-4 py-2 rounded-lg border " + (confirmReset ? 'border-red-300 bg-red-50 text-red-700' : 'border-gray-300 hover:bg-gray-50')}
                >
                  {confirmReset ? 'Confirmer' : 'Réinitialiser'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Settings;


