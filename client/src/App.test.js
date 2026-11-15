import { fireEvent, render, screen, within } from '@testing-library/react';
import App from './App';
import { getSalamaResources } from './api/salama';
import {
  getMarketPrices,
  getOrders,
  getProducts,
  getRatings
} from './api/api';

jest.mock('./api/salama', () => ({
  getSalamaResources: jest.fn().mockResolvedValue({
    resources: [],
    source: 'live',
    lastSyncedAt: null
  }),
  submitConsumerProtectionReport: jest.fn()
}));

jest.mock('./api/api', () => ({
  getOrders: jest.fn(),
  getProducts: jest.fn(),
  getMarketPrices: jest.fn(),
  getRatings: jest.fn()
}));

beforeEach(() => {
  window.history.pushState({}, '', '/');
  localStorage.removeItem('shambaDirectUser');
  getMarketPrices.mockResolvedValue([]);
});

test('renders the Shamba Direct home page', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /sell your harvest direct/i })).toBeInTheDocument();
});

test('shows products and prices from the market price feed on the home page', async () => {
  getMarketPrices.mockResolvedValue([
    { crop_name: 'Tomatoes', price_per_kg: 45, county: 'Kirinyaga' },
    { crop_name: 'Maize', price_per_kg: 32, county: 'Uasin Gishu' }
  ]);
  render(<App />);

  expect(await screen.findByText('KES 45/kg')).toBeInTheDocument();
  expect(screen.getByText('Tomatoes')).toBeInTheDocument();
  expect(screen.getAllByText('KES 32/kg')).toHaveLength(2);
  expect(screen.getByText('Maize')).toBeInTheDocument();
});

test('opens the farmer protection page from the navigation', async () => {
  getSalamaResources.mockResolvedValue({
    resources: [{
      id: 3,
      name: 'County support desk',
      type: 'legal',
      county: 'nairobi',
      description: 'Confidential legal referrals',
      contact: '07000000000',
      phone: '07000000000',
      available: 'Yes'
    }],
    source: 'live',
    lastSyncedAt: null
  });
  render(<App />);

  fireEvent.click(within(screen.getByRole('navigation')).getByRole('link', { name: /farmers protection/i }));

  expect(screen.queryByRole('heading', {
    name: 'Farmer Protection & Fair Trade'
  })).not.toBeInTheDocument();
  expect(screen.queryByRole('heading', {
    name: 'Protection throughout every transaction'
  })).not.toBeInTheDocument();
  expect(screen.queryByText('SHAMBA DIRECT TRUST & PROTECTION')).not.toBeInTheDocument();
  expect(screen.queryByText('OUR COMMITMENT')).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /shop confidently\. know your rights\. stay protected\./i })).toBeInTheDocument();
  expect(screen.queryByRole('heading', {
    name: 'Fair Trade & Farmer Protection'
  })).not.toBeInTheDocument();
  expect(screen.queryByText(/Building a safer agricultural marketplace/i)).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'View Requirements' })).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Report a Concern' })).not.toBeInTheDocument();
  expect(screen.queryByText(/Our protection approach focuses on trust/i)).not.toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Order Tracking' })).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Track orders →' })).not.toBeInTheDocument();
  expect(screen.queryByRole('heading', {
    name: 'Verified Farmer & Buyer System'
  })).not.toBeInTheDocument();
  expect(screen.queryByRole('heading', {
    name: /safe delivery & order tracking/i
  })).not.toBeInTheDocument();
  expect(screen.queryByRole('heading', {
    name: 'Report Economic Exploitation'
  })).not.toBeInTheDocument();
  expect(screen.getByRole('heading', {
    name: 'Report a marketplace concern'
  })).toBeInTheDocument();
  const guidanceHeading = screen.getByRole('heading', {
    name: 'Shop safely on Shamba Direct'
  });
  const reportHeading = screen.getByRole('heading', {
    name: 'Report a marketplace concern'
  });
  const supportDirectory = screen.getByRole('heading', {
    name: /find community support/i
  });
  expect(supportDirectory).toBeInTheDocument();
  expect(
    guidanceHeading.compareDocumentPosition(reportHeading) &
      Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy();
  expect(
    reportHeading.compareDocumentPosition(supportDirectory) &
      Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy();
  expect(await screen.findByRole('heading', { name: 'County support desk' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: '07000000000' })).toHaveAttribute('href', 'tel:07000000000');
});

test('shows order tracking with three stages in the dashboard', async () => {
  getProducts.mockResolvedValue([]);
  getOrders.mockResolvedValue([
    {
      id: 1,
      product_name: 'Tomatoes',
      quantity_kg: 10,
      total_price: 800,
      status: 'pending'
    },
    {
      id: 2,
      product_name: 'Maize',
      quantity_kg: 20,
      total_price: 1200,
      status: 'confirmed'
    }
  ]);
  getRatings.mockResolvedValue({ averageRating: 0, reviewCount: 0 });
  localStorage.setItem('shambaDirectUser', JSON.stringify({
    id: 1,
    role: 'farmer',
    full_name: 'Test Farmer'
  }));
  render(<App />);

  fireEvent.click(screen.getByRole('link', { name: 'Dashboard' }));
  const tracking = await screen.findByRole('region', {
    name: 'Order tracking'
  });

  expect(await within(tracking).findByText('ORDER #0001')).toBeInTheDocument();
  expect(within(tracking).queryByText('ORDER #0002')).not.toBeInTheDocument();
  expect(within(tracking).getByText('Order placed')).toBeInTheDocument();
  expect(within(tracking).getByText('Order accepted')).toBeInTheDocument();
  expect(within(tracking).getByText('Delivery complete')).toBeInTheDocument();

  fireEvent.click(within(tracking).getByRole('button', {
    name: 'Show all orders'
  }));
  expect(within(tracking).getByText('ORDER #0002')).toBeInTheDocument();
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
  expect(within(dashboardSidebar).getByRole('img', {
    name: 'Verified account'
  })).toHaveClass('dash-verification-dot', 'verified');
  expect(within(screen.getByRole('navigation')).getByRole('img', {
    name: 'Verified account'
  })).toHaveClass('nav-verification-dot', 'verified');
  expect(screen.getByText('Recent Orders')).toBeInTheDocument();
  expect(screen.getByText('Total Delivered Earnings')).toBeInTheDocument();
  await screen.findByText('No orders yet.');

  localStorage.removeItem('shambaDirectUser');
});

test('shows unverified farmers with the pending-status color indicator', () => {
  getProducts.mockResolvedValue([]);
  getOrders.mockResolvedValue([]);
  getRatings.mockResolvedValue({ averageRating: 0, reviewCount: 0 });
  localStorage.setItem('shambaDirectUser', JSON.stringify({
    id: 2,
    role: 'farmer',
    full_name: 'Pending Farmer',
    is_verified: false
  }));
  window.history.pushState({}, '', '/dashboard');
  render(<App />);

  expect(within(screen.getByRole('complementary')).getByRole('img', {
    name: 'Unverified account'
  })).toHaveClass('dash-verification-dot', 'unverified');
  expect(within(screen.getByRole('navigation')).getByRole('img', {
    name: 'Unverified account'
  })).toHaveClass('nav-verification-dot', 'unverified');

  localStorage.removeItem('shambaDirectUser');
});
