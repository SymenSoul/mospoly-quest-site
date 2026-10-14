import { useMemo, useState } from 'react';
import { AlertTriangle, Code2, Database, GitBranch, Network, RotateCcw, ShieldAlert, X, Check } from 'lucide-react';
import HintPanel from '../components/HintPanel';
import QuerySelect from '../components/QuerySelect';
import SubmitAction from '../components/SubmitAction';

const ACCESS_ROWS = [
  { time: '22:31:08', user: 'orlov', room: 'Лаборатория 3', terminal: 'A-02', action: 'вход в систему', status: 'ok' },
  { time: '22:48:03', user: 'orlov', room: 'Серверная C', terminal: 'B-14', action: 'последний вход', status: 'ok' },
  { time: '22:51:44', user: 'guest', room: 'Коворкинг', terminal: 'K-09', action: 'таймер пропуска', status: 'timeout' },
];

const PHISHING_SIGNALS = [
  { id: 'ticket_number', label: 'В теме письма есть номер обращения', danger: false },
  { id: 'urgency', label: 'Письмо пугает блокировкой через 15 минут', danger: true },
  { id: 'signature', label: 'В подписи указана должность сотрудника', danger: false },
  { id: 'sender_domain', label: 'Адрес отправителя похож на настоящий, но написан с ошибкой', danger: true },
  { id: 'polite_greeting', label: 'Письмо начинается с вежливого обращения', danger: false },
  { id: 'unknown_ip', label: 'После письма был вход с незнакомого IP-адреса', danger: true },
  { id: 'password_archive', label: 'Нужно открыть архив с паролем из письма', danger: true },
  { id: 'attachment', label: 'В письме есть вложение access_fix.zip', danger: true },
];

const NETWORK_NODES = ['ЛАБ-07', 'Коммутатор 2 этажа', 'Главный маршрутизатор', 'Защитный экран', 'AURORA'];
const WORKFLOW_STEPS = [
  { id: 'ticket', label: 'Создать задачу: проверить NOVA-17' },
  { id: 'branch', label: 'Создать отдельную ветку' },
  { id: 'commit', label: 'Сделать коммит с изменением' },
  { id: 'test', label: 'Запустить проверку тестами' },
  { id: 'review', label: 'Отправить на ревью' },
  { id: 'fix', label: 'Исправить замечание ревью' },
  { id: 'merge', label: 'Слить изменение в main' },
];

