import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import AsyncSubmitBtn from '../components/AsyncSubmitBtn';
import useToastFeedback from '../hooks/useToastFeedBack';

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
    <div className="min-h-screen flex items-center justify-center bg-login p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold text-green-800 mb-2">Mot de passe oublié</h1>
        <p className="text-gray-600 mb-6">Entrez votre adresse email pour recevoir un lien de réinitialisation.</p>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            id="email"
            type="email"
            {...register('email')}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none mb-1 ${errors.email ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-gray-600'}`}
            placeholder="vous@domaine.com"
          />
          {errors.email && (
            <p className="text-red-600 text-sm mb-3">{errors.email.message}</p>
          )}
          <AsyncSubmitBtn
            className="mt-4"
            fullWidth
            loading={status === 'loading'}
            loadingLabel="Envoi en cours..."
            label="Envoyer le lien"
          />
          {status === 'success' && (
            <p className="text-green-700 text-sm mt-3">Si un compte existe pour cet email, un lien a été envoyé.</p>
          )}
          {status === 'error' && (
            <p className="text-red-600 text-sm mt-3">Une erreur est survenue. Réessayez.</p>
          )}
        </form>
      </div>
    </div>
  );
}

export default ForgotPassword;


