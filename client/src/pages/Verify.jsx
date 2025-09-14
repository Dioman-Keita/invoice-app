import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

function Verify() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('Vérification en cours...');

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Lien invalide ou token manquant.');
      return;
    }

    const verify = async () => {
      try {
        const base = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const res = await fetch(`${base}/auth/verify?token=${encodeURIComponent(token)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data?.success !== false) {
          setStatus('success');
          setMessage(data?.message || 'Votre inscription est vérifiée.');
        } else {
          setStatus('error');
          setMessage(data?.message || 'Échec de la vérification.');
        }
      } catch (e) {
        setStatus('error');
        setMessage("Une erreur est survenue lors de la vérification.");
      }
    };

    verify();
  }, [params]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-login p-4">
      <div className="w-full max-w-md bg-white/80 backdrop-blur rounded-2xl shadow p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="mx-auto mb-4 h-12 w-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            <h1 className="text-xl font-semibold text-gray-800">{message}</h1>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-700">✓</div>
            <h1 className="text-xl font-semibold text-green-800 mb-2">Inscription vérifiée</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <Link to="/login" className="inline-block px-4 py-2 rounded-lg bg-green-700 text-white hover:bg-green-800">Se connecter</Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center text-red-700">✕</div>
            <h1 className="text-xl font-semibold text-red-800 mb-2">Vérification échouée</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <Link to="/register" className="inline-block px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-black">Créer un compte</Link>
          </>
        )}
      </div>
    </div>
  );
}

export default Verify;


