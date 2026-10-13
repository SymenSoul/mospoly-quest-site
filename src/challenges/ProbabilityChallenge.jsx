import { useState } from 'react';
import { Grid2x2 } from 'lucide-react';

import SubmitAction from '../components/SubmitAction';

const GAMETES = ['A', 'a'];
const GENOTYPES = ['AA', 'Aa', 'aa'];
const PROBABILITIES = ['0', '25', '50', '75', '100'];

// Задание 4: решётка Пеннета для Aa × Aa.
// Ответ — клетки слева направо, сверху вниз, и вероятность: «AA,Aa,Aa,aa|25»
export default function ProbabilityChallenge({ solved, submit }) {
  const [cells, setCells] = useState(['', '', '', '']);
  const [probability, setProbability] = useState('');
  const isReady = cells.every(Boolean) && probability !== '';

  function setCell(index, value) {
    setCells((items) => items.map((item, itemIndex) => (itemIndex === index ? value : item)));
  }

  return (
    <div className="workbench">
      <h2>Мать Aa × отец Aa</h2>

      <div className="punnett" role="table" aria-label="Решётка Пеннета">
        <div className="punnett-corner" role="columnheader">
          <small>мать ↓ · отец →</small>
        </div>
        {GAMETES.map((gamete) => (
          <div key={`col-${gamete}`} className="punnett-head" role="columnheader">
            {gamete}
          </div>
        ))}

        {GAMETES.map((rowGamete, rowIndex) => [
          <div key={`row-${rowGamete}`} className="punnett-head" role="rowheader">
            {rowGamete}
          </div>,
          ...GAMETES.map((colGamete, colIndex) => {
            const index = rowIndex * 2 + colIndex;
            const value = cells[index];

            return (
              <label key={`${rowGamete}${colGamete}`} className="punnett-cell" role="cell">
                <select
                  value={value}
                  onChange={(event) => setCell(index, event.target.value)}
                  aria-label={`Клетка: мать ${rowGamete}, отец ${colGamete}`}
                >
                  <option value="" disabled>
                    ?
                  </option>
                  {GENOTYPES.map((genotype) => (
                    <option key={genotype} value={genotype}>
                      {genotype}
                    </option>
                  ))}
                </select>
                {value && (
                  <span className={`coat-chip ${value === 'aa' ? 'is-light' : 'is-dark'}`}>
                    {value === 'aa' ? 'светлый' : 'тёмный'}
                  </span>
                )}
              </label>
            );
          }),
        ])}
      </div>

      <div className="query-part">
        <span>Вероятность светлого детёныша (aa)</span>
        <div className="choice-row" role="radiogroup">
          {PROBABILITIES.map((value) => (
            <button
              key={value}
              className={`choice-chip ${probability === value ? 'is-selected' : ''}`}
              role="radio"
              aria-checked={probability === value}
              onClick={() => setProbability(value)}
            >
              {value}%
            </button>
          ))}
        </div>
      </div>

      <SubmitAction
        label="Подтвердить расчёт"
        icon={Grid2x2}
        answer={isReady ? `${cells.join(',')}|${probability}` : null}
        solved={solved}
        {...submit}
      />
    </div>
  );
}
