import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { ChatView } from './components/ChatView';
import { Layout } from './components/Layout';
import { ProductPicker } from './components/ProductPicker';

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
  const [router] = useState(() => createBrowserRouter(routes));
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
