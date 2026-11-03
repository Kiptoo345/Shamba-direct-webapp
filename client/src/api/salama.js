const BASE_URL =
  process.env.REACT_APP_API_URL || '/api';


async function salamaLocalRequest(
  path,
  {
    method = 'GET',
    body
  } = {}
) {
  const response = await fetch(
    `${BASE_URL}/salama${path}`,
    {
      method,

      headers: {
        'Content-Type': 'application/json'
      },

      body: body === undefined
        ? undefined
        : JSON.stringify(body)
    }
  );

  let data = null;

  try {
    data = await response.json();
  } catch (_) {
    // Ignore empty response bodies.
  }

  if (!response.ok) {
    throw new Error(
      data?.error ||
      `Salama integration failed (${response.status}).`
    );
  }

  return data;
}


// Retrieve Salama support resources.
export function getSalamaResources({
  county = '',
  type = ''
} = {}) {
  const params = new URLSearchParams();

  if (county) {
    params.set('county', county);
  }

  if (type) {
    params.set('type', type);
  }

  const query = params.toString();

  return salamaLocalRequest(
    `/resources${query ? `?${query}` : ''}`
  );
}


// Submit an economic-abuse report.
export function submitEconomicAbuseReport(payload) {
  return salamaLocalRequest(
    '/incidents',
    {
      method: 'POST',
      body: payload
    }
  );
}