import { useLayoutEffect, useRef, useState } from 'react';
import { Icon } from './Icon';

interface Props {
  placeholder: string;
  streaming: boolean;
  disabled?: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
}

export function Composer({ placeholder, streaming, disabled, onSend, onStop }: Props) {
  const [text, setText] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);

  // Grow with content up to the CSS max-height.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [text]);

  const submit = () => {
    const value = text.trim();
    if (!value || streaming || disabled) return;
    onSend(value);
    setText('');
  };

  return (
    <form
      className="composer"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <textarea
        ref={ref}
        rows={1}
        value={text}
        placeholder={placeholder}
        aria-label="Message"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit();
          }
        }}
        autoFocus
      />
      {streaming ? (
        <button type="button" className="composer__button" onClick={onStop} aria-label="Stop generating">
          <Icon name="stop" />
        </button>
      ) : (
        <button type="submit" className="composer__button" disabled={!text.trim() || disabled} aria-label="Send">
          <Icon name="send" />
        </button>
      )}
    </form>
  );
}
