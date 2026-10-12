import { useState } from 'react';
import { LockKeyholeOpen } from 'lucide-react';
import SubmitAction from '../components/SubmitAction';

// Веса переключателей слева направо
const WEIGHTS = [32, 16, 8, 4, 2, 1];
const TARGET = 45;

// Задание 1: набрать номер вольера в двоичном коде. Ответ — строка битов, например «101101»
export default function BinaryChallenge({ solved, submit }) {
  const [bits, setBits] = useState(() => WEIGHTS.map(() => 0));
  const sum = bits.reduce((total, bit, index) => total + bit * WEIGHTS[index], 0);

  function toggle(index) {
    setBits((items) => items.map((bit, itemIndex) => (itemIndex === index ? 1 - bit : bit)));
  }

  return (
    <div className="workbench">
      <h2>Электронный замок вольера №{TARGET}</h2>

      <div className="bit-switches">
        {WEIGHTS.map((weight, index) => (
          <button
            key={weight}
            className={`bit-switch ${bits[index] ? 'is-on' : ''}`}
            aria-pressed={bits[index] === 1}
            aria-label={`Переключатель ${weight}`}
            onClick={() => toggle(index)}
          >
            <small>{weight}</small>
            <b>{bits[index]}</b>
          </button>
        ))}
      </div>

      <div className="terminal-output">
        <span>Код на замке: {bits.join('')}</span>
        <strong>
          {sum} <small>/ {TARGET}</small>
        </strong>
      </div>

      <SubmitAction label="Открыть замок" icon={LockKeyholeOpen} answer={bits.join('')} solved={solved} {...submit} />
    </div>
  );
}
