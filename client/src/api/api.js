// Central place for every network call the app makes.
// Change REACT_APP_API_URL in client/.env if the API is not on localhost:5000.

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });

  let data = null;
  try {
    data = await res.json();
  } catch (_) {
    // no JSON body (e.g. empty response) — ignore
  }

  if (!res.ok) {
    throw new Error((data && data.error) || `Request failed (${res.status})`);
  }
  return data;
}

// ---- Auth -----------------------------------------------------------
export const registerUser = (payload) => request('/auth/register', { method: 'POST', body: payload });
export const loginUser = (payload) => request('/auth/login', { method: 'POST', body: payload });
export const updateUser = (id, payload) => request(`/auth/users/${id}`, { method: 'PUT', body: payload });
export const deleteUser = (id) => request(`/auth/users/${id}`, { method: 'DELETE' });

// ---- Products / Listings ---------------------------------------------
export const getProducts = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/products${query ? `?${query}` : ''}`);
};
export const getProduct = (id) => request(`/products/${id}`);
export const createProduct = (payload) => request('/products', { method: 'POST', body: payload });
export const updateProduct = (id, payload) => request(`/products/${id}`, { method: 'PUT', body: payload });
export const deleteProduct = (id) => request(`/products/${id}`, { method: 'DELETE' });

// ---- Orders -----------------------------------------------------------
export const getOrders = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/orders${query ? `?${query}` : ''}`);
};
export const createOrder = (payload) => request('/orders', { method: 'POST', body: payload });
export const updateOrderStatus = (id, status) => request(`/orders/${id}`, { method: 'PUT', body: { status } });
export const deleteOrder = (id) => request(`/orders/${id}`, { method: 'DELETE' });

// ---- Enquiries ("Contact Farmer") -------------------------------------
export const getEnquiries = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/enquiries${query ? `?${query}` : ''}`);
};
export const createEnquiry = (payload) => request('/enquiries', { method: 'POST', body: payload });

// ---- Contact form -------------------------------------------------------
export const submitContactMessage = (payload) => request('/contact', { method: 'POST', body: payload });

// ---- Ratings -----------------------------------------------------------
export const getRatings = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/ratings${query ? `?${query}` : ''}`);
};
export const createRating = (payload) => request('/ratings', { method: 'POST', body: payload });

// ---- Headquarters --------------------------------------------------------
export const getHeadquarters = () => request('/headquarters');

// ---- Market prices ---------------------------------------------------------
export const getMarketPrices = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/market-prices${query ? `?${query}` : ''}`);
};
