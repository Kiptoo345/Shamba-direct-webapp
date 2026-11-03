const express = require('express');

const {
  salamaRequest
} = require('../services/salamaClient');

const router = express.Router();

const ALLOWED_RESOURCE_TYPES = new Set([
  'hotline',
  'shelter',
  'legal',
  'medical',
  'mental-health'
]);

function sendIntegrationError(res, error) {
  const status = Number.isInteger(error.status)
    ? error.status
    : 502;

  // Never expose upstream stack traces or credentials.
  return res.status(status).json({
    error: error.message || 'Salama service is unavailable.'
  });
}


// ==========================================
// GET SUPPORT RESOURCES
// GET /api/salama/resources?county=nairobi&type=legal
// ==========================================

router.get('/resources', async (req, res) => {
  try {
    const params = new URLSearchParams();

    if (
      typeof req.query.county === 'string' &&
      req.query.county.trim()
    ) {
      params.set(
        'county',
        req.query.county.trim()
      );
    }

    if (
      typeof req.query.type === 'string' &&
      req.query.type.trim()
    ) {
      const type = req.query.type.trim();

      if (!ALLOWED_RESOURCE_TYPES.has(type)) {
        return res.status(400).json({
          error: `type must be one of: ${
            Array.from(ALLOWED_RESOURCE_TYPES).join(', ')
          }`
        });
      }

      params.set('type', type);
    }

    const query = params.toString();

    const resources = await salamaRequest(
      `/resources${query ? `?${query}` : ''}`
    );

    if (!Array.isArray(resources)) {
      return res.status(502).json({
        error: 'Salama returned an unexpected resources response.'
      });
    }

    // Only expose the fields Shamba Direct needs.
    const safeResources = resources.map((item) => ({
      id: item.id,
      name: item.name,
      type: item.type,
      county: item.county,
      description: item.description,
      contact: item.contact,
      available: item.available
    }));

    return res.status(200).json(safeResources);

  } catch (error) {
    return sendIntegrationError(res, error);
  }
});


// ==========================================
// SUBMIT ECONOMIC ABUSE REPORT
// POST /api/salama/incidents
// ==========================================

router.post('/incidents', async (req, res) => {
  const {
    incident_date,
    county,
    location,
    description,
    is_anonymous = true
  } = req.body || {};

  if (!incident_date || !county || !description) {
    return res.status(400).json({
      error: 'incident_date, county, and description are required.'
    });
  }

  if (
    typeof incident_date !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(incident_date)
  ) {
    return res.status(400).json({
      error: 'incident_date must use YYYY-MM-DD format.'
    });
  }

  if (
    typeof county !== 'string' ||
    !county.trim()
  ) {
    return res.status(400).json({
      error: 'county must be a non-empty string.'
    });
  }

  if (
    typeof description !== 'string' ||
    description.trim().length < 10
  ) {
    return res.status(400).json({
      error: 'Please provide a description of at least 10 characters.'
    });
  }

  if (typeof is_anonymous !== 'boolean') {
    return res.status(400).json({
      error: 'is_anonymous must be a boolean.'
    });
  }

  if (
    location !== undefined &&
    typeof location !== 'string'
  ) {
    return res.status(400).json({
      error: 'location must be a string when provided.'
    });
  }

  try {
    const created = await salamaRequest(
      '/incidents',
      {
        method: 'POST',
        requireKey: true,

        body: {
          incident_type: 'economic',
          incident_date,
          county: county.trim().toLowerCase(),
          location: location?.trim() || undefined,
          description: description.trim(),
          is_anonymous
        }
      }
    );

    // Do not return the submitted narrative to the browser.
    return res.status(201).json({
      message: 'Your report was submitted to Salama.',
      id: created?.id,
      case_ref: created?.case_ref,
      incident_type: created?.incident_type || 'economic',
      status: created?.status || 'open',
      is_anonymous:
        created?.is_anonymous ?? is_anonymous
    });

  } catch (error) {
    return sendIntegrationError(res, error);
  }
});

module.exports = router;