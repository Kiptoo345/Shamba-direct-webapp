const express = require('express');
const db = require('../db');

const router = express.Router();
const MAX_DESCRIPTION_LENGTH = 5000;

function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime())
    && date.toISOString().slice(0, 10) === value;
}

router.post('/economic-exploitation', async (req, res) => {
  const {
    incident_date: incidentDate,
    county,
    location,
    description
  } = req.body || {};

  if (!isValidDate(incidentDate)) {
    return res.status(400).json({
      error: 'incident_date must be a valid date in YYYY-MM-DD format.'
    });
  }

  if (typeof county !== 'string' || !county.trim() || county.trim().length > 100) {
    return res.status(400).json({
      error: 'county must be a non-empty string of at most 100 characters.'
    });
  }

  if (location !== undefined && location !== null && typeof location !== 'string') {
    return res.status(400).json({
      error: 'location must be a string when provided.'
    });
  }

  if (typeof location === 'string' && location.trim().length > 255) {
    return res.status(400).json({
      error: 'location must be at most 255 characters.'
    });
  }

  if (
    typeof description !== 'string'
    || description.trim().length < 10
    || description.trim().length > MAX_DESCRIPTION_LENGTH
  ) {
    return res.status(400).json({
      error: `description must be between 10 and ${MAX_DESCRIPTION_LENGTH} characters.`
    });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO economic_exploitation_reports
       (incident_date, county, location, description, is_anonymous)
       VALUES (?, ?, ?, ?, 1)`,
      [
        incidentDate,
        county.trim().toLowerCase(),
        typeof location === 'string' ? location.trim() || null : null,
        description.trim()
      ]
    );

    return res.status(201).json({
      message: 'Your confidential report was recorded.',
      id: result.insertId,
      case_ref: `SD-EXP-${String(result.insertId).padStart(6, '0')}`,
      is_anonymous: true
    });
  } catch (error) {
    console.error('Error recording economic exploitation report:', error);
    return res.status(500).json({
      error: 'Failed to record confidential report.'
    });
  }
});

module.exports = router;
