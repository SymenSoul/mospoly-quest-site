import { ApiError, getTasks, registerParticipant, submitAttempt } from '../api/client';

// Ключ, под которым сессия хранится в localStorage
const STORAGE_KEY = 'zoo-quest-session';

// Ключ прежнего хранилища прогресса (useQuestProgress), переносится в сессию один раз
const LEGACY_PROGRESS_KEY = 'polytech-cyber-quest-progress';

// Версия формата: при несовместимых изменениях полей старые сессии сбрасываются
const SESSION_VERSION = 1;

// Поля сессии и их начальные значения
function createInitialState() {
  return {
    // Участник от POST /api/participants/: { id, firstName, lastName, token, startedAt }
    participant: null,
    // Задания от GET /api/tasks/, отсортированные по order: [{ id, title, taskType, points, order }]
    tasks: [],
    // new — участник не зарегистрирован, active — квест идёт, finished — квест завершён
    status: 'new',
    // Индекс текущего задания
    active: 0,
    // Ключи решённых заданий
    solved: [],
    // Число попыток по заданиям: { [ключ]: число }
    attempts: {},
    // Начисленные баллы по заданиям: { [ключ]: баллы }
    points: {},
    // Показывается ли брифинг текущего задания
    showBriefing: true,
    // Брифинги, текст которых уже напечатан
    readStories: [],
    // Когда и почему квест завершён: completed — пройден до конца, gave_up — участник сдался
    finishedAt: null,
    finishReason: null,
  };
}

// Сессия участника: хранит прогресс в localStorage, восстанавливает его и общается с бэкендом.
// Изменения публикуются подписчикам (см. useQuestSession), снимок состояния неизменяемый.
export class QuestSession {
  #state = createInitialState();
  #listeners = new Set();

  // Загружает сохранённую сессию или создаёт новую
  static load() {
    const session = new QuestSession();
    const stored = readStoredState();

    if (stored) {
      session.#state = stored;
      return session;
    }

    const migrated = readLegacyProgress();
    if (migrated) {
      // Сначала сохраняем под новым ключом, потом удаляем старый — чтобы прогресс не потерялся
      session.#state = migrated;
      session.save();
      removeLegacyProgress();
    }

    return session;
  }

  // Текущее состояние для React (useSyncExternalStore): новый объект после каждого изменения
  getSnapshot = () => this.#state;

  subscribe = (listener) => {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  };

  get state() {
    return this.#state;
  }

  get isRegistered() {
    return this.#state.participant !== null;
  }

  // Задание по ключу (task_type); если задания ещё не загружены — undefined
  getTask(taskKey) {
    return this.#state.tasks.find((task) => task.taskType === taskKey);
  }

