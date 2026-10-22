import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { api } from '../api/client';
import type { Client, Conversation, Product } from '../api/types';
import { keys, useConversations } from '../hooks/queries';
import { Icon } from './Icon';

interface Props {
  client: Client;
  activeProductId?: string;
  activeConversationId?: string;
  onNavigate?: () => void;
}

export function ProductList({ client, activeProductId, activeConversationId, onNavigate }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(activeProductId ? [activeProductId] : []));

  // Opening a product (from anywhere) expands it in the tree.
  useEffect(() => {
    if (activeProductId) setExpanded((s) => (s.has(activeProductId) ? s : new Set(s).add(activeProductId)));
  }, [activeProductId]);

  const toggle = (id: string) =>
    setExpanded((s) => {
      const next = new Set(s);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  return (
    <nav className="products" aria-label="Products">
      <div className="section-label">Products</div>
      <ul className="tree">
        {client.products.map((p) => (
          <ProductNode
            key={p.id}
            client={client}
            product={p}
            expanded={expanded.has(p.id)}
            active={p.id === activeProductId}
            activeConversationId={activeConversationId}
            onToggle={() => toggle(p.id)}
            onNavigate={onNavigate}
          />
        ))}
      </ul>
    </nav>
  );
}

function ProductNode({
  client,
  product,
  expanded,
  active,
  activeConversationId,
  onToggle,
  onNavigate,
}: {
  client: Client;
  product: Product;
  expanded: boolean;
  active: boolean;
  activeConversationId?: string;
  onToggle: () => void;
  onNavigate?: () => void;
}) {
  const navigate = useNavigate();
  const { data: conversations, isLoading } = useConversations(client.id, product.id, expanded);
  const newChatPath = `/c/${client.id}/p/${product.id}`;

  return (
    <li className={`tree__node${active ? ' tree__node--active' : ''}`}>
      <div className="tree__row">
        <button
          className="tree__toggle"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-label={`${expanded ? 'Collapse' : 'Expand'} ${product.name}`}
        >
          <Icon name={expanded ? 'chevronDown' : 'chevronRight'} size={14} />
        </button>
        <button
          className="tree__label"
          onClick={() => {
            if (!expanded) onToggle();
            navigate(newChatPath);
            onNavigate?.();
          }}
        >
          <Icon name="box" size={15} />
          <span>{product.name}</span>
        </button>
      </div>

      {expanded && (
        <ul className="tree__children">
          <li>
            <NavLink to={newChatPath} end className="tree__leaf tree__leaf--new" onClick={onNavigate}>
              <Icon name="plus" size={14} /> New chat
            </NavLink>
          </li>
          {isLoading && <li className="tree__hint">Loading…</li>}
          {conversations?.length === 0 && <li className="tree__hint">No chats yet</li>}
          {conversations?.map((c) => (
            <ConversationItem
              key={c.id}
              conversation={c}
              active={c.id === activeConversationId}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function ConversationItem({
  conversation: c,
  active,
  onNavigate,
}: {
  conversation: Conversation;
  active: boolean;
  onNavigate?: () => void;
}) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(c.title);
  const listKey = keys.conversations(c.clientId, c.productId);

  const rename = async () => {
    setEditing(false);
    const next = title.trim();
    if (!next || next === c.title) return setTitle(c.title);
    await api.renameConversation(c.clientId, c.productId, c.id, next);
    void qc.invalidateQueries({ queryKey: listKey });
  };

  const remove = async () => {
    if (!window.confirm(`Delete "${c.title}"?`)) return;
    await api.deleteConversation(c.clientId, c.productId, c.id);
    void qc.invalidateQueries({ queryKey: listKey });
    if (active) navigate(`/c/${c.clientId}/p/${c.productId}`);
  };

  if (editing) {
    return (
      <li>
        <input
          className="tree__edit"
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={rename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void rename();
            if (e.key === 'Escape') {
              setTitle(c.title);
              setEditing(false);
            }
          }}
          aria-label="Chat title"
        />
      </li>
    );
  }

  return (
    <li className="tree__item">
      <NavLink
        to={`/c/${c.clientId}/p/${c.productId}/${c.id}`}
        className="tree__leaf"
        title={c.title}
        onClick={onNavigate}
      >
        <span className="tree__title">{c.title}</span>
      </NavLink>
      <span className="tree__actions">
        <button onClick={() => setEditing(true)} aria-label={`Rename ${c.title}`}>
          <Icon name="pencil" size={13} />
        </button>
        <button onClick={remove} aria-label={`Delete ${c.title}`}>
          <Icon name="trash" size={13} />
        </button>
      </span>
    </li>
  );
}
