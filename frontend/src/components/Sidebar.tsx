import type { Entitlements } from '../api/types';
import { ClientSwitcher } from './ClientSwitcher';
import { Icon } from './Icon';
import { ProductList } from './ProductList';
import { UserCard } from './UserCard';

interface Props {
  user: Entitlements;
  clientId?: string;
  productId?: string;
  conversationId?: string;
  onClose: () => void;
}

export function Sidebar({ user, clientId, productId, conversationId, onClose }: Props) {
  const client = user.clients.find((c) => c.id === clientId);
  return (
    <aside className="sidebar">
      <div className="sidebar__top">
        <div className="brand">
          <span className="brand__logo">◆</span> chatAI
          <button className="icon-button sidebar__close" onClick={onClose} aria-label="Close sidebar">
            <Icon name="sidebar" />
          </button>
        </div>
        <ClientSwitcher clients={user.clients} current={client} />
      </div>

      <div className="sidebar__middle">
        {client ? (
          <ProductList
            key={client.id}
            client={client}
            activeProductId={productId}
            activeConversationId={conversationId}
            onNavigate={() => window.matchMedia('(max-width: 768px)').matches && onClose()}
          />
        ) : (
          <p className="tree__hint">Select a client to see its products.</p>
        )}
      </div>

      <div className="sidebar__bottom">
        <UserCard user={user} />
      </div>
    </aside>
  );
}
