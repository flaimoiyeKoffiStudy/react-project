import { useEffect } from 'react';

// Fenêtre modale accessible : fermeture par Échap ou clic sur le fond
export default function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 sm:p-10" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.stopPropagation()}
           className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-serif text-2xl">{title}</h2>
          <button onClick={onClose} aria-label="Fermer" className="rounded-md px-2 py-1 text-xl text-muted hover:bg-paper">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
