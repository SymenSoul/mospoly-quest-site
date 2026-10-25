import test from 'node:test';
import assert from 'node:assert/strict';
import { getUnlockedTasks, skipTaskState } from '../src/session/taskNavigation.js';
const tasks = ['a', 'b', 'c'].map((taskType) => ({taskType}));
const initial = () => ({status: 'active', tasks, solved: [], skipped: [], active: 0, points: {}});
test('пропуск открывает следующий шаг, не меняя решения и баллы', () => {
  const state = initial();
  const next = {...state, ...skipTaskState(state, 'a')};
  assert.deepEqual(next.solved, []);
  assert.deepEqual(next.points, {});
  assert.deepEqual(next.skipped, ['a']);
  assert.equal(next.active, 0);
  assert.equal(next.showBriefing, true);
  assert.deepEqual(getUnlockedTasks(tasks, next.solved, next.skipped), [true, true, false]);
  assert.deepEqual(state.skipped, []);
});
test('полный пропуск и восстановление сюжетного итога', () => {
  let state = initial();
  for (const task of tasks) state = {...state, ...skipTaskState(state, task.taskType)};
  state = JSON.parse(JSON.stringify(state));
  assert.deepEqual(getUnlockedTasks(tasks, state.solved, state.skipped), [true,true,true]);
  assert.equal(state.active, 2);
  assert.equal(state.showBriefing, true);
  assert.deepEqual(skipTaskState(state, 'a').skipped, ['a','b','c']);
});
test('нельзя пропустить закрытое, решённое или несуществующее задание', () => {
  assert.throws(() => skipTaskState(initial(), 'b'));
  assert.throws(() => skipTaskState(initial(), 'missing'));
  assert.throws(() => skipTaskState({...initial(), solved: ['a']}, 'a'));
  assert.throws(() => skipTaskState({...initial(), status: 'finished'}, 'a'));
  assert.deepEqual(getUnlockedTasks(tasks, [], undefined), [true,false,false]);
});
