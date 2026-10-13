import { useState } from 'react';
import { Delete, Dna } from 'lucide-react';
import SubmitAction from '../components/SubmitAction';

const TOP_STRAND = ['A', 'T', 'G', 'C', 'C', 'G'];
const LETTERS = ['A', 'T', 'G', 'C'];
const PAIRS = { A: 'T', T: 'A', G: 'C', C: 'G' };

// Задание 2: достроить вторую цепь ДНК. Ответ — нижняя цепь, например «TACGGC»
export default function ComplementChallenge({ solved, submit }) {
  const [bottom, setBottom] = useState(() => TOP_STRAND.map(() => null));
  const cursor = bottom.indexOf(null);
  const isFilled = cursor === -1;

  function put(letter) {
    if (isFilled) return;
    setBottom((items) => items.map((item, index) => (index === cursor ? letter : item)));
  }

  function eraseLast() {
    const lastFilled = bottom.findLastIndex((item) => item !== null);
    if (lastFilled === -1) return;
    setBottom((items) => items.map((item, index) => (index === lastFilled ? null : item)));
  }

  function clearSlot(slotIndex) {
    setBottom((items) => items.map((item, index) => (index === slotIndex ? null : item)));
  }

  return (
    <div className="workbench">
      <h2>Восстановите вторую цепь</h2>

      <div className="strand-board" role="group" aria-label="Цепи ДНК">
        {TOP_STRAND.map((letter, index) => {
          const paired = bottom[index] !== null && PAIRS[letter] === bottom[index];

          return (
            <div key={index} className={`strand-pair ${paired ? 'is-paired' : ''}`}>
              <span className="nucleotide">{letter}</span>
              <span className="strand-bond" aria-hidden="true" />
              <button
                className={`nucleotide is-slot ${index === cursor ? 'is-cursor' : ''}`}
                onClick={() => clearSlot(index)}
                disabled={bottom[index] === null}
                aria-label={bottom[index] ? `Убрать букву ${bottom[index]}` : `Пустая ячейка ${index + 1}`}
              >
                {bottom[index] ?? '?'}
              </button>
            </div>
          );
        })}
      </div>

      <div className="letter-pad">
        {LETTERS.map((letter) => (
          <button key={letter} className="ghost-action" onClick={() => put(letter)} disabled={isFilled}>
            {letter}
          </button>
        ))}
        <button className="ghost-action" onClick={eraseLast} aria-label="Стереть последнюю букву">
          <Delete size={18} />
        </button>
      </div>

      <SubmitAction
        label="Записать цепь"
        icon={Dna}
        answer={isFilled ? bottom.join('') : null}
        solved={solved}
        {...submit}
      />
    </div>
  );
}
