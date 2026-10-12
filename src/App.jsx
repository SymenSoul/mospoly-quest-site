import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check, Globe2, Loader2, LogOut, Menu, PawPrint, RotateCcw, Trophy, X } from 'lucide-react';
import { useQuestSession } from './hooks/useQuestSession';
import { BLOCKS, QUEST_TASKS, SHIFT_START_LOG, personalize } from './quest/zooQuest';
import ChallengeFrame from './components/ChallengeFrame';
import ConfirmModal from './components/ConfirmModal';
import FinishScreen from './components/FinishScreen';
import RegistrationScreen from './components/RegistrationScreen';
import StoryInterlude from './components/StoryInterlude';
import { plural } from './utils/format';

const DEFAULT_ACCENT = { accent: '#29f0c8', accentRgb: '41, 240, 200' };

export default function App() {
  // Сессия участника хранится в localStorage (src/session/QuestSession.js)
  const { session, ...state } = useQuestSession();
  // Итоги завершённой смены: к этому моменту локальная сессия уже сброшена
  const [summary, setSummary] = useState(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    document.title = 'Код манула — квест Московского зоопарка';
  }, []);

  // Смену завершили, но страницу закрыли до сброса — показываем итоги и сбрасываем
  useEffect(() => {
    if (state.status === 'finished' && !summary) {
      setSummary(session.getSummary());
      session.clear();
    }
  }, [state.status, summary, session]);

  async function register(firstName, lastName) {
    await session.register(firstName, lastName);
    setNotice('');
    // Ошибку загрузки заданий покажет экран квеста с кнопкой повтора
    await session.loadTasks().catch(() => {});
  }

  // Любое завершение: попытки уже на бэкенде, показываем итоги и сбрасываем локальный прогресс
  function finish(reason) {
    setSummary(session.finish(reason));
    session.clear();
  }

  // Токен не принят сервером (например, базу очистили) — начинаем заново
  const handleSessionLost = useCallback(() => {
    session.clear();
    setNotice('Сессия не найдена на сервере. Начните смену заново.');
  }, [session]);

  if (summary) {
    return (
      <ScreenShell>
        <FinishScreen summary={summary} onRestart={() => setSummary(null)} />
      </ScreenShell>
    );
  }

  if (state.status !== 'active') {
    return (
      <ScreenShell>
        <RegistrationScreen notice={notice} onRegister={register} />
      </ScreenShell>
    );
  }

  return <QuestScreen state={state} session={session} onFinish={finish} onSessionLost={handleSessionLost} />;
}

function ScreenShell({ children }) {
  return (
    <main
      className="screen-shell"
      style={{ '--accent': DEFAULT_ACCENT.accent, '--accent-rgb': DEFAULT_ACCENT.accentRgb }}
    >
      <div className="scanlines" aria-hidden="true" />
      {children}
    </main>
  );
}

