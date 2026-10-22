import test from 'node:test';
import assert from 'node:assert/strict';
import { generateNickname, NICKNAME_COUNT } from '../src/utils/nickname.js';

test('ник совместим с двумя обязательными полями API и меняется при повторной генерации', () => {
  assert.ok(NICKNAME_COUNT >= 500);
  let previous;
  for (let i = 0; i < 2000; i += 1) {
    const nickname = generateNickname(previous);
    for (const value of Object.values(nickname)) {
      assert.match(value, /^[А-ЯЁ][а-яё]+$/u);
      assert.ok(value.length <= 50);
    }
    assert.notDeepEqual(nickname, previous);
    previous = nickname;
  }
});
