import { useMemo, useState } from 'react';
import { Code2 } from 'lucide-react';
import QuerySelect from '../components/QuerySelect';
import SubmitAction from '../components/SubmitAction';

const REF = 'ATGGCTTACGAGCTAGGCATCCTG';
const CUB = 'ATGGCTAACGAGCTAGGTATCCTA';

// Варианты для пропусков в коде: ключ уходит в ответ, текст показывается в программе
const LOOP_OPTIONS = [
  { value: 'range_len_minus_1', label: 'range(len(ref) - 1)' },
  { value: 'ref', label: 'ref' },
  { value: 'range_len', label: 'range(len(ref))' },
  { value: 'range_1_len_plus_1', label: 'range(1, len(ref) + 1)' },
];
const CONDITION_OPTIONS = [
  { value: 'eq', label: 'ref[i] == cub[i]' },
  { value: 'in', label: 'ref[i] in cub' },
  { value: 'neq', label: 'ref[i] != cub[i]' },
  { value: 'whole', label: 'ref != cub' },
];
const APPEND_OPTIONS = [
  { value: 'i', label: 'i' },
  { value: 'ref_i', label: 'ref[i]' },
  { value: 'cub_i', label: 'cub[i]' },
  { value: 'i_plus_1', label: 'i + 1' },
];
const PRINT_OPTIONS = [
  { value: 'len_diff', label: 'len(diff)' },
  { value: 'diff', label: 'diff' },
  { value: 'ref', label: 'ref' },
  { value: 'i', label: 'i' },
];

const labelOf = (options, value) => options.find((option) => option.value === value)?.label ?? '____';

// Задание 6: восстановить программу поиска мутаций и вписать позиции.
// Ответ — ключи четырёх пропусков и позиции: «range_len|neq|i_plus_1|diff|7,18,24»
export default function MutationChallenge({ solved, submit }) {
  const [code, setCode] = useState({ loop: '', condition: '', append: '', print: '' });
  const [positionsInput, setPositionsInput] = useState('');
  const isCodeReady = Object.values(code).every(Boolean);
  const output = useMemo(() => (isCodeReady ? runProgram(code) : null), [code, isCodeReady]);
  const positions = normalizePositions(positionsInput);

  function choose(part, value) {
    setCode((current) => ({ ...current, [part]: value }));
  }

  return (
    <div className="workbench">
      <h2>Восстановите программу Веры</h2>

      <pre className="code-window">{`ref = "${REF}"  # эталон
cub = "${CUB}"  # детёныш

diff = []
for i in ${labelOf(LOOP_OPTIONS, code.loop)}:
    if ${labelOf(CONDITION_OPTIONS, code.condition)}:
        diff.append(${labelOf(APPEND_OPTIONS, code.append)})
print(${labelOf(PRINT_OPTIONS, code.print)})`}</pre>

      <div className="control-grid">
        <QuerySelect
          label="Какие позиции перебрать"
          value={code.loop}
          options={LOOP_OPTIONS}
          onChange={(value) => choose('loop', value)}
          placeholder="Выберите"
        />
        <QuerySelect
          label="Когда это мутация"
          value={code.condition}
          options={CONDITION_OPTIONS}
          onChange={(value) => choose('condition', value)}
          placeholder="Выберите"
        />
        <QuerySelect
          label="Что сохранить"
          value={code.append}
          options={APPEND_OPTIONS}
          onChange={(value) => choose('append', value)}
          placeholder="Выберите"
        />
        <QuerySelect
          label="Что вывести"
          value={code.print}
          options={PRINT_OPTIONS}
          onChange={(value) => choose('print', value)}
          placeholder="Выберите"
        />
      </div>

      <div className={`terminal-output ${output?.error ? 'is-error' : ''}`}>
        <span>Вывод программы</span>
        <strong className="sequence-text">
          {output ? output.text : 'заполните все пропуски, чтобы запустить программу'}
        </strong>
      </div>

      <label className="query-part">
        <span>Позиции мутаций</span>
        <input
          className="answer-input"
          value={positionsInput}
          onChange={(event) => setPositionsInput(event.target.value)}
          placeholder="Например: 3, 10"
          inputMode="numeric"
          autoComplete="off"
        />
      </label>

      <SubmitAction
        label="Внести в паспорт"
        icon={Code2}
        answer={isCodeReady && positions ? [code.loop, code.condition, code.append, code.print, positions].join('|') : null}
        solved={solved}
        {...submit}
      />
    </div>
  );
}

// «7; 18 и 24» → «7,18,24»: числа по возрастанию без повторов
function normalizePositions(value) {
  const numbers = [...new Set((value.match(/\d+/g) ?? []).map(Number))].sort((a, b) => a - b);
  return numbers.join(',');
}

class PythonError extends Error {}

// Исполняет выбранный вариант программы по правилам Python и возвращает вывод или текст ошибки
function runProgram({ loop, condition, append, print }) {
  const index = (text, i) => {
    if (typeof i === 'string') throw new PythonError('TypeError: string indices must be integers');
    if (i >= text.length) throw new PythonError('IndexError: string index out of range');
    return text[i];
  };

  const values = {
    range_len: [...Array(REF.length).keys()],
    range_len_minus_1: [...Array(REF.length - 1).keys()],
    range_1_len_plus_1: [...Array(REF.length).keys()].map((i) => i + 1),
    ref: Array.from(REF),
  }[loop];

  const diff = [];
  let i;

  try {
    for (i of values) {
      const matches = {
        neq: () => index(REF, i) !== index(CUB, i),
        eq: () => index(REF, i) === index(CUB, i),
        in: () => CUB.includes(index(REF, i)),
        whole: () => REF !== CUB,
      }[condition]();

      if (!matches) continue;

      diff.push(
        {
          i_plus_1: () => {
            if (typeof i === 'string') {
              throw new PythonError('TypeError: can only concatenate str (not "int") to str');
            }
            return i + 1;
          },
          i: () => i,
          ref_i: () => index(REF, i),
          cub_i: () => index(CUB, i),
        }[append](),
      );
    }
  } catch (error) {
    if (error instanceof PythonError) return { text: error.message, error: true };
    throw error;
  }

  const text = {
    diff: () => formatPythonList(diff),
    len_diff: () => String(diff.length),
    ref: () => REF,
    i: () => String(i),
  }[print]();

  return { text, error: false };
}

function formatPythonList(items) {
  return `[${items.map((item) => (typeof item === 'string' ? `'${item}'` : item)).join(', ')}]`;
}
