import { useState } from 'react';
import { Languages } from 'lucide-react';
import SubmitAction from '../components/SubmitAction';

const RNA = 'AUGACUAUUGGUGAACGUUAA';

// Сокращённая таблица кодонов, есть и лишние строки
const CODON_TABLE = [
  ['AUG', 'старт'],
  ['ACU', 'T'],
  ['ACA', 'T'],
  ['AUU', 'I'],
  ['GGU', 'G'],
  ['GGA', 'G'],
  ['GAA', 'E'],
  ['GAU', 'D'],
  ['CGU', 'R'],
  ['CAU', 'H'],
  ['UUA', 'L'],
  ['UAA, UGA', 'стоп'],
];

// Задание 3: расшифровать слово по таблице кодонов. Ответ — слово латиницей, например «TIGER»
export default function CodonChallenge({ solved, submit }) {
  const [word, setWord] = useState('');
  const normalized = word.toUpperCase().replace(/[^A-Z]/g, '');

  return (
    <div className="workbench">
      <h2>Расшифруйте метку пробирки</h2>

      <div className="terminal-output">
        <span>РНК метки</span>
        <strong className="sequence-text">{RNA}</strong>
      </div>

      <div className="codon-table" role="table" aria-label="Таблица кодонов">
        {CODON_TABLE.map(([codon, letter]) => (
          <div key={codon} role="row">
            <code role="cell">{codon}</code>
            <b role="cell">{letter}</b>
          </div>
        ))}
      </div>

      <label className="query-part">
        <span>Слово-метка</span>
        <input
          className="answer-input"
          value={word}
          onChange={(event) => setWord(event.target.value)}
          placeholder="Например, CAT"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck="false"
        />
      </label>

      <SubmitAction
        label="Расшифровать"
        icon={Languages}
        answer={normalized ? normalized : null}
        solved={solved}
        {...submit}
      />
    </div>
  );
}
