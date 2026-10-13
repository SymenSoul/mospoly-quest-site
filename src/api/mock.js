// Мок бэкенда для разработки без сервера: данные хранятся в localStorage и общие для всех вкладок.
// Повторяет контракт из документа «Backend (1)». Подключается только при VITE_API_MOCK=true,
// в обычную сборку не попадает — поэтому правильные ответы здесь допустимы.

import { ApiError } from './client.js';

const DB_KEY = 'zoo-quest-mock-db';

// Задержка ответа, чтобы были видны состояния загрузки
const LATENCY_MS = 250;

// Задания квеста «Код манула» — как в docs/zoo-quest/tasks.md
const TASKS = [
  { id: 1, title: 'Замок вольера', task_type: 'binary', points: 10, order: 1, correct_answer: '101101' },
  { id: 2, title: 'Вторая цепь', task_type: 'complement', points: 10, order: 2, correct_answer: 'TACGGC' },
  { id: 3, title: 'Генетический код', task_type: 'codon', points: 15, order: 3, correct_answer: 'TIGER' },
  { id: 4, title: 'Решётка Пеннета', task_type: 'probability', points: 15, order: 4, correct_answer: 'AA,Aa,Aa,aa|25' },
  { id: 5, title: 'Кто отец?', task_type: 'paternity', points: 15, order: 5, correct_answer: '15,9,22,17|timofey' },
  {
    id: 6,
    title: 'Поиск мутаций',
    task_type: 'mutation',
    points: 20,
    order: 6,
    correct_answer: 'range_len|neq|i_plus_1|diff|7,18,24',
  },
  { id: 7, title: 'Сборка генома', task_type: 'assembly', points: 20, order: 7, correct_answer: 'C,F,A,E,B' },
].map((task) => ({ ...task, is_active: true }));

// Демо-участники, чтобы рейтинг не был пустым
const DEMO_PARTICIPANTS = [
  { first_name: 'Иван', last_name: 'Иванов', score: 80, solved: 6, attempts: 8, seconds: 1240 },
  { first_name: 'Анна', last_name: 'Петрова', score: 75, solved: 6, attempts: 9, seconds: 1310 },
  { first_name: 'Мария', last_name: 'Соколова', score: 55, solved: 4, attempts: 7, seconds: 980 },
  { first_name: 'Артём', last_name: 'Кузнецов', score: 35, solved: 3, attempts: 6, seconds: 760 },
  { first_name: 'Полина', last_name: 'Морозова', score: 10, solved: 1, attempts: 3, seconds: 420 },
];

function createDb() {
  const now = Date.now();

  return {
    participants: DEMO_PARTICIPANTS.map((demo, index) => ({
      id: `demo-${index + 1}`,
      first_name: demo.first_name,
      last_name: demo.last_name,
      token: `demo-token-${index + 1}`,
      started_at: new Date(now - demo.seconds * 1000).toISOString(),
      finished_at: new Date(now).toISOString(),
      demo,
    })),
    attempts: [],
    task_results: [],
  };
}

function loadDb() {
  try {
    const saved = JSON.parse(localStorage.getItem(DB_KEY));
    if (saved && Array.isArray(saved.participants) && Array.isArray(saved.attempts)) return saved;
  } catch {
    // повреждённые данные мока просто пересоздаём
  }

  return createDb();
}

