// API versioning helpers.
//
//   /api/v1/...  the original response shape (deprecated, still works)
//   /api/...     legacy unversioned path, treated as v1 (deprecated)
//   /api/v2/...  new shape: { data, meta } on success, structured errors
//
// v1 keeps working until its sunset date. Every v1 response carries
// Deprecation, Sunset and Link headers so partners can detect the change
// from code, not just from an email.

const DEFAULT_DEPRECATION = '2026-11-11';
const DEFAULT_SUNSET = '2027-02-09'; // 90 days of notice

function parseDate(value, fallback) {
  const date = new Date(`${(value || fallback).trim()}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? new Date(`${fallback}T00:00:00Z`) : date;
}

// Read env on every request so tests (and operators) can change the dates.
function getConfig() {
  return {
    deprecatedAt: parseDate(process.env.V1_DEPRECATION_DATE, DEFAULT_DEPRECATION),
    sunsetAt: parseDate(process.env.V1_SUNSET_DATE, DEFAULT_SUNSET),
    migrationUrl: (process.env.V1_MIGRATION_URL || '').trim()
  };
}

// Adds deprecation headers to a v1 (or legacy unversioned) response.
function deprecateV1(req, res, next) {
  const { deprecatedAt, sunsetAt, migrationUrl } = getConfig();
  const unversionedPath = req.path.replace(/^\/v1(?=\/|$)/, '');

  // RFC 9745: Deprecation is a structured date, "@<unix seconds>".
  res.set('Deprecation', `@${Math.floor(deprecatedAt.getTime() / 1000)}`);
  // RFC 8594: Sunset is an HTTP-date.
  res.set('Sunset', sunsetAt.toUTCString());

  const links = [`</api/v2${unversionedPath}>; rel="successor-version"`];
  if (migrationUrl) links.push(`<${migrationUrl}>; rel="deprecation"`);
  res.set('Link', links.join(', '));
  res.set('API-Version', '1');
  next();
}

// v2 response shape. Wraps res.json so every v2 route gets it without
// touching the route handlers.
function v2Envelope(req, res, next) {
  const send = res.json.bind(res);
  res.set('API-Version', '2');

  res.json = (body) => {
    if (res.statusCode >= 400) {
      const { error, ...extra } = body && typeof body === 'object' ? body : {};
      return send({
        error: {
          status: res.statusCode,
          message: typeof error === 'string' ? error : 'Request failed',
          ...extra // keeps fields such as retryAfter
        }
      });
    }

    const meta = { apiVersion: 'v2' };
    if (Array.isArray(body)) meta.count = body.length;
    return send({ data: body, meta });
  };

  next();
}

module.exports = { deprecateV1, v2Envelope };
