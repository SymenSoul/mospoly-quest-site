// Мок бэкенда для разработки без сервера: данные хранятся в localStorage и общие для всех вкладок.
// Подключается только при VITE_API_MOCK=true, в обычную сборку не попадает.

import { ApiError } from './client.js';

const DB_KEY = 'zoo-quest-mock-db';

// Задержка ответа, чтобы были видны состояния загрузки
const LATENCY_MS = 250;

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
  };
}

function loadDb() {
  try {
    const saved = JSON.parse(localStorage.getItem(DB_KEY));
    if (saved && Array.isArray(saved.participants)) return saved;
  } catch {
    // повреждённые данные мока просто пересоздаём
  }

  const db = createDb();
  saveDb(db);
  return db;
}

function saveDb(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

// Считает рейтинг так же, как описано для бэкенда
function buildRanking(db) {
  return db.participants
    .map((participant) => {
      const demo = participant.demo;
      const finishedAt = participant.finished_at ? Date.parse(participant.finished_at) : null;

      return {
        first_name: participant.first_name,
        last_name: participant.last_name,
        score: demo?.score ?? 0,
        solved_tasks: demo?.solved ?? 0,
        attempts_count: demo?.attempts ?? 0,
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
    method: 'GET',
    pattern: /^\/ranking\/$/,
    handle: (db) => buildRanking(db),
  },
];

export async function mockRequest(path, { method = 'GET', signal } = {}) {
  await new Promise((resolve) => window.setTimeout(resolve, LATENCY_MS));

  if (signal?.aborted) {
    throw new DOMException('Запрос отменён', 'AbortError');
  }

  const route = routes.find((item) => item.method === method && item.pattern.test(path));
  if (!route) {
    throw new ApiError(`Мок: нет обработчика для ${method} ${path}`, { status: 404 });
  }

  const db = loadDb();
  return route.handle(db, path.match(route.pattern));
}
