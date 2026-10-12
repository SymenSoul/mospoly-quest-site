import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

// Подсказки открываются по одной
export default function HintPanel({ hints }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const canReveal = visibleCount < hints.length;

  return (
    <aside className="hint-dock" aria-label="Подсказки">
      <button
        className="hint-trigger"
        disabled={!canReveal}
        onClick={() => setVisibleCount((count) => Math.min(count + 1, hints.length))}
      >
        <AlertTriangle size={16} />
        {canReveal ? `Подсказка ${visibleCount}/${hints.length}` : 'Все подсказки открыты'}
      </button>
      {visibleCount > 0 && (
        <div className="hint-stack">
          {hints.slice(0, visibleCount).map((hint, index) => (
            <p key={hint}>
              <strong>{index + 1}</strong>
              {hint}
            </p>
          ))}
        </div>
      )}
    </aside>
  );
}
