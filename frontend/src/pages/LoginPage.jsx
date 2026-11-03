import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { authenticate } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try { await authenticate(mode, email, password); }
    catch (err) { setError(err.message); setBusy(false); }
  };

  return (
    <main className="mx-auto grid min-h-screen max-w-5xl items-center gap-12 p-6 md:grid-cols-2">
      <div>
        <h1 className="font-serif text-5xl font-semibold leading-tight">Ma Revue</h1>
        <p className="mt-4 max-w-sm text-lg text-muted">
          Vos sources, vos sujets, vos mots-clés. Une seule page pour lire ce qui compte pour vous.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4 rounded-xl border border-line bg-white p-7">
        <h2 className="font-serif text-2xl">{mode === 'login' ? 'Se connecter' : 'Créer un compte'}</h2>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">Adresse e-mail</label>
          <input id="email" type="email" required autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label htmlFor="pwd" className="mb-1 block text-sm font-medium">Mot de passe (8 caractères minimum)</label>
          <input id="pwd" type="password" required minLength={8} maxLength={72} className="input"
                 autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                 value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? 'Un instant…' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
        </button>
        <button type="button" className="w-full text-sm text-cobalt hover:underline"
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
          {mode === 'login' ? 'Pas encore de compte ? Inscrivez-vous' : 'Déjà inscrit ? Connectez-vous'}
        </button>
      </form>
    </main>
  );
}
