import { useState } from 'react';
import { ChevronRight, Puzzle, RotateCcw } from 'lucide-react';
import SubmitAction from '../components/SubmitAction';

// Фрагменты секвенатора в том порядке, в каком они показаны участнику
const FRAGMENTS = [
  { key: 'A', sequence: 'CCATGGCT' },
  { key: 'B', sequence: 'TAGAGTGA' },
  { key: 'C', sequence: 'ATGAACGT' },
  { key: 'D', sequence: 'GGCTAAGT' },
  { key: 'E', sequence: 'GGCTTAGA' },
  { key: 'F', sequence: 'ACGTCCAT' },
];
const OVERLAP = 4;
const CHAIN_LENGTH = 5;

const sequenceOf = (key) => FRAGMENTS.find((fragment) => fragment.key === key).sequence;

// Задание 7: собрать ген из перекрывающихся фрагментов, один фрагмент лишний.
// Ответ — ключи фрагментов по порядку: «C,F,A,E,B»
export default function AssemblyChallenge({ solved, submit }) {
  const [chain, setChain] = useState([]);
  const isComplete = chain.length === CHAIN_LENGTH;

  function add(key) {
    if (chain.includes(key) || isComplete) return;
    setChain([...chain, key]);
  }

  return (
    <div className="workbench">
      <h2>Фрагменты секвенатора</h2>

      <div className="fragment-pool">
        {FRAGMENTS.map((fragment) => {
          const position = chain.indexOf(fragment.key);

          return (
            <button
              key={fragment.key}
              className={`fragment-chip ${position >= 0 ? 'used' : ''}`}
              onClick={() => add(fragment.key)}
              disabled={position < 0 && isComplete}
            >
              {position >= 0 && <b className="pick-order">{position + 1}</b>}
              <span>{fragment.key}</span>
              <code>{fragment.sequence}</code>
            </button>
          );
        })}
      </div>

      <div className="chain-row">
        <div className="route-strip">
          {chain.length === 0 && <span className="muted">Выберите первый фрагмент</span>}
          {chain.map((key, index) => (
            <span key={key}>
              {key}
              {index < chain.length - 1 && <ChevronRight size={16} />}
            </span>
          ))}
        </div>
        <button className="ghost-action" onClick={() => setChain([])} disabled={chain.length === 0}>
          <RotateCcw size={16} />
          Сбросить
        </button>
      </div>

      {/* Выравнивание: каждый следующий фрагмент сдвинут на длину фрагмента минус перекрытие */}
      <div className="terminal-output">
        <span>Выравнивание фрагментов</span>
        <pre className="alignment">
          {chain.length === 0
            ? '—'
            : chain
                .map((key, index) => `${' '.repeat(index * (sequenceOf(key).length - OVERLAP))}${sequenceOf(key)}`)
                .join('\n')}
        </pre>
      </div>

      <SubmitAction
        label="Собрать паспорт"
        icon={Puzzle}
        answer={isComplete ? chain.join(',') : null}
        solved={solved}
        {...submit}
      />
    </div>
  );
}
