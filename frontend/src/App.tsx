import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { useToken } from './auth/token';
import { ChatView } from './components/ChatView';
import { Layout } from './components/Layout';
import { ProductPicker } from './components/ProductPicker';
import { TokenGate } from './components/TokenGate';

// URL carries the scope: /c/{clientId}/p/{productId}/{conversationId?}
const routes = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { path: 'c/:clientId', element: <ProductPicker /> },
      { path: 'c/:clientId/p/:productId/:conversationId?', element: <ChatView /> },
    ],
  },
];

export function App() {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } }),
  );
  const token = useToken();

  // Signing out (or the token being rejected) drops everything cached for that user.
  useEffect(() => {
    if (!token) queryClient.clear();
  }, [token, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {token ? <AuthenticatedApp /> : <TokenGate />}
    </QueryClientProvider>
  );
}

function AuthenticatedApp() {
  const [router] = useState(() => createBrowserRouter(routes));
  return <RouterProvider router={router} />;
}
