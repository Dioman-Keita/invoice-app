import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import AsyncSubmitBtn from '../components/AsyncSubmitBtn';
import useToastFeedback from '../hooks/useToastFeedback';
import { Link } from 'react-router-dom';

const schema = z.object({
  email: z.string().min(1, 'Email requis').email('Email invalide'),
});

function ForgotPassword() {
  const [status, setStatus] = useState('idle');
  const { register, handleSubmit, formState: { errors, isValid } } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { email: '' },
  });
  const { success, error: notifyError } = useToastFeedback();

  const onSubmit = async (values) => {
    try {
      setStatus('loading');
      // TODO: call backend endpoint e.g., POST /auth/forgot-password with { email }
      await new Promise((r) => setTimeout(r, 1000));
      setStatus('success');
      success('Si un compte existe, un lien a été envoyé.');
    } catch {
      setStatus('error');
      notifyError("Une erreur est survenue lors de l'envoi du lien");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-verify p-4">
      <div className="w-full max-w-md bg-white rounded-md shadow p-6">
        <h1 className="text-xl font-semibold mb-1">Mot de passe oublié</h1>
        <p className="text-sm text-gray-600 mb-6">
          Entrez votre adresse email pour recevoir un lien de réinitialisation.
        </p>
        
        <form onSubmit={handleSubmit(onSubmit)} method='post'>
          <div className="mb-4">
            <label className="block text-sm mb-1">Adresse email</label>
            <input
              type="email"
              {...register('email')}
              className={`w-full border rounded px-3 py-2 outline-none focus:ring ${
                errors.email ? 'border-red-500 focus:ring-red-200' : 'focus:ring-blue-200'
              }`}
              placeholder="vous@domaine.com"
            />
            {errors.email && (
              <div className="mt-1 text-sm text-red-600">{errors.email.message}</div>
            )}
          </div>

          <AsyncSubmitBtn
            loading={status === 'loading'}
            loadingLabel="Envoi"
            label="Envoyer le lien"
            className="w-full"
          />

          {status === 'success' && (
            <div className="mt-4 text-sm text-green-600">
              Si un compte existe pour cet email, un lien a été envoyé.
            </div>
          )}
          {status === 'error' && (
            <div className="mt-4 text-sm text-red-600">
              Une erreur est survenue. Réessayez.
            </div>
          )}
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

export default ForgotPassword;