import { Loader2 } from 'lucide-react';

// Кнопка отправки ответа и сообщение о результате под ней.
// answer === null — ответ ещё не собран, кнопка неактивна
export default function SubmitAction({ label, icon: Icon, answer, solved, pending, feedback, onSubmit }) {
  return (
    <div className="submit-action">
      <button
        className="primary-action"
        disabled={answer === null || solved || pending}
        onClick={() => onSubmit(answer)}
      >
        {pending ? <Loader2 size={18} className="is-spinning" /> : Icon && <Icon size={18} />}
        {pending ? 'Проверяем...' : label}
      </button>

      {feedback && (
        <p className={`submit-feedback is-${feedback.type}`} role="status">
          {feedback.message}
        </p>
      )}
    </div>
  );
}
