import { BookOpen } from 'lucide-react';
import HintPanel from './HintPanel';

// Окно выполнения задания: рабочая область, памятка и подсказки
export default function ChallengeFrame({ task, solved, onBrief, children }) {
  return (
    <div className="challenge-frame">
      <div className="challenge-topline">
        <span>{solved ? 'Улика подтверждена' : 'Активная задача'}</span>
        <button className="ghost-action" onClick={onBrief}>
          Вернуться к брифингу
        </button>
      </div>

      <div className="challenge-body">
        <div className="challenge-main">{children}</div>

        <aside className="challenge-aside">
          <div className="memo-card">
            <div className="panel-title">
              <BookOpen size={16} />
              Памятка
            </div>
            <ul>
              {task.memo.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <HintPanel key={task.taskType} hints={task.hints} />
        </aside>
      </div>
    </div>
  );
}
