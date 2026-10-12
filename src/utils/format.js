// 1240 → «20:40», 3725 → «1:02:05»; пока участник не закончил, бэкенд может не вернуть время
export function formatDuration(totalSeconds) {
  if (!Number.isFinite(totalSeconds)) return '—';

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const pad = (value) => String(value).padStart(2, '0');

  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

// Склоняет слово по числу: plural(3, ['балл', 'балла', 'баллов']) → «балла»
export function plural(count, [one, few, many]) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}
