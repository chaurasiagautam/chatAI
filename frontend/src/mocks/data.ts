import type { Conversation, Entitlements, Message } from '../api/types';

export const entitlements: Entitlements = {
  userId: 'u-1001',
  displayName: 'Jane Doe',
  email: 'jane.doe@example.com',
  clients: [
    {
      id: 'acme',
      name: 'ACME Corp',
      products: [
        { id: 'payments', name: 'Payments' },
        { id: 'lending', name: 'Lending' },
        { id: 'cards', name: 'Cards' },
      ],
    },
    {
      id: 'globex',
      name: 'Globex',
      products: [
        { id: 'treasury', name: 'Treasury' },
        { id: 'fx', name: 'FX' },
      ],
    },
    {
      id: 'initech',
      name: 'Initech',
      products: [{ id: 'payroll', name: 'Payroll' }],
    },
  ],
};

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

interface StoredConversation extends Conversation {
  messages: Message[];
}

function seed(
  id: string,
  clientId: string,
  productId: string,
  title: string,
  ageHours: number,
  turns: [string, string][],
): StoredConversation {
  const messages: Message[] = turns.flatMap(([q, a], i) => [
    { id: `${id}-u${i}`, role: 'USER', content: q, status: 'COMPLETE', createdAt: hoursAgo(ageHours) },
    {
      id: `${id}-a${i}`,
      role: 'ASSISTANT',
      content: a,
      status: 'COMPLETE',
      citations: [{ title: 'Internal knowledge base', url: '#' }],
      createdAt: hoursAgo(ageHours),
    },
  ]);
  return { id, clientId, productId, title, createdAt: hoursAgo(ageHours), updatedAt: hoursAgo(ageHours), messages };
}

export const conversations: StoredConversation[] = [
  seed('c-1', 'acme', 'payments', 'Q3 chargeback summary', 2, [
    [
      'What were the chargebacks last quarter?',
      'Chargebacks in Q3 totalled **1,284** cases, down 8% from Q2.\n\n- Fraud: 61%\n- Merchant error: 24%\n- Other: 15%',
    ],
  ]),
  seed('c-2', 'acme', 'payments', 'Fee schedule changes', 30, [
    ['Did the fee schedule change in September?', 'Yes — the interchange pass-through fee changed from 0.20% to 0.18% on 1 September.'],
  ]),
  seed('c-3', 'acme', 'lending', 'Onboarding SLA', 120, [
    ['What is the loan onboarding SLA?', 'The standard onboarding SLA is **3 business days** from complete application.'],
  ]),
  seed('c-4', 'globex', 'treasury', 'Liquidity report', 5, [
    ['Summarise the latest liquidity report.', 'Liquidity coverage ratio is **142%**, comfortably above the 100% minimum.'],
  ]),
];

export type { StoredConversation };
