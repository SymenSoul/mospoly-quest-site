import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

// Окно подтверждения: закрывается по клику на фон и по Escape
export default function ConfirmModal({ title, children, confirmLabel, cancelLabel, onConfirm, onCancel }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onCancel();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <div
      className="reset-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div className="challenge-frame reset-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <div className="panel-title">
          <AlertTriangle size={16} />
          Подтверждение
        </div>

        <h2 id="confirm-title">{title}</h2>
        {children}

        <div className="action-row">
          <button className="ghost-action" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className="primary-action" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