function saveDb(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

// crypto.randomUUID недоступен по http://IP (не «безопасный контекст»), поэтому id собираем сами
function randomId(length = 32) {
  const bytes = new Uint8Array(length / 2);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function requireParticipant(db, token) {
  const participant = db.participants.find((item) => item.token === token);
  if (!token || !participant) {
    throw new ApiError('Недопустимый токен.', { status: 401, data: { detail: 'Недопустимый токен.' } });
  }
  return participant;
}

function registerParticipant(db, body) {
  const firstName = String(body?.first_name ?? '').trim();
  const lastName = String(body?.last_name ?? '').trim();
  const errors = {};

  if (!firstName) errors.first_name = ['Обязательное поле.'];
  if (!lastName) errors.last_name = ['Обязательное поле.'];
  if (firstName.length > 50) errors.first_name = ['Не более 50 символов.'];
  if (lastName.length > 50) errors.last_name = ['Не более 50 символов.'];

  if (Object.keys(errors).length > 0) {
    throw new ApiError('Проверьте имя и фамилию', { status: 400, data: errors });
  }

  const participant = {
    id: `${randomId(8)}-${randomId(4)}-${randomId(4)}-${randomId(4)}-${randomId(12)}`,
    first_name: firstName,
    last_name: lastName,
    token: randomId(40),
    started_at: new Date().toISOString(),
    finished_at: null,
  };
  db.participants.push(participant);

  return {
    participant_id: participant.id,
    first_name: participant.first_name,
    last_name: participant.last_name,
    token: participant.token,
    started_at: participant.started_at,
  };
}

// Правильный ответ наружу не отдаётся
function listTasks() {
  return TASKS.filter((task) => task.is_active).map((task) => ({
    id: task.id,
    title: task.title,
    task_type: task.task_type,
    points: task.points,
    order: task.order,
  }));
}

function submitAttempt(db, participant, taskId, body) {
  const task = TASKS.find((item) => item.id === taskId && item.is_active);
  if (!task) {
    throw new ApiError('Страница не найдена.', { status: 404, data: { detail: 'Страница не найдена.' } });
  }

  const answer = String(body?.answer ?? '');
  const result = db.task_results.find((item) => item.participant_id === participant.id && item.task_id === task.id);

  // Задание уже решено: повторно баллы не начисляются
  if (result) {
    return { correct: answer === task.correct_answer, points_earned: 0, attempts_count: result.attempts_count };
  }

  const attemptNumber = db.attempts.filter(
    (item) => item.participant_id === participant.id && item.task_id === task.id,
  ).length + 1;
  const isCorrect = answer === task.correct_answer;
  const now = new Date().toISOString();

  db.attempts.push({
    participant_id: participant.id,
    task_id: task.id,
    answer,
    is_correct: isCorrect,
    attempt_number: attemptNumber,
    created_at: now,
  });

  if (isCorrect) {
    db.task_results.push({
      participant_id: participant.id,
      task_id: task.id,
      points_earned: task.points,
      attempts_count: attemptNumber,
      completed_at: now,
    });

    // finished_at фиксируется после успешного выполнения последнего активного задания
    const solvedCount = db.task_results.filter((item) => item.participant_id === participant.id).length;
    if (solvedCount === TASKS.filter((item) => item.is_active).length) {
      participant.finished_at = now;
    }
  }

  return {
    correct: isCorrect,
    points_earned: isCorrect ? task.points : 0,
    attempts_count: attemptNumber,
  };
}

// Считает рейтинг так же, как описано для бэкенда
function buildRanking(db) {
  return db.participants
    .map((participant) => {
      const results = db.task_results.filter((item) => item.participant_id === participant.id);
      const demo = participant.demo;
      const finishedAt = participant.finished_at ? Date.parse(participant.finished_at) : null;

      return {
        first_name: participant.first_name,
        last_name: participant.last_name,
        score: demo?.score ?? results.reduce((sum, item) => sum + item.points_earned, 0),
        solved_tasks: demo?.solved ?? results.length,
        attempts_count: demo?.attempts ?? results.reduce((sum, item) => sum + item.attempts_count, 0),
        time_seconds: finishedAt ? Math.round((finishedAt - Date.parse(participant.started_at)) / 1000) : null,
      };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.solved_tasks - a.solved_tasks ||
        a.attempts_count - b.attempts_count ||
        (a.time_seconds ?? Infinity) - (b.time_seconds ?? Infinity),
    )
    .map((row, index) => ({ place: index + 1, ...row }));
}

const routes = [
  {
    method: 'POST',
    pattern: /^\/participants\/$/,
    handle: ({ db, body }) => registerParticipant(db, body),
  },
  {
    method: 'GET',
    pattern: /^\/tasks\/$/,
    handle: ({ db, token }) => {
      requireParticipant(db, token);
      return listTasks();
    },
  },
  {
    method: 'POST',
    pattern: /^\/tasks\/(\d+)\/attempts\/$/,
    handle: ({ db, token, body, match }) => submitAttempt(db, requireParticipant(db, token), Number(match[1]), body),
  },
  {
    method: 'GET',
    pattern: /^\/ranking\/$/,
    handle: ({ db }) => buildRanking(db),
  },
];

export async function mockRequest(path, { method = 'GET', token, body, signal } = {}) {
  await new Promise((resolve) => window.setTimeout(resolve, LATENCY_MS));

  if (signal?.aborted) {
    throw new DOMException('Запрос отменён', 'AbortError');
  }

  const route = routes.find((item) => item.method === method && item.pattern.test(path));
  if (!route) {
    throw new ApiError(`Мок: нет обработчика для ${method} ${path}`, { status: 404 });
  }

  const db = loadDb();
  const result = route.handle({ db, token, body, match: path.match(route.pattern) });
  saveDb(db);

  // Возвращаем копию, как если бы данные пришли по сети
  return JSON.parse(JSON.stringify(result));
}
