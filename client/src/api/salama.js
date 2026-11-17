
const BASE_URL =
  process.env.REACT_APP_API_URL || '/api';

async function salamaLocalRequest(path, options = {}) {
  const response = await fetch(
    `${BASE_URL}/salama${path}`,
    {
      method: options.method || 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: options.body
        ? JSON.stringify(options.body)
        : undefined
    }
  );

  let data = null;

  try {
    data = await response.json();
  } catch (_) {
    // Ignore empty responses.
  }

  if (!response.ok) {
    throw new Error(
      data?.error ||
      `Shamba Direct request failed (${response.status}).`
    );
  }

  return data;
}

// Get synchronized support resources.
export async function getSalamaResources({
  county = '',
  type = ''
} = {}) {
  const params = new URLSearchParams();

  if (county) params.set('county', county);
  if (type) params.set('type', type);

  const query = params.toString();

  return salamaLocalRequest(
    `/resources${query ? `?${query}` : ''}`
  );
}

// Submit a consumer protection report.
export function submitConsumerProtectionReport(payload) {
  return salamaLocalRequest(
    '/consumer-reports',
    {
      method: 'POST',
      body: payload
    }
  );
}
