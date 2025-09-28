import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../services/useAuth";

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
    const [isSuccess, setIsSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { resetPassword } = useAuth();

    useEffect(() => {
        if (!token) {
            setError('Lien invalide ou token manquant.');
        }
    }, [token]);

    // Validation du mot de passe
    const validatePassword = (pwd) => {
        if (pwd.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères.';
        if (pwd.length > 20) return 'Le mot de passe ne doit pas dépasser 20 caractères.';
        if (!/[A-Z]/.test(pwd)) return 'Le mot de passe doit contenir au moins une lettre majuscule.';
        if (!/[@$!%*?&]/.test(pwd)) return 'Le mot de passe doit contenir au moins un caractère spécial (@$!%*?&).';
        return null;
    };

    const handlePasswordChange = (e) => {
        const value = e.target.value;
        if (value.length <= 20) {
            setPassword(value);
        }
    };

    const handleConfirmPasswordChange = (e) => {
        const value = e.target.value;
        if (value.length <= 20) {
            setConfirm(value);
        }
    };

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setMessage('');
        
        if (!token) {
            setError('Token manquant.');
            return;
        }

        const passwordError = validatePassword(password);
        if (passwordError) {
            setError(passwordError);
            return;
        }

        if (password !== confirm) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }

        try {
            setLoading(true);
            const res = await resetPassword({
                token,
                password,
                confirm_password: confirm
            });

            if (res.success) {
                setMessage(res.message || 'Mot de passe réinitialisé. Vous allez être redirigé.');
                setIsSuccess(true);
                window.history.replaceState({}, document.title, window.location.pathname);
                setTimeout(() => navigate('/login'), 1500);
            } else {
                setError(res.message || 'Erreur lors de la réinitialisation');
                setIsSuccess(false);
            }
        } catch (err) {
            setError(err?.message || 'Une erreur est survenue.');
        } finally {
            setLoading(false);
        }
    }

    // Indicateur de force du mot de passe
    const getPasswordStrength = () => {
        if (password.length === 0) return { strength: 0, color: 'gray' };
        
        let strength = 0;
        if (password.length >= 8) strength += 33;
        if (/[A-Z]/.test(password)) strength += 33;
        if (/[@$!%*?&]/.test(password)) strength += 34; // total = 100

        let color = 'red';
        if (strength >= 75) color = 'green';
        else if (strength >= 50) color = 'yellow';
        else if (strength >= 25) color = 'orange';

        return { strength, color };
    };

    const passwordStrength = getPasswordStrength();

    return (
        <div className="min-h-screen flex items-center justify-center bg-verify p-4">
            <div className="w-full max-w-md bg-white rounded-md shadow p-6">
                <h1 className="text-xl font-semibold mb-1">Réinitialisation du mot de passe</h1>
                <p className="text-sm text-gray-600 mb-6">Saisissez votre nouveau mot de passe.</p>
                
                {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">{error}</div>}
                {message && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-600">{message}</div>}
                
                <form onSubmit={handleSubmit} method='post'>
                    {/* Nouveau mot de passe */}
                    <div className="mb-4">
                        <label className="block text-sm mb-1">Nouveau mot de passe</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={handlePasswordChange}
                                className="w-full border rounded px-3 py-2 outline-none focus:ring pr-10"
                                placeholder="••••••••"
                                disabled={isSuccess}
                                maxLength={20}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                disabled={isSuccess}
                            >
                                {showPassword ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        {password.length > 0 && (
                            <div className="mt-2">
                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                    <span>Force du mot de passe:</span>
                                    <span>{passwordStrength.strength}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                        className={`h-2 rounded-full ${
                                            passwordStrength.color === 'green' ? 'bg-green-500' :
                                            passwordStrength.color === 'yellow' ? 'bg-yellow-500' :
                                            passwordStrength.color === 'orange' ? 'bg-orange-500' : 'bg-red-500'
                                        }`}
                                        style={{ width: `${passwordStrength.strength}%` }}
                                    ></div>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    Doit contenir: 8-20 caractères, majuscule, caractère spécial (@$!%*?&)
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Confirmation */}
                    <div className="mb-6">
                        <label className="block text-sm mb-1">Confirmer le mot de passe</label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirm}
                                onChange={handleConfirmPasswordChange}
                                className="w-full border rounded px-3 py-2 outline-none focus:ring pr-10"
                                placeholder="••••••••"
                                disabled={isSuccess}
                                maxLength={20}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                disabled={isSuccess}
                            >
                                {showConfirmPassword ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        {confirm.length > 0 && password !== confirm && (
                            <div className="mt-1 text-sm text-red-600">Les mots de passe ne correspondent pas.</div>
                        )}
                        {confirm.length > 0 && password === confirm && password.length >= 8 && (
                            <div className="mt-1 text-sm text-green-600">Les mots de passe correspondent.</div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !token || isSuccess || validatePassword(password) !== null || password !== confirm}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                        {loading ? 'Traitement...' : isSuccess ? 'Réinitialisation réussie' : 'Réinitialiser'}
                    </button>
                </form>

                <div className="mt-6 pt-4 border-t border-gray-200 text-center">
                    <Link 
                        to="/login" 
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                        ← Retour à la connexion
                    </Link>
                </div>
            </div>
        </div>
    );
}
