// Все существительные мужского рода, чтобы сочетания согласовывались.
const ADJECTIVES = [
  'Неопознанный', 'Загадочный', 'Любопытный', 'Отважный', 'Находчивый', 'Зоркий',
  'Ловкий', 'Смелый', 'Быстрый', 'Мудрый', 'Весёлый', 'Добрый',
  'Тихий', 'Яркий', 'Звёздный', 'Космический', 'Солнечный', 'Лунный',
  'Снежный', 'Лесной', 'Степной', 'Удачливый', 'Дружелюбный', 'Неуловимый',
];
const ANIMALS = [
  'Верблюд', 'Манул', 'Тигр', 'Лев', 'Барс', 'Волк',
  'Лис', 'Енот', 'Бобр', 'Барсук', 'Ёж', 'Заяц',
  'Медведь', 'Пингвин', 'Пеликан', 'Фламинго', 'Сокол', 'Филин',
  'Олень', 'Лось', 'Бизон', 'Як', 'Лемур', 'Капуцин',
];

export const NICKNAME_COUNT = ADJECTIVES.length * ANIMALS.length;

// Ник — публичная подпись, а не идентификатор или секрет. Уникальность не обещается.
export function generateNickname(previous) {
  const bytes = new Uint32Array(1);
  const random = globalThis.crypto?.getRandomValues
    ? globalThis.crypto.getRandomValues(bytes)[0] / 2 ** 32
    : Math.random();
  let index = Math.floor(random * NICKNAME_COUNT);
  const previousIndex = ADJECTIVES.indexOf(previous?.firstName) * ANIMALS.length
    + ANIMALS.indexOf(previous?.lastName);
  if (index === previousIndex) index = (index + 1) % NICKNAME_COUNT;
  return {
    firstName: ADJECTIVES[Math.floor(index / ANIMALS.length)],
    lastName: ANIMALS[index % ANIMALS.length],
  };
}
