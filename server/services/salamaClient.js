const DEFAULT_TIMEOUT_MS = 10000;

function getConfig() {
  const baseUrl = (process.env.SALAMA_API_BASE_URL || '')
    .trim()
    .replace(/\/+$/, '');

  const apiKey = (process.env.SALAMA_API_KEY || '').trim();

  const apiKeyHeader = (
    process.env.SALAMA_API_KEY_HEADER || 'X-API-Key'
  ).trim();

  if (!baseUrl) {
    const error = new Error(
      'Salama integration is not configured. Set SALAMA_API_BASE_URL in server/.env.'
    );

    error.status = 503;
    throw error;
  }

  return {
    baseUrl,
    apiKey,
    apiKeyHeader
  };
}

async function salamaRequest(
  path,
  {
    method = 'GET',
    body,
    requireKey = false
  } = {}
) {
  const {
    baseUrl,
    apiKey,
    apiKeyHeader
  } = getConfig();

  // Do not allow incident submissions without a configured key.
  if (requireKey && !apiKey) {
    const error = new Error(
      'Economic-abuse reporting is unavailable until SALAMA_API_KEY is configured.'
    );

    error.status = 503;
    throw error;
  }

  const headers = {
    Accept: 'application/json'
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (apiKey) {
    headers[apiKeyHeader] = apiKey;
  }

  const timeoutMs = Number(
    process.env.SALAMA_TIMEOUT_MS || DEFAULT_TIMEOUT_MS
  );

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined
        ? undefined
        : JSON.stringify(body),
      signal: controller.signal
    });

    const rawText = await response.text();

    let data = null;

    try {
      data = rawText ? JSON.parse(rawText) : null;
    } catch (_) {
      data = {
        error: 'Salama returned a non-JSON response'
      };
    }

    if (!response.ok) {
      const error = new Error(
        response.status >= 500
          ? 'Salama is temporarily unavailable.'
          : (
              data?.error ||
              data?.message ||
              `Salama request failed (${response.status}).`
            )
      );

      error.status =
        response.status === 401 || response.status === 403
          ? 502
          : response.status;

      error.upstreamStatus = response.status;

      throw error;
    }

    return data;

  } catch (error) {
    if (error.name === 'AbortError') {
      const timeoutError = new Error(
        'Salama did not respond in time. Please try again later.'
      );

      timeoutError.status = 504;
      throw timeoutError;
    }

    if (error.status) {
      throw error;
    }

    const networkError = new Error(
      'Could not connect to Salama. Check that its API is running and reachable.'
    );

    networkError.status = 502;

    throw networkError;

  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  salamaRequest
};