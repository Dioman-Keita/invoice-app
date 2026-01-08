import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../../hooks/auth/useAuth.js";
import useTitle from "../../hooks/ui/useTitle.js";

function useQuery() {
    const { search } = useLocation();
    return useMemo(() => new URLSearchParams(search), [search]);
}

export default function ResetPassword() {
    useTitle('CMDT - Réinitialisation mot de passe');
    const query = useQuery();
    const navigate = useNavigate();
    const token = query.get('token') || '';
    const { resetPassword, isLoading: authLoading } = useAuth();

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [backendError, setBackendError] = useState('');

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting },
        setError,
        clearErrors,
        setValue,
        trigger
    } = useForm({
        mode: 'onChange',
        defaultValues: {
            password: '',
            confirmPassword: ''
        }
    });

    const passwordValue = watch('password');
    const confirmPasswordValue = watch('confirmPassword');

    useEffect(() => {
        if (!token) {
            setError('root', { message: 'Lien invalide ou token manquant.' });
        }
    }, [token, setError]);

    // Password validation
    const validatePassword = (password) => {
        if (password.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères (incluant au moins un chiffre).';
        if (!/[A-Z]/.test(password)) return 'Le mot de passe doit contenir au moins une lettre majuscule.';
        if (!/\d/.test(password)) return 'Le mot de passe doit contenir au moin 1 chiffre.';
        if (password.length > 20) return 'Le mot de passe ne doit pas dépasser 20 caractères.';
        if (!/[@$!%*?&]/.test(password)) return 'Le mot de passe doit contenir au moins un caractère spécial (@$!%*?&).';
        return true;
    };

    const onSubmit = async (data) => {
        if (!token) {
            setError('root', { message: 'Token manquant.' });
            return;
        }

        clearErrors();
        setBackendError('');

        try {
            // Correct format for the server - include confirmPassword
            const credentials = {
                token: token,
                password: data.password,
                confirmPassword: data.confirmPassword
            };

            const result = await resetPassword(credentials);

            if (result.success) {
                setIsSuccess(true);
                setBackendError('');
                // window.history.replaceState({}, document.title, window.location.pathname); // Removed for Electron HashRouter compatibility

                // Redirection timeout
                setTimeout(() => navigate('/login'), 5000);
            } else {
                setBackendError(result.message || 'Échec de la réinitialisation.');
            }
        } catch (err) {
            setBackendError(err?.message || 'Une erreur est survenue.');
        }
    };

    // Password strength indicator
    const getPasswordStrength = () => {
        if (!passwordValue) return { strength: 0, color: 'gray' };

        let strength = 0;
        if (passwordValue.length >= 8) strength += 33;
        if (/[A-Z]/.test(passwordValue)) strength += 33;
        if (/[@$!%*?&]/.test(passwordValue)) strength += 34;

        let color = 'red';
        if (strength >= 75) color = 'green';
        else if (strength >= 50) color = 'yellow';
        else if (strength >= 25) color = 'orange';

        return { strength, color };
    };

    const passwordStrength = getPasswordStrength();
    const loading = isSubmitting || authLoading;

    // Button disabling conditions
    const isButtonDisabled =
        !token || // Missing token
        isSuccess || // Success
        !passwordValue || // No password entered
        !confirmPasswordValue || // No confirmation
        passwordValue !== confirmPasswordValue || // Different passwords
        errors.password !== undefined || // Password validation error
        errors.confirmPassword !== undefined; // Confirmation validation error

    return (
        <div className="min-h-screen flex items-center justify-center bg-verify p-4">
            <div className="w-full max-w-md bg-white rounded-md shadow p-6">
                <h1 className="text-xl font-semibold mb-1">Réinitialisation du mot de passe</h1>
                <p className="text-sm text-gray-600 mb-6">Saisissez votre nouveau mot de passe.</p>

                {errors.root && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                        {errors.root.message}
                    </div>
                )}

                {backendError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                        {backendError}
                    </div>
                )}

                {isSuccess && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-600">
                        Mot de passe réinitialisé avec succès. Vous allez être redirigé vers la page de connexion...
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} method='post'>
                    {/* New password */}
                    <div className="mb-4">
                        <label className="block text-sm mb-1">Nouveau mot de passe</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                {...register('password', {
                                    required: 'Le mot de passe est requis',
                                    validate: validatePassword,
                                    onChange: (e) => {
                                        const value = e.target.value;
                                        if (value.length <= 20) {
                                            setValue('password', value);
                                            trigger('password');
                                            if (confirmPasswordValue) {
                                                trigger('confirmPassword');
                                            }
                                        }
                                    }
                                })}
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

                        {errors.password && (
                            <div className="mt-1 text-sm text-red-600">{errors.password.message}</div>
                        )}

                        {passwordValue && (
                            <div className="mt-2">
                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                    <span>Force du mot de passe:</span>
                                    <span>{passwordStrength.strength}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full ${passwordStrength.strength < 50 ? 'bg-red-500' :
                                            passwordStrength.color === 'green' ? 'bg-green-500' :
                                                passwordStrength.color === 'yellow' ? 'bg-yellow-500' : 'bg-orange-500'
                                            }`}
                                        style={{ width: `${passwordStrength.strength}%` }}
                                    ></div>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    Doit contenir: 8-20 caractères, majuscule, caractère spécial (@$!%*?&), au moin un chiffre
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
                                {...register('confirmPassword', {
                                    required: 'La confirmation du mot de passe est requise',
                                    validate: (value) =>
                                        value === passwordValue || 'Les mots de passe ne correspondent pas',
                                    onChange: (e) => {
                                        const value = e.target.value;
                                        if (value.length <= 20) {
                                            setValue('confirmPassword', value);
                                            trigger('confirmPassword');
                                        }
                                    }
                                })}
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

                        {errors.confirmPassword && (
                            <div className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</div>
                        )}

                        {confirmPasswordValue && !errors.confirmPassword && passwordValue === confirmPasswordValue && passwordValue.length >= 8 && (
                            <div className="mt-1 text-sm text-green-600">Les mots de passe correspondent.</div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isButtonDisabled || loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Traitement...
                            </>
                        ) : isSuccess ? (
                            'Réinitialisation réussie'
                        ) : (
                            'Réinitialiser'
                        )}
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