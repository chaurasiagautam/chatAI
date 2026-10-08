import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { App } from './App';
import { handlers } from './mocks/handlers';

const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
beforeEach(() => window.history.replaceState(null, '', '/'));

test('pick client, open a product, chat and see the streamed answer', async () => {
  const user = userEvent.setup();
  render(<App />);

  // Sidebar: client on top, user at the bottom, products in between.
  expect(await screen.findByRole('button', { name: /ACME Corp/ })).toBeInTheDocument();
  expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  const products = screen.getByRole('navigation', { name: 'Products' });

  // Expanding a product lists its existing chats.
  await user.click(within(products).getByRole('button', { name: 'Expand Payments' }));
  expect(await within(products).findByText('Q3 chargeback summary')).toBeInTheDocument();

  // Selecting the product opens a new chat window for it.
  await user.click(within(products).getByRole('button', { name: 'Payments' }));
  expect(await screen.findByText('What can I help you with?')).toBeInTheDocument();

  await user.type(screen.getByLabelText('Message'), 'How many chargebacks?{Enter}');
  expect(await screen.findByText('How many chargebacks?', { selector: '.msg__bubble' })).toBeInTheDocument();
  expect(await screen.findByText(/mocked response/, {}, { timeout: 5000 })).toBeInTheDocument();
  expect(await screen.findByText('[1] Product runbook')).toBeInTheDocument();

  // The new chat shows up under the product with its title from the first message.
  expect(await within(products).findByText('How many chargebacks?')).toBeInTheDocument();
});

test('switching client changes the product list', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(await screen.findByRole('button', { name: /ACME Corp/ }));
  await user.click(screen.getByRole('option', { name: /Globex/ }));
  const products = screen.getByRole('navigation', { name: 'Products' });
  expect(within(products).getByText('Treasury')).toBeInTheDocument();
  expect(within(products).queryByText('Payments')).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Globex' })).toBeInTheDocument();
});
