import { useState } from 'react';
import { Loader2, PawPrint, Trophy } from 'lucide-react';

const MAX_NAME_LENGTH = 50;

// Экран входа: имя и фамилия нужны для рейтинга
export default function RegistrationScreen({ notice, onRegister }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const first = firstName.trim();
    const last = lastName.trim();

    if (!first || !last) {
      setError('Введите имя и фамилию');
      return;
    }

    if (first.length > MAX_NAME_LENGTH || last.length > MAX_NAME_LENGTH) {
      setError(`Не длиннее ${MAX_NAME_LENGTH} символов`);
      return;
    }

    setError('');
    setPending(true);

    try {
      await onRegister(first, last);
    } catch (err) {
      setError(
        err.status === 0
          ? 'Не удалось начать смену: сервер не отвечает. Попробуйте ещё раз'
          : `Не удалось начать смену: ${err.message}`,
      );
      setPending(false);
    }
  }

  return (
    <div className="welcome-screen">
      <div className="welcome-card">
        <div className="welcome-brand">
          <div className="brand-mark">
            <PawPrint size={26} />
          </div>
          <span className="eyebrow">Московский зоопарк · лаборатория генетики</span>
        </div>

        <h1>Код манула</h1>
        <p className="welcome-lead">Ночная смена в лаборатории генетики Московского зоопарка.</p>
        <p>
          У манула родился детёныш, а база ДНК-паспортов дала сбой. Помогите восстановить данные до утра.
        </p>

        {notice && <p className="welcome-notice">{notice}</p>}

        <form className="welcome-form" onSubmit={handleSubmit} noValidate>
          <label className="query-part">
            <span>Имя</span>
            <input
              className="answer-input"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              autoComplete="given-name"
              maxLength={MAX_NAME_LENGTH + 10}
            />
          </label>
          <label className="query-part">
            <span>Фамилия</span>
            <input
              className="answer-input"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              autoComplete="family-name"
              maxLength={MAX_NAME_LENGTH + 10}
            />
          </label>
          <small>Так вас увидят в рейтинге</small>

          {error && (
            <p className="submit-feedback is-error" role="alert">
              {error}
            </p>
          )}

          <button className="primary-action" type="submit" disabled={pending}>
            {pending && <Loader2 size={18} className="is-spinning" />}
            {pending ? 'Начинаем смену...' : 'Заступить на смену'}
          </button>
        </form>

        <div className="welcome-footer">
          <span>20–30 минут · 7 заданий · завершить можно в любой момент</span>
          <a href="/leaderboard">
            <Trophy size={15} />
            Посмотреть лидерборд
          </a>
        </div>
      </div>
    </div>
  );
}
