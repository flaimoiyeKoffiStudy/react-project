import { useState } from 'react';
import Modal from './Modal.jsx';
import { useDashboard } from '../context/DashboardContext.jsx';

// Personnalisation : catégories suivies + mots-clés favoris (utilisés pour le tri "Pour vous")
export default function PreferencesPanel({ onClose }) {
  const { categories, preferences, savePreferences } = useDashboard();
  const [selected, setSelected] = useState(preferences.categories);
  const [keywords, setKeywords] = useState(preferences.keywords);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const addKeyword = () => {
    const k = draft.trim().toLowerCase().slice(0, 30);
    if (k && !keywords.includes(k) && keywords.length < 30) setKeywords([...keywords, k]);
    setDraft('');
  };

  const submit = async () => {
    setSaving(true); setError('');
    try { await savePreferences({ categories: selected, keywords }); onClose(); }
    catch (e) { setError(e.message); setSaving(false); }
  };

  return (
    <Modal title="Mes centres d’intérêt" onClose={onClose}>
      <fieldset className="mb-6">
        <legend className="mb-2 text-sm font-semibold">Catégories à suivre</legend>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button key={c.id} type="button" aria-pressed={selected.includes(c.id)} onClick={() => toggle(c.id)}
                    className={`rounded-full border px-3 py-1.5 text-sm ${selected.includes(c.id) ? 'border-cobalt bg-cobalt text-white' : 'border-line bg-white hover:bg-paper'}`}>
              {c.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mb-6">
        <label htmlFor="kw" className="mb-2 block text-sm font-semibold">Mots-clés favoris</label>
        <p className="mb-2 text-sm text-muted">Les articles qui contiennent ces mots remontent en premier.</p>
        <div className="flex gap-2">
          <input id="kw" className="input" value={draft} maxLength={30} placeholder="ex. intelligence artificielle"
                 onChange={(e) => setDraft(e.target.value)}
                 onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addKeyword(); } }} />
          <button type="button" className="btn-ghost" onClick={addKeyword}>Ajouter</button>
        </div>
        <ul className="mt-3 flex flex-wrap gap-2">
          {keywords.map((k) => (
            <li key={k} className="flex items-center gap-1 rounded-full bg-cobalt-soft py-1 pl-3 pr-1 text-sm text-cobalt-dark">
              {k}
              <button aria-label={`Retirer ${k}`} onClick={() => setKeywords(keywords.filter((x) => x !== k))}
                      className="rounded-full px-1.5 hover:bg-white">×</button>
            </li>
          ))}
        </ul>
      </div>

      {error && <p role="alert" className="mb-3 text-sm text-red-700">{error}</p>}
      <div className="flex justify-end gap-2">
        <button className="btn-ghost" onClick={onClose}>Annuler</button>
        <button className="btn-primary" onClick={submit} disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
      </div>
    </Modal>
  );
}
