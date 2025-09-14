import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function useQuery() {
    const { search } = useLocation();
    return useMemo(() => new URLSearchParams(search), [search]);
}

export default function ResetPassword() {
    const query = useQuery();
    const navigate = useNavigate();
    const token = query.get('token') || '';

    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!token) {
            setError('Lien invalide ou token manquant.');
        }
    }, [token]);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setMessage('');
        if (!token) {
            setError('Token manquant.');
            return;
        }
        if (!password || password.length < 8) {
            setError('Le mot de passe doit contenir au moins 8 caractères.');
            return;
        }
        if (password !== confirm) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }
        try {
            setLoading(true);
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password })
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data?.message || 'Échec de la réinitialisation.');
            }
            setMessage('Mot de passe réinitialisé avec succès. Vous allez être redirigé.');
            setTimeout(() => navigate('/login'), 1500);
        } catch (err) {
            setError(err?.message || 'Une erreur est survenue.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-verify p-4">
            <div className="w-full max-w-md bg-white rounded-md shadow p-6">
                <h1 className="text-xl font-semibold mb-1">Réinitialisation du mot de passe</h1>
                <p className="text-sm text-gray-600 mb-6">Saisissez votre nouveau mot de passe.</p>
                {error && <div className="mb-4 text-sm text-red-600">{error}</div>}
                {message && <div className="mb-4 text-sm text-green-600">{message}</div>}
                <form onSubmit={handleSubmit} method='post'>
                    <div className="mb-4">
                        <label className="block text-sm mb-1">Nouveau mot de passe</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full border rounded px-3 py-2 outline-none focus:ring"
                            placeholder="••••••••"
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm mb-1">Confirmer le mot de passe</label>
                        <input
                            type="password"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            className="w-full border rounded px-3 py-2 outline-none focus:ring"
                            placeholder="••••••••"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !token}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded py-2 disabled:opacity-50"
                    >
                        {loading ? 'Traitement...' : 'Réinitialiser'}
                    </button>
                </form>
            </div>
        </div>
    );
}


