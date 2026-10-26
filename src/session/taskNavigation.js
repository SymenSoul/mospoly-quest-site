// Пропуск открывает сюжетный итог, но не считается решением.
export function getUnlockedTasks(tasks, solved, skipped = []) {
  let unlocked = true;
  return tasks.map((task) => {
    const current = unlocked;
    unlocked = unlocked && (solved.includes(task.taskType) || skipped.includes(task.taskType));
    return current;
  });
}

export function skipTaskState(state, taskKey) {
  const index = state.tasks.findIndex((task) => task.taskType === taskKey);
  if (state.status !== 'active' || index < 0) throw new Error('Задание недоступно.');
  if (!getUnlockedTasks(state.tasks, state.solved, state.skipped)[index]) {
    throw new Error('Сначала пройдите или пропустите предыдущее задание.');
  }
  if (state.solved.includes(taskKey)) throw new Error('Решённое задание нельзя пропустить.');
  return {
    skipped: [...new Set([...state.skipped, taskKey])],
    active: index,
    showBriefing: true,
  };
}
