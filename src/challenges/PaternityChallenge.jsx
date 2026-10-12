import { Fragment, useState } from 'react';
import { Fingerprint } from 'lucide-react';
import SubmitAction from '../components/SubmitAction';

// Аллели по маркерам M1–M4: детёныш, мать и кандидаты в отцы
const MARKERS = ['M1', 'M2', 'M3', 'M4'];
const CUB = [
  [12, 15],
  [8, 9],
  [20, 22],
  [17, 19],
];
const MOTHER = [
  [12, 14],
  [8, 10],
  [20, 21],
  [16, 19],
];
const CANDIDATES = [
  {
    key: 'timofey',
    name: 'Тимофей',
    alleles: [
      [15, 16],
      [9, 11],
      [19, 22],
      [17, 18],
    ],
  },
  {
    key: 'pushok',
    name: 'Пушок',
    alleles: [
      [13, 15],
      [7, 9],
      [21, 23],
      [17, 20],
    ],
  },
  {
    key: 'grom',
    name: 'Гром',
    alleles: [
      [14, 16],
      [9, 9],
      [22, 22],
      [15, 17],
    ],
  },
  {
    key: 'veter',
    name: 'Ветер',
    alleles: [
      [15, 15],
      [10, 12],
      [20, 22],
      [17, 17],
    ],
  },
];

// Задание 5: найти отцовские аллели и отца.
// Ответ — отцовские аллели по маркерам и ключ самца: «15,9,22,17|timofey»
export default function PaternityChallenge({ solved, submit }) {
  const [picks, setPicks] = useState(() => MARKERS.map(() => null));
  const [father, setFather] = useState('');
  const isReady = picks.every((pick) => pick !== null) && father !== '';

  function pick(markerIndex, allele) {
    setPicks((items) => items.map((item, index) => (index === markerIndex ? allele : item)));
  }

  return (
    <div className="workbench">
      <h2>Генетические профили</h2>

      <div className="table-scroll">
        <table className="marker-table">
          <thead>
            <tr>
              <th>Маркер</th>
              <th>Детёныш: от отца?</th>
              <th>Аля</th>
              {CANDIDATES.map((candidate) => (
                <th key={candidate.key}>{candidate.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MARKERS.map((marker, markerIndex) => (
              <tr key={marker}>
                <th scope="row">{marker}</th>
                <td>
                  <div className="allele-picks">
                    {CUB[markerIndex].map((allele) => (
                      <button
                        key={allele}
                        className={`allele-button ${picks[markerIndex] === allele ? 'is-picked' : ''}`}
                        aria-pressed={picks[markerIndex] === allele}
                        onClick={() => pick(markerIndex, allele)}
                      >
                        {allele}
                      </button>
                    ))}
                  </div>
                </td>
                <td className="allele-cell">{MOTHER[markerIndex].join(', ')}</td>
                {CANDIDATES.map((candidate) => (
                  <td key={candidate.key} className="allele-cell">
                    {candidate.alleles[markerIndex].map((allele, index) => (
                      <Fragment key={index}>
                        {index > 0 && ', '}
                        <span className={picks[markerIndex] === allele ? 'is-match' : undefined}>{allele}</span>
                      </Fragment>
                    ))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="query-part">
        <span>Отец детёныша</span>
        <div className="choice-row" role="radiogroup">
          {CANDIDATES.map((candidate) => (
            <button
              key={candidate.key}
              className={`choice-chip ${father === candidate.key ? 'is-selected' : ''}`}
              role="radio"
              aria-checked={father === candidate.key}
              onClick={() => setFather(candidate.key)}
            >
              {candidate.name}
            </button>
          ))}
        </div>
      </div>

      <SubmitAction
        label="Подтвердить отцовство"
        icon={Fingerprint}
        answer={isReady ? `${picks.join(',')}|${father}` : null}
        solved={solved}
        {...submit}
      />
    </div>
  );
}