  // Сохраняет состояние в localStorage; без localStorage сессия продолжает работать в памяти
  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: SESSION_VERSION, ...this.#state }));
    } catch {
      // приватный режим или переполненное хранилище
    }
  }

  // Удаляет сохранённую сессию и возвращает начальное состояние
  clear() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // нечего удалять
    }

    this.#replace(createInitialState(), { persist: false });
  }

  // Регистрирует участника на бэкенде и начинает новую сессию
  async register(firstName, lastName) {
    const response = await registerParticipant({ firstName: firstName.trim(), lastName: lastName.trim() });

    this.#replace({
      ...createInitialState(),
      status: 'active',
      participant: {
        id: response.participant_id,
        firstName: response.first_name,
        lastName: response.last_name,
        token: response.token,
        startedAt: response.started_at,
      },
    });
  }

  // Загружает активные задания участника
  async loadTasks() {
    this.#requireParticipant();
    const response = await getTasks(this.#state.participant.token);

    const tasks = (Array.isArray(response) ? response : [])
      .map((task) => ({
        id: task.id,
        title: task.title,
        taskType: task.task_type,
        points: task.points,
        order: task.order,
      }))
      .sort((a, b) => a.order - b.order);

    this.#update({ tasks });
    return tasks;
  }

  // Отправляет ответ на проверку. Возвращает { correct, pointsEarned, attemptsCount }
  async submitAnswer(taskKey, answer) {
    this.#requireParticipant();
    const task = this.getTask(taskKey);

    if (!task) {
      throw new ApiError(`Задание «${taskKey}» не найдено среди активных`, { status: 404 });
    }

    const response = await submitAttempt(this.#state.participant.token, task.id, answer);
    const result = {
      correct: Boolean(response.correct),
      pointsEarned: Number(response.points_earned) || 0,
      attemptsCount: Number(response.attempts_count) || 0,
    };

    const { attempts, points, solved } = this.#state;
    this.#update({
      attempts: { ...attempts, [taskKey]: result.attemptsCount },
      ...(result.correct && {
        solved: solved.includes(taskKey) ? solved : [...solved, taskKey],
        points: { ...points, [taskKey]: result.pointsEarned },
      }),
    });

    return result;
  }

  // Завершает квест: completed — все задания решены, gave_up — участник сдался.
  // Попытки уже сохранены на бэкенде при отправке ответов, поэтому в рейтинг результат попадает сразу.
  finish(reason) {
    if (this.#state.status === 'finished') return this.getSummary();

    this.#update({
      status: 'finished',
      finishReason: reason,
      finishedAt: new Date().toISOString(),
    });

    return this.getSummary();
  }

  // Итоги для экрана завершения; попытки считаются как в рейтинге — по решённым заданиям
  getSummary() {
    const { participant, tasks, solved, attempts, points, finishedAt, finishReason } = this.#state;
    const end = finishedAt ? Date.parse(finishedAt) : Date.now();
    const start = participant?.startedAt ? Date.parse(participant.startedAt) : end;

    return {
      firstName: participant?.firstName ?? '',
      lastName: participant?.lastName ?? '',
      score: solved.reduce((sum, key) => sum + (points[key] ?? 0), 0),
      solvedCount: solved.length,
      totalTasks: tasks.length,
      attemptsCount: solved.reduce((sum, key) => sum + (attempts[key] ?? 0), 0),
      durationSeconds: Math.max(0, Math.round((end - start) / 1000)),
      finishReason,
    };
  }

  // Состояние интерфейса квеста

  setActive(active) {
    this.#update({ active });
  }

  setShowBriefing(showBriefing) {
    this.#update({ showBriefing });
  }

  markStoryRead(storyKey) {
    const { readStories } = this.#state;
    if (!readStories.includes(storyKey)) {
      this.#update({ readStories: [...readStories, storyKey] });
    }
  }

  // Отмечает задание решённым без бэкенда — для заданий, которые проверяются в браузере
  markSolved(taskKey) {
    const { solved } = this.#state;
    if (!solved.includes(taskKey)) {
      this.#update({ solved: [...solved, taskKey] });
    }
  }

  // Сбрасывает прогресс прохождения, сохраняя участника и задания
  resetProgress() {
    const { participant, tasks, status } = this.#state;
    this.#replace({ ...createInitialState(), participant, tasks, status: status === 'finished' ? 'active' : status });
  }

  #requireParticipant() {
    if (!this.#state.participant) {
      throw new ApiError('Участник не зарегистрирован', { status: 401 });
    }
  }

  #update(patch) {
    this.#replace({ ...this.#state, ...patch });
  }

  #replace(state, { persist = true } = {}) {
    this.#state = state;
    if (persist) this.save();
    this.#listeners.forEach((listener) => listener());
  }
}

// Читает сессию из localStorage и восстанавливает только корректные значения
function readStoredState() {
  let saved;
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }

  if (!saved || saved.version !== SESSION_VERSION) return null;

  const initial = createInitialState();
  const participant = isValidParticipant(saved.participant) ? saved.participant : null;

  return {
    participant,
    tasks: Array.isArray(saved.tasks) ? saved.tasks.filter((task) => task && Number.isFinite(task.id)) : [],
    status: participant && ['active', 'finished'].includes(saved.status) ? saved.status : initial.status,
    active: Number.isInteger(saved.active) && saved.active >= 0 ? saved.active : initial.active,
    solved: isStringArray(saved.solved) ? saved.solved : initial.solved,
    attempts: isNumberMap(saved.attempts) ? saved.attempts : initial.attempts,
    points: isNumberMap(saved.points) ? saved.points : initial.points,
    showBriefing: typeof saved.showBriefing === 'boolean' ? saved.showBriefing : initial.showBriefing,
    readStories: isStringArray(saved.readStories) ? saved.readStories : initial.readStories,
    finishedAt: typeof saved.finishedAt === 'string' ? saved.finishedAt : null,
    finishReason: ['completed', 'gave_up'].includes(saved.finishReason) ? saved.finishReason : null,
  };
}

// Читает прогресс из прежнего ключа useQuestProgress
function readLegacyProgress() {
  try {
    const legacy = JSON.parse(localStorage.getItem(LEGACY_PROGRESS_KEY));
    if (!legacy) return null;

    const initial = createInitialState();

    return {
      ...initial,
      active: Number.isInteger(legacy.active) && legacy.active >= 0 ? legacy.active : initial.active,
      solved: isStringArray(legacy.solved) ? legacy.solved : initial.solved,
      showBriefing: typeof legacy.showBriefing === 'boolean' ? legacy.showBriefing : initial.showBriefing,
      readStories: isStringArray(legacy.readStories) ? legacy.readStories : initial.readStories,
    };
  } catch {
    return null;
  }
}

function removeLegacyProgress() {
  try {
    localStorage.removeItem(LEGACY_PROGRESS_KEY);
  } catch {
    // нечего удалять
  }
}

function isValidParticipant(value) {
  return Boolean(value && typeof value.token === 'string' && value.token && typeof value.firstName === 'string');
}

function isStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isNumberMap(value) {
  return Boolean(value) && typeof value === 'object' && Object.values(value).every(Number.isFinite);
}
