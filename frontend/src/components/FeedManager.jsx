import { useState } from 'react';
import Modal from './Modal.jsx';
import { useDashboard } from '../context/DashboardContext.jsx';

const EMPTY = { title: '', url: '', category: 'general' };

// Gestion des abonnements RSS : ajouter, modifier, activer/désactiver, supprimer
export default function FeedManager({ onClose }) {
  const { feeds, categories, addFeed, updateFeed, removeFeed, categoryLabel } = useDashboard();
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const run = async (fn) => {
    setBusy(true); setError('');
    try { await fn(); } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  const submit = (e) => {
    e.preventDefault();
    run(async () => {
      if (editingId) await updateFeed(editingId, form); else await addFeed(form);
      setForm(EMPTY); setEditingId(null);
    });
  };

  const startEdit = (f) => { setEditingId(f.id); setForm({ title: f.title, url: f.url, category: f.category }); setError(''); };
  const cancelEdit = () => { setEditingId(null); setForm(EMPTY); setError(''); };

  return (
    <Modal title="Mes sources" onClose={onClose}>
      <form onSubmit={submit} className="mb-6 space-y-3 rounded-lg bg-paper p-4">
        <h3 className="text-sm font-semibold">{editingId ? 'Modifier la source' : 'Ajouter une source'}</h3>
        <input className="input" required maxLength={80} placeholder="Nom (ex. Le Monde Tech)" value={form.title} onChange={set('title')} aria-label="Nom de la source" />
        <input className="input" required type="url" placeholder="https://exemple.com/rss.xml" value={form.url} onChange={set('url')} aria-label="Adresse du flux RSS" />
        <div className="flex gap-2">
          <select className="input" value={form.category} onChange={set('category')} aria-label="Catégorie">
            {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <button className="btn-primary shrink-0" disabled={busy}>
            {busy ? 'Vérification…' : editingId ? 'Enregistrer' : 'Ajouter'}
          </button>
          {editingId && <button type="button" className="btn-ghost" onClick={cancelEdit}>Annuler</button>}
        </div>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      </form>

      {feeds.length === 0 && <p className="text-sm text-muted">Aucune source. Ajoutez l’adresse d’un flux RSS pour recevoir des articles.</p>}
      <ul className="divide-y divide-line">
        {feeds.map((f) => (
          <li key={f.id} className="flex items-center gap-3 py-3">
            <input type="checkbox" checked={f.enabled} className="size-4 accent-cobalt" aria-label={`Activer ${f.title}`}
                   onChange={(e) => run(() => updateFeed(f.id, { enabled: e.target.checked }))} />
            <div className="min-w-0 flex-1">
              <p className={`truncate text-sm font-medium ${f.enabled ? '' : 'text-muted line-through'}`}>{f.title}</p>
              <p className="truncate text-xs text-muted">{categoryLabel(f.category)} · {f.url}</p>
            </div>
            <button className="text-sm text-cobalt hover:underline" onClick={() => startEdit(f)}>Modifier</button>
            <button className="text-sm text-red-700 hover:underline"
                    onClick={() => window.confirm(`Supprimer « ${f.title} » ?`) && run(() => removeFeed(f.id))}>
              Supprimer
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
