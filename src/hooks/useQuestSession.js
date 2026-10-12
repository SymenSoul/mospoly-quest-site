import { useSyncExternalStore } from 'react';
import { QuestSession } from '../session/QuestSession';

// Одна сессия на вкладку: загружается из localStorage при старте приложения
export const questSession = QuestSession.load();

// Подписывает компонент на сессию: возвращает текущее состояние и саму сессию для вызова методов
export function useQuestSession() {
  const state = useSyncExternalStore(questSession.subscribe, questSession.getSnapshot);
  return { ...state, session: questSession };
}