function QuestScreen({ state, session, onFinish, onSessionLost }) {
  const { participant, tasks, active, solved, points, showBriefing, readStories } = state;
  const [tasksStatus, setTasksStatus] = useState(() => ({ loading: tasks.length === 0, error: null }));
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [showFinishModal, setShowFinishModal] = useState(false);
  // На узких экранах навигация и журнал спрятаны в раскрывающейся панели
  const [railOpen, setRailOpen] = useState(false);

  // Задания с бэкенда, для которых есть интерфейс, в порядке order
  const questTasks = useMemo(
    () => tasks.filter((task) => QUEST_TASKS[task.taskType]).map((task) => ({ ...task, ...QUEST_TASKS[task.taskType] })),
    [tasks],
  );

  const loadTasks = useCallback(async () => {
    setTasksStatus({ loading: true, error: null });
    try {
      await session.loadTasks();
      setTasksStatus({ loading: false, error: null });
    } catch (error) {
      if (error.status === 401) {
        onSessionLost();
        return;
      }
      setTasksStatus({ loading: false, error });
    }
  }, [session, onSessionLost]);

  useEffect(() => {
    if (tasks.length === 0) loadTasks();
  }, [tasks.length, loadTasks]);

  const index = Math.min(active, Math.max(questTasks.length - 1, 0));
  const task = questTasks[index];

  // Сообщение о прошлой попытке не переносится на другое задание
  useEffect(() => {
    setFeedback(null);
  }, [task?.taskType, showBriefing]);

  const markStoryRead = useCallback((storyKey) => session.markStoryRead(storyKey), [session]);

  const solvedTasks = questTasks.filter((item) => solved.includes(item.taskType));
  const score = solvedTasks.reduce((sum, item) => sum + (points[item.taskType] ?? 0), 0);
  const progress = questTasks.length ? Math.round((solvedTasks.length / questTasks.length) * 100) : 0;
  const unlocked = questTasks.map((item, itemIndex) => itemIndex === 0 || solved.includes(questTasks[itemIndex - 1].taskType));
  const accent = task ?? DEFAULT_ACCENT;

  async function submitAnswer(answer) {
    setPending(true);
    setFeedback(null);

    try {
      const result = await session.submitAnswer(task.taskType, answer);

      if (result.correct) {
        // Показываем итог задания — продолжение сюжета
        session.setShowBriefing(true);
      } else {
        setFeedback({
          type: 'wrong',
          message: `Не сходится. Попытка ${result.attemptsCount} засчитана — проверьте решение и попробуйте ещё раз.`,
        });
      }
    } catch (error) {
      if (error.status === 401) {
        onSessionLost();
        return;
      }

      setFeedback({
        type: 'error',
        message:
          error.status === 0
            ? 'Не удалось связаться с сервером. Проверьте интернет и нажмите ещё раз — ответ не потеряется.'
            : `Не удалось проверить ответ: ${error.message}`,
      });
    } finally {
      setPending(false);
    }
  }

  function goNext() {
    if (index < questTasks.length - 1) {
      session.setActive(index + 1);
      session.setShowBriefing(true);
    }
  }

  function openTask(taskIndex) {
    session.setActive(taskIndex);
    session.setShowBriefing(true);
    setRailOpen(false);
  }

  return (
    <main className="app-shell" style={{ '--accent': accent.accent, '--accent-rgb': accent.accentRgb }}>
      <div className="scanlines" aria-hidden="true" />
      <aside className={`side-rail ${railOpen ? 'is-open' : ''}`}>
        <div className="rail-top">
          <div className="brand">
            <div className="brand-mark">
              <PawPrint size={23} />
            </div>
            <div>
              <p>Код манула</p>
              <span>Смена: {participant.firstName} {participant.lastName}</span>
            </div>
          </div>

          <button
            className="ghost-action rail-toggle"
            aria-expanded={railOpen}
            aria-controls="rail-details"
            aria-label={railOpen ? 'Скрыть меню' : 'Показать меню'}
            onClick={() => setRailOpen((open) => !open)}
          >
            <strong>{progress}%</strong>
            {railOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <div className="rail-progress" aria-hidden="true">
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="rail-details" id="rail-details">
          <div className="progress-block">
            <div className="progress-head">
              <span>Расследование</span>
              <strong>{progress}%</strong>
            </div>
            <div className="progress-track">
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>

          <nav className="mission-nav" aria-label="Задания квеста">
            {questTasks.map((item, itemIndex) => {
              const Icon = item.icon;
              const done = solved.includes(item.taskType);
              return (
                <button
                  key={item.taskType}
                  className={`nav-node ${index === itemIndex ? 'active' : ''} ${done ? 'done' : ''}`}
                  disabled={!unlocked[itemIndex]}
                  onClick={() => openTask(itemIndex)}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                  {done && <Check size={16} />}
                </button>
              );
            })}
          </nav>

          <div className="signal-panel">
            <div className="panel-title">
              <Globe2 size={16} />
              Журнал смены
            </div>
            <code>{personalize(SHIFT_START_LOG, participant.firstName)}</code>
            {solvedTasks.map((item) => (
              <code key={item.taskType}>{item.log}</code>
            ))}
          </div>

          <div className="rail-actions">
            <a className="ghost-action leaderboard-link" href="/leaderboard">
              <Trophy size={16} />
              Лидерборд
            </a>
            <button
              className="ghost-action"
              onClick={() => {
                setRailOpen(false);
                setShowFinishModal(true);
              }}
            >
              <LogOut size={16} />
              Завершить смену
            </button>
          </div>
        </div>
      </aside>

      {showFinishModal && (
        <ConfirmModal
          title="Завершить смену?"
          confirmLabel="Завершить"
          cancelLabel="Продолжить смену"
          onCancel={() => setShowFinishModal(false)}
          onConfirm={() => onFinish('gave_up')}
        >
          <p>
            Квест закончится, а ваш результат — {score} {plural(score, ['балл', 'балла', 'баллов'])}, решено{' '}
            {solvedTasks.length} из {questTasks.length} — попадёт в рейтинг. Продолжить с этого места потом не
            получится.
          </p>
        </ConfirmModal>
      )}

      <section className="stage">
        {!task ? (
          <TasksStatus status={tasksStatus} hasTasks={tasks.length > 0} onRetry={loadTasks} />
        ) : (
          <>
            <header className="stage-header">
              <div>
                <span className="eyebrow">
                  Блок {task.block + 1} / {BLOCKS.length} · {BLOCKS[task.block]} · Задание {index + 1} / {questTasks.length}
                </span>
                <h1>{task.title}</h1>
              </div>
              <div className="module-token">
                <task.icon size={24} />
                <span>{task.label}</span>
              </div>
            </header>

            {showBriefing ? (
              <QuestStory
                task={task}
                participant={participant}
                isSolved={solved.includes(task.taskType)}
                isFinal={index === questTasks.length - 1}
                earned={points[task.taskType]}
                readStories={readStories}
                onRead={markStoryRead}
                onStart={() => session.setShowBriefing(false)}
                onNext={goNext}
                onFinish={() => onFinish('completed')}
              />
            ) : (
              <ChallengeFrame task={task} solved={solved.includes(task.taskType)} onBrief={() => session.setShowBriefing(true)}>
                <task.component
                  key={task.taskType}
                  solved={solved.includes(task.taskType)}
                  submit={{ pending, feedback, onSubmit: submitAnswer }}
                />
              </ChallengeFrame>
            )}
          </>
        )}
      </section>
    </main>
  );
}

// Брифинг до задания или итог после решения
function QuestStory({ task, participant, isSolved, isFinal, earned, readStories, onRead, onStart, onNext, onFinish }) {
  const storyKey = `${task.taskType}-${isSolved ? 'outcome' : 'intro'}`;

  return (
    <>
      {isSolved && (
        <p className="reward-banner" role="status">
          <Check size={16} />
          Верно! +{earned ?? task.points} {plural(earned ?? task.points, ['балл', 'балла', 'баллов'])}
        </p>
      )}
      <StoryInterlude
        key={storyKey}
        storyKey={storyKey}
        text={personalize(isSolved ? task.outcome : task.intro, participant.firstName)}
        isSolved={isSolved}
        isFinal={isFinal}
        hasPlayed={readStories.includes(storyKey)}
        onRead={onRead}
        onStart={onStart}
        onNext={onNext}
        onFinish={onFinish}
      />
    </>
  );
}

// Загрузка заданий, ошибка загрузки или пустой список
function TasksStatus({ status, hasTasks, onRetry }) {
  if (status.loading) {
    return (
      <div className="stage-status">
        <Loader2 size={22} className="is-spinning" />
        Загружаем задания...
      </div>
    );
  }

  return (
    <div className="stage-status">
      <AlertTriangle size={22} />
      {status.error
        ? status.error.status === 0
          ? 'Не удалось загрузить задания: сервер не отвечает.'
          : `Не удалось загрузить задания: ${status.error.message}`
        : hasTasks
          ? 'Для активных заданий нет интерфейса. Обновите страницу без кэша: Ctrl+F5.'
          : 'Сейчас нет активных заданий. Обратитесь к организаторам.'}
      <button className="primary-action" onClick={onRetry}>
        <RotateCcw size={16} />
        Повторить
      </button>
    </div>
  );
}