export function OrlovSqlChallenge({ solved, submit }) {
  const [query, setQuery] = useState({ select: '*', where: "user_id = 'guest'", order: 'ts ASC', limit: '10' });
  const rows = useMemo(() => ACCESS_ROWS.filter((row) => {
    if (query.where === "user_id = 'orlov'") return row.user === 'orlov';
    if (query.where === "user_id = 'guest'") return row.user === 'guest';
    if (query.where === "room = 'lobby'") return row.room === 'Лобби';
    if (query.where === "status = 'ok'") return row.status === 'ok';
    return true;
  }).sort((a, b) => {
    if (query.order === 'ts DESC') return b.time.localeCompare(a.time);
    if (query.order === 'ts ASC') return a.time.localeCompare(b.time);
    if (query.order === 'room ASC') return a.room.localeCompare(b.room);
    if (query.order === 'event DESC') return b.action.localeCompare(a.action);
    return 0;
  }).slice(0, Number(query.limit)), [query]);

  const columns = query.select === 'room, terminal'
    ? [['room', 'место'], ['terminal', 'терминал']]
    : query.select === 'event, badge_id'
      ? [['action', 'событие'], ['terminal', 'badge_id']]
      : query.select === 'user_id, status'
        ? [['user', 'user_id'], ['status', 'статус']]
        : [['time', 'время'], ['user', 'пользователь'], ['room', 'место'], ['terminal', 'терминал'], ['action', 'действие'], ['status', 'статус']];
  const answer = `${query.select}|${query.where}|${query.order}|${query.limit}`;

  return (
    <div className="two-column challenge-area">
      <HintPanel hints={[
        'Нужно узнать только место и терминал Орлова.',
        'В поле «Кого ищем» выберите пользователя orlov.',
        'Новые записи должны быть сверху, а строка нужна только одна.',
      ]} />
      <div className="workbench">
        <h2>Соберите запрос к журналу</h2>
        <div className="query-builder">
          <QuerySelect label="Какие поля показать" value={query.select} options={['*', 'event, badge_id', 'room, terminal', 'user_id, status']} onChange={(select) => setQuery({ ...query, select })} />
          <QuerySelect label="Кого ищем" value={query.where} options={["user_id = 'guest'", "user_id = 'orlov'", "room = 'lobby'", "status = 'ok'"]} onChange={(where) => setQuery({ ...query, where })} />
          <QuerySelect label="Порядок записей" value={query.order} options={['ts ASC', 'room ASC', 'ts DESC', 'event DESC']} onChange={(order) => setQuery({ ...query, order })} />
          <QuerySelect label="Сколько строк" value={query.limit} options={['10', '3', '1', '0']} onChange={(limit) => setQuery({ ...query, limit })} />
        </div>
        <pre className="code-window">{`SELECT ${query.select}\nFROM access_log\nWHERE ${query.where}\nORDER BY ${query.order}\nLIMIT ${query.limit};`}</pre>
        <SubmitAction label="Подтвердить улику" icon={Database} answer={answer} solved={solved} {...submit} />
        <div className="data-table">
          <div className="panel-title">Предпросмотр результата</div>
          <table><thead><tr>{columns.map(([key, label]) => <th key={key}>{label}</th>)}</tr></thead>
            <tbody>{rows.map((row) => <tr key={`${row.time}-${row.terminal}`}>{columns.map(([key]) => <td key={key}>{row[key]}</td>)}</tr>)}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function OrlovPythonChallenge({ solved, submit }) {
  const [condition, setCondition] = useState('if "INFO" in line:');
  const [extractor, setExtractor] = useState("line.split('msg=')[1]");
  const [joiner, setJoiner] = useState("''.join(parts)");
  const [answerText, setAnswerText] = useState('');
  const parserCorrect = condition === 'if "TRACE" in line:' && extractor === "line.split('code=')[1]" && joiner === "'-'.join(parts)";
  const displayed = parserCorrect ? 'NOVA-17' : 'не найдено';
  const answer = `${condition}|${extractor}|${joiner}|${answerText.trim().toUpperCase()}`;

  return (
    <div className="two-column challenge-area">
      <HintPanel hints={[
        'Нужные строки в журнале помечены словом TRACE.',
        'Кусок метки стоит после code=.',
        'В результате должны получиться две части: NOVA и 17.',
        'Части нужно соединить через дефис.',
      ]} />
      <div className="workbench">
        <h2>Восстановите парсер логов</h2>
        <pre className="code-window">{`logs = [\n    "22:48 INFO msg=terminal B-14",\n    "22:49 TRACE code=NOVA",\n    "22:49 DEBUG code=TEST",\n    "22:50 TRACE code=17",\n]\n\nparts = []\nfor line in logs:\n    ${condition}\n        parts.append(${extractor})\n\nprint(${joiner})`}</pre>
        <div className="control-grid">
          <QuerySelect label="Какие строки брать" value={condition} options={['if "INFO" in line:', 'if "TRACE" in line:', 'if "DEBUG" in line:', 'if "terminal" in line:']} onChange={setCondition} />
          <QuerySelect label="Как достать код" value={extractor} options={["line.split('msg=')[1]", "line.split('code=')[1]", 'line[:5]', 'line.lower()']} onChange={setExtractor} />
        </div>
        <QuerySelect label="Как склеить части" value={joiner} options={["''.join(parts)", "'-'.join(parts)", "','.join(parts)", "' '.join(parts)"]} onChange={setJoiner} />
        <div className="rule-note"><span>TRACE: строки служебной трассировки</span><span>code=: место, где спрятана часть метки</span><span>join: склеивает список в строку</span></div>
        <div className="terminal-output"><span>Вывод программы</span><strong>{displayed}</strong></div>
        <label className="query-part"><span>Введите найденную метку</span><input className="answer-input" value={answerText} onChange={(event) => setAnswerText(event.target.value)} placeholder="Например, NOVA-17" /></label>
        <SubmitAction label="Записать в дело" icon={Code2} answer={answer} solved={solved} {...submit} />
      </div>
    </div>
  );
}

export function OrlovSecurityChallenge({ solved, submit }) {
  const [selected, setSelected] = useState([]);
  const [action, setAction] = useState('delete');
  const answer = `${selected.slice().sort().join(',')}|${action}`;

  function toggle(id) {
    setSelected((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);
  }

  return (
    <div className="two-column challenge-area">
      <HintPanel hints={[
        'Сравните адрес отправителя с настоящим адресом вуза.',
        'Срочность и угрозы блокировки часто используют в фишинге.',
        'Не все солидно выглядящие детали являются признаком атаки.',
        'После отметок выберите quarantine.',
      ]} />
      <div className="workbench">
        <div className="mail-header"><AlertTriangle size={18} /><span>security@politech-login.ru</span></div>
        <h2>Срочная проверка доступа</h2>
        <p>Уважаемый разработчик, ваш аккаунт будет заблокирован через 15 минут. Откройте вложение access_fix.zip и подтвердите доступ. Пароль архива: 8841.</p>
        <div className="attachment"><AlertTriangle size={18} />access_fix.zip</div>
        <div className="mini-log"><code>22:49:07 вход с IP 185.17.44.9</code><code>22:49:21 запущена изолированная среда</code></div>
        <h3>Отметьте признаки фишинга</h3>
        <div className="flag-list">
          {PHISHING_SIGNALS.map((signal) => (
            <button type="button" key={signal.id} className={`flag-button ${selected.includes(signal.id) ? 'selected' : ''}`} aria-pressed={selected.includes(signal.id)} onClick={() => toggle(signal.id)}>
              {selected.includes(signal.id) ? <Check size={16} /> : <X size={16} />}{signal.label}
            </button>
          ))}
        </div>
        <QuerySelect label="Что делать с письмом" value={action} options={['delete', 'forward', 'quarantine', 'reply']} onChange={setAction} />
        <div className="rule-note"><span>delete: просто удалить</span><span>forward: переслать коллеге</span><span>quarantine: изолировать для анализа</span><span>reply: ответить отправителю</span></div>
        <SubmitAction label="Закрыть инцидент" icon={ShieldAlert} answer={answer} solved={solved} {...submit} />
      </div>
    </div>
  );
}

export function OrlovNetworkChallenge({ solved, submit }) {
  const [route, setRoute] = useState([]);
  const answer = route.join('>');
  const layouts = [
    { left: '14%', top: '58%' }, { left: '70%', top: '15%' }, { left: '46%', top: '44%' },
    { left: '23%', top: '17%' }, { left: '81%', top: '66%' },
  ];
  function pick(node) {
    setRoute((items) => items.includes(node) ? items : [...items, node]);
  }

  return (
    <div className="network-layout challenge-area">
      <HintPanel hints={[
        'Маршрут начинается с компьютера в лаборатории.',
        'После компьютера сигнал обычно идет в коммутатор этажа.',
        'Дальше идут главный маршрутизатор и защитный экран.',
        'Последняя точка маршрута — AURORA.',
      ]} />
      <div className="topology">
        {NETWORK_NODES.map((node, index) => {
          const selectedAt = route.indexOf(node);
          return <button type="button" key={node} className={`node ${selectedAt >= 0 ? 'picked' : ''}`} onClick={() => pick(node)} style={layouts[index]}>
            {selectedAt >= 0 && <b className="pick-order">{selectedAt + 1}</b>}<Network size={22} /><span>{node}</span>
          </button>;
        })}
      </div>
      <div className="workbench">
        <h2>Собранный маршрут</h2>
        <div className="route-strip">{route.length === 0 ? <span className="muted">Ожидаем первый узел</span> : route.map((node, index) => <span key={`${node}-${index}`}>{node}{index < route.length - 1 && ' › '}</span>)}</div>
        <div className="hint-grid"><code>Шагов в маршруте: 5</code><code>Сегмент: лаборатория</code><code>Адрес цели: 10.17.0.77</code><code>Правило: только внутри кампуса</code></div>
        <div className="action-row"><button className="ghost-action" type="button" onClick={() => setRoute([])}><RotateCcw size={16} />Сбросить</button></div>
        <SubmitAction label="Восстановить маршрут" icon={Network} answer={answer} solved={solved} {...submit} />
      </div>
    </div>
  );
}

export function OrlovWorkflowChallenge({ solved, submit }) {
  const [selected, setSelected] = useState([]);
  const [review, setReview] = useState('');
  const answer = `${selected.join(',')}|${review}`;
  const pool = WORKFLOW_STEPS.slice().sort((a, b) => a.label.length - b.label.length);

  function choose(stepId) {
    setSelected((items) => items.includes(stepId) ? items : [...items, stepId]);
  }

  return (
    <div className="two-column challenge-area">
      <HintPanel hints={[
        'Сначала создают задачу, затем отдельную ветку и коммит.',
        'Перед слиянием нужно запустить тесты и пройти ревью.',
        'Замечание ревью надо исправить до слияния.',
        'Настоящий токен нельзя хранить в коде. На ревью выберите remove-secret.',
      ]} />
      <div className="workbench">
        <h2>Разложите рабочий процесс по порядку</h2>
        <div className="step-pool">{pool.map((step) => <button type="button" key={step.id} className={`step-chip ${selected.includes(step.id) ? 'used' : ''}`} disabled={selected.includes(step.id)} onClick={() => choose(step.id)}>{step.label}</button>)}</div>
        <button className="ghost-action" type="button" onClick={() => setSelected([])}><RotateCcw size={16} />Начать заново</button>
      </div>
      <div className="workbench">
        <h2>Цепочка действий</h2>
        <ol className="pipeline">{selected.map((stepId, index) => <li key={`${stepId}-${index}`}>{WORKFLOW_STEPS.find((item) => item.id === stepId)?.label}</li>)}</ol>
        <pre className="code-window">{`Изменение в файле config/nova.env:\n+ AURORA_TOKEN="9x7-real-token"\n+ TRACE_MODE="restore"`}</pre>
        <QuerySelect label="Решение ревью" value={review} options={['approve-now', 'remove-secret', 'skip-tests', 'commit-to-main']} onChange={setReview} />
        <div className="rule-note"><span>approve-now: сразу одобрить</span><span>remove-secret: убрать секрет из кода</span><span>skip-tests: пропустить тесты</span><span>commit-to-main: писать сразу в main</span></div>
        <SubmitAction label="Выполнить слияние" icon={GitBranch} answer={answer} solved={solved} {...submit} />
      </div>
    </div>
  );
}
