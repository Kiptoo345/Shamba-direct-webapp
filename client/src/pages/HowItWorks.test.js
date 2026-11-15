import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HowItWorks from './HowItWorks';

test('keeps marketplace guidance in accessible FAQ accordions', () => {
  render(
    <MemoryRouter>
      <HowItWorks />
    </MemoryRouter>
  );

  expect(screen.getByRole('heading', { name: /frequently asked questions/i })).toBeInTheDocument();

  const paymentQuestion = screen.getByRole('button', { name: /how are payments handled/i });
  expect(paymentQuestion).toHaveAttribute('aria-expanded', 'false');

  fireEvent.click(paymentQuestion);

  expect(paymentQuestion).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByText(/payments are not processed through the current shamba direct website/i)).toBeInTheDocument();
});

test('places fair-trade guidance under the Requirements category', () => {
  render(
    <MemoryRouter>
      <HowItWorks />
    </MemoryRouter>
  );

  const requirements = screen.getByRole('region', {
    name: 'Requirements'
  });

  expect(requirements).toHaveAttribute('id', 'requirements');
  const recordsQuestion = within(requirements).getByRole('button', {
    name: 'What transaction records should I keep?'
  });
  fireEvent.click(recordsQuestion);

  expect(screen.getByText(/keep clear records of agreed prices, quantities, order status/i)).toBeInTheDocument();
});
