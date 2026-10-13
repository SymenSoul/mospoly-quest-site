import { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, ChevronRight, Play } from 'lucide-react';

// Брифинг задания: текст печатается в терминале по абзацам, после — кнопка действия
export default function StoryInterlude({ storyKey, text, isSolved, isFinal, hasPlayed, onRead, onStart, onNext, onFinish, finishPending = false, transmissionLabel = 'Терминал лаборатории' }) {
  const paragraphs = useMemo(() => splitStory(text), [text]);
  const [typedParagraphs, setTypedParagraphs] = useState(() =>
    hasPlayed ? paragraphs : paragraphs.map(() => ''),
  );
  const isComplete = paragraphs.every((paragraph, index) => typedParagraphs[index] === paragraph);

  useEffect(() => {
    if (hasPlayed) {
      setTypedParagraphs(paragraphs);
      return undefined;
    }

    setTypedParagraphs(paragraphs.map(() => ''));
    const paragraphChars = paragraphs.map((paragraph) => Array.from(paragraph));
    let paragraphIndex = 0;
    let charIndex = 0;
    let timerId;

    const typeNext = () => {
      if (paragraphIndex >= paragraphs.length) {
        onRead(storyKey);
        return;
      }

      const currentChars = paragraphChars[paragraphIndex];

      if (charIndex < currentChars.length) {
        charIndex += 1;
        setTypedParagraphs((items) => {
          const next = [...items];
          next[paragraphIndex] = currentChars.slice(0, charIndex).join('');
          return next;
        });
        timerId = window.setTimeout(typeNext, 22);
        return;
      }

      paragraphIndex += 1;
      charIndex = 0;

      if (paragraphIndex >= paragraphs.length) {
        onRead(storyKey);
        return;
      }

      timerId = window.setTimeout(typeNext, 2500);
    };

    timerId = window.setTimeout(typeNext, 650);
    return () => window.clearTimeout(timerId);
  }, [hasPlayed, onRead, paragraphs, storyKey]);

  return (
    <div className="story-screen">
      <div className="story-copy console-story">
        <span className="transmission">{transmissionLabel}</span>
        <div className="console-lines" aria-live="polite">
          {typedParagraphs.map((paragraph, index) =>
            paragraph ? (
              <p key={`${storyKey}-${index}`}>
                <span>&gt;</span>
                {paragraph}
              </p>
            ) : null,
          )}
          {!isComplete && (
            <p className="console-wait">
              <span>&gt;</span>
              <i>печать сообщения...</i>
            </p>
          )}
        </div>
      </div>
      <div className="story-actions">
        {!isSolved && (
          <button className="primary-action" disabled={!isComplete} onClick={onStart}>
            <Play size={18} />
            {isComplete ? 'Открыть задание' : 'Ожидайте брифинг'}
          </button>
        )}
        {isSolved && !isFinal && (
          <button className="primary-action" disabled={!isComplete} onClick={onNext}>
            Следующее задание
            <ChevronRight size={18} />
          </button>
        )}
        {isSolved && isFinal && (
          <button className="primary-action" disabled={!isComplete || finishPending} onClick={onFinish}>
            <BadgeCheck size={18} />
            {finishPending ? 'Сохраняем результат...' : 'Завершить квест'}
          </button>
        )}
      </div>
    </div>
  );
}

export function splitStory(text) {
  return text
    .split('\n\n')
    .map((item) => item.trim())
    .filter(Boolean);
}
