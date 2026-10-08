import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import type { Client } from '../api/types';
import { Icon, initials } from './Icon';

export function ClientSwitcher({ clients, current }: { clients: Client[]; current?: Client }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div className="client-switcher" ref={ref}>
      <button
        className="client-switcher__button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="avatar avatar--client">{current ? initials(current.name) : '?'}</span>
        <span className="client-switcher__text">
          <span className="client-switcher__label">Client</span>
          <span className="client-switcher__name">{current?.name ?? 'Select a client'}</span>
        </span>
        <Icon name="chevronUpDown" />
      </button>
      {open && (
        <ul className="menu" role="listbox" aria-label="Clients">
          {clients.map((c) => (
            <li key={c.id}>
              <button
                role="option"
                aria-selected={c.id === current?.id}
                className="menu__item"
                onClick={() => {
                  setOpen(false);
                  navigate(`/c/${c.id}`);
                }}
              >
                <span className="avatar avatar--client avatar--sm">{initials(c.name)}</span>
                <span className="menu__text">
                  {c.name}
                  <small>
                    {c.products.length} product{c.products.length === 1 ? '' : 's'}
                  </small>
                </span>
                {c.id === current?.id && <Icon name="check" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
