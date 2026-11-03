import { fireEvent, render, screen, within } from '@testing-library/react';
import App from './App';
import { getSalamaResources } from './api/salama';
import { getOrders, getProducts, getRatings } from './api/api';

jest.mock('./api/salama', () => ({
  getSalamaResources: jest.fn().mockResolvedValue([]),
  submitEconomicAbuseReport: jest.fn()
}));

jest.mock('./api/api', () => ({
  getOrders: jest.fn(),
  getProducts: jest.fn(),
  getRatings: jest.fn()
}));

beforeEach(() => {
  window.history.pushState({}, '', '/');
  localStorage.removeItem('shambaDirectUser');
});

test('renders the Shamba Direct home page', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /sell your harvest direct/i })).toBeInTheDocument();
});

test('opens the safety and support page from the navigation', async () => {
  getSalamaResources.mockResolvedValue([]);
  render(<App />);

  fireEvent.click(within(screen.getByRole('navigation')).getByRole('link', { name: /safety & support/i }));

  expect(screen.getByRole('heading', { name: /support when you need it/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /support services near you/i })).toBeInTheDocument();
  await screen.findByText(/no services were returned/i);
});

test('farmer dashboard navigation opens orders and earnings sections', async () => {
  getProducts.mockResolvedValue([]);
  getOrders.mockResolvedValue([]);
  getRatings.mockResolvedValue({ averageRating: 0, reviewCount: 0 });
  localStorage.setItem('shambaDirectUser', JSON.stringify({
    id: 1,
    role: 'farmer',
    full_name: 'Test Farmer',
    is_verified: true
  }));
  render(<App />);

  fireEvent.click(screen.getByRole('link', { name: 'Dashboard' }));

  const dashboardSidebar = screen.getByRole('complementary');
  expect(within(dashboardSidebar).getByRole('link', { name: /orders/i })).toHaveAttribute('href', '#orders');
  expect(within(dashboardSidebar).getByRole('link', { name: /earnings/i })).toHaveAttribute('href', '#earnings');
  expect(document.getElementById('orders')).toBeInTheDocument();
  expect(document.getElementById('earnings')).toBeInTheDocument();
  await screen.findByText('No orders yet.');

  localStorage.removeItem('shambaDirectUser');
});
