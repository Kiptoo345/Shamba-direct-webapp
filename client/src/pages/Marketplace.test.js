import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { getProducts } from '../api/api';
import { AuthProvider } from '../context/AuthContext';
import Marketplace from './Marketplace';

jest.mock('../api/api', () => ({
  getProducts: jest.fn(),
  createEnquiry: jest.fn(),
  createOrder: jest.fn()
}));

beforeEach(() => {
  localStorage.removeItem('shambaDirectUser');
  getProducts.mockResolvedValue([
    {
      id: 1,
      name: 'Roma Tomatoes',
      farmer_name: 'Amina',
      county: 'Nairobi',
      price_per_kg: 50,
      quantity_kg: 100,
      farmer_verified: true,
      created_at: '2026-01-01'
    },
    {
      id: 2,
      name: 'Green Maize',
      farmer_name: 'Kamau',
      county: 'Nakuru',
      price_per_kg: 30,
      quantity_kg: 200,
      farmer_verified: false,
      created_at: '2026-01-02'
    }
  ]);
});

test('filters marketplace listings to verified farmers when selected', async () => {
  render(
    <AuthProvider>
      <MemoryRouter>
        <Marketplace />
      </MemoryRouter>
    </AuthProvider>
  );

  expect(await screen.findByText('Roma Tomatoes')).toBeInTheDocument();
  expect(screen.getByText('Green Maize')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('checkbox', { name: /verified farmers only/i }));

  expect(screen.getByText('Roma Tomatoes')).toBeInTheDocument();
  expect(screen.queryByText('Green Maize')).not.toBeInTheDocument();
});
