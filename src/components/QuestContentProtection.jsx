import { useEffect, useRef } from 'react';

function isEditable(target) {
  return target instanceof Element
    && Boolean(target.closest('input, textarea, [contenteditable]:not([contenteditable="false"])'));
}

// Ограничения обычных действий браузера; системный снимок экрана JS остановить не может.
export default function QuestContentProtection({ participant, children }) {
  const rootRef = useRef(null);
  const name = `${participant.firstName} ${participant.lastName}`.trim();
  // Идентификатор участника допустим в подписи; токен авторизации здесь не используется.
  const label = `${name} · ${String(participant.id ?? '').slice(-6)}`;

  useEffect(() => {
    const root = rootRef.current;
    const blockContentAction = (event) => {
      if (!isEditable(event.target)) event.preventDefault();
    };
    const blockShortcut = (event) => {
      if (!event.ctrlKey && !event.metaKey) return;
      const key = event.code;
      if (key === 'KeyP') {
        event.preventDefault();
        return;
      }
      const inContent = root.contains(event.target)
        || event.target === document.body || event.target === document.documentElement;
      if (inContent && !isEditable(event.target) && ['KeyA', 'KeyC', 'KeyX'].includes(key)) {
        event.preventDefault();
      }
    };
    const actions = ['copy', 'cut', 'contextmenu', 'dragstart'];
    actions.forEach((type) => root.addEventListener(type, blockContentAction));
    window.addEventListener('keydown', blockShortcut, true);
    document.body.classList.add('quest-content-protected');
    return () => {
      actions.forEach((type) => root.removeEventListener(type, blockContentAction));
      window.removeEventListener('keydown', blockShortcut, true);
      document.body.classList.remove('quest-content-protected');
    };
  }, []);

  return (
    <div ref={rootRef} className="quest-content-protection">
      <div className="quest-watermarks" aria-hidden="true">
        {Array.from({ length: 12 }, (_, index) => <span key={index}>{label}</span>)}
      </div>
      {children}
    </div>
  );
}
