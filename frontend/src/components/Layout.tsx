import { useState } from 'react';
import { Navigate, Outlet, useParams } from 'react-router';
import { useEntitlements } from '../hooks/queries';
import { Icon } from './Icon';
import { Sidebar } from './Sidebar';

export function Layout() {
  const { clientId, productId, conversationId } = useParams();
  const { data: user, isLoading, error } = useEntitlements();
  const [sidebarOpen, setSidebarOpen] = useState(() => !window.matchMedia('(max-width: 768px)').matches);

  if (isLoading) return <div className="center-note">Loading…</div>;
  if (error || !user) return <div className="center-note">Could not load your entitlements. {error?.message}</div>;
  if (user.clients.length === 0) return <div className="center-note">You don’t have access to any client yet.</div>;
  if (!clientId) return <Navigate to={`/c/${user.clients[0]!.id}`} replace />;

  return (
    <div className={`app${sidebarOpen ? '' : ' app--collapsed'}`}>
      {sidebarOpen && (
        <>
          <Sidebar
            user={user}
            clientId={clientId}
            productId={productId}
            conversationId={conversationId}
            onClose={() => setSidebarOpen(false)}
          />
          <div className="scrim" onClick={() => setSidebarOpen(false)} />
        </>
      )}
      <main className="main">
        {!sidebarOpen && (
          <button className="icon-button main__open" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar">
            <Icon name="sidebar" />
          </button>
        )}
        <Outlet />
      </main>
    </div>
  );
}
