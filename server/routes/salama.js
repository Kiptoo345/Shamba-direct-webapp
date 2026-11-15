
const express = require('express');
const db = require('../db');

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

const ALLOWED_REPORT_CATEGORIES = new Set([
  'misleading_listing',
  'payment_dispute',
  'produce_quality',
  'delivery_issue',
  'harassment',
  'other'
]);

// Convert Salama's resource date into a valid MySQL date.
function parseSourceDate(value) {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date;
}

// Synchronize Salama resources into Shamba Direct.
async function synchronizeResources() {
  const resources = await salamaRequest('/resources');

  if (!Array.isArray(resources)) {
    throw new Error('Salama returned an invalid resource list.');
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Mark previous resources inactive before the new sync.
    await connection.query(
      'UPDATE salama_resources SET is_active = 0'
    );

    for (const item of resources) {
      if (
        item.id === undefined ||
        item.id === null ||
        !item.name ||
        !ALLOWED_RESOURCE_TYPES.has(item.type)
      ) {
        continue;
      }

      await connection.query(
        `INSERT INTO salama_resources (
          salama_resource_id,
          name,
          type,
          county,
          description,
          contact,
          available,
          source_created_at,
          last_synced_at,
          is_active
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 1)

        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          type = VALUES(type),
          county = VALUES(county),
          description = VALUES(description),
          contact = VALUES(contact),
          available = VALUES(available),
          source_created_at = VALUES(source_created_at),
          last_synced_at = CURRENT_TIMESTAMP,
          is_active = 1`,
        [
          String(item.id),
          String(item.name).trim(),
          item.type,
          String(item.county || 'all').trim(),
          String(item.description || ''),
          String(item.contact || 'Not provided'),
          String(item.available || 'Not specified'),
          parseSourceDate(item.created_at)
        ]
      );
    }

    await connection.commit();

  } catch (error) {
    await connection.rollback();
    throw error;

  } finally {
    connection.release();
  }
}

// Read resources from Shamba Direct's own database.
async function readStoredResources(county, type) {
  const [rows] = await db.query(
    `SELECT
      id,
      salama_resource_id,
      name,
      type,
      county,
      description,
      contact,
      available,
      source_created_at,
      last_synced_at
    FROM salama_resources
    WHERE is_active = 1
      AND (? IS NULL OR county = ? OR county = 'all')
      AND (? IS NULL OR type = ?)
    ORDER BY name ASC`,
    [
      county,
      county,
      type,
      type
    ]
  );

  return rows;
}


// Avoid contacting Salama for every filter change.
// Resources are refreshed at most once every 15 minutes.
async function shouldSynchronizeResources() {
  const [rows] = await db.query(
    `SELECT MAX(last_synced_at) AS last_synced_at
     FROM salama_resources`
  );

  const lastSync = rows[0].last_synced_at;

  if (!lastSync) return true;

  const elapsed = Date.now() - new Date(lastSync).getTime();

  return elapsed >= 15 * 60 * 1000;
}


// ======================================================
// GET SUPPORT RESOURCES
// GET /api/salama/resources?county=nairobi&type=legal
// ======================================================

router.get('/resources', async (req, res) => {
  const county = typeof req.query.county === 'string'
    && req.query.county.trim()
    ? req.query.county.trim()
    : null;

  const type = typeof req.query.type === 'string'
    && req.query.type.trim()
    ? req.query.type.trim()
    : null;

  if (county && county.length > 100) {
    return res.status(400).json({
      error: 'County must not exceed 100 characters.'
    });
  }

  if (type && !ALLOWED_RESOURCE_TYPES.has(type)) {
    return res.status(400).json({
      error: 'Invalid support resource category.'
    });
  }

  let source = 'cache';

  try {
    if (await shouldSynchronizeResources()) {
      await synchronizeResources();
      source = 'live';
    }

  } catch (error) {
    console.error(
      'Salama synchronization failed:',
      error.message
    );

    source = 'cache';
  }

  try {
    const resources = await readStoredResources(
      county,
      type
    );

    const [metadata] = await db.query(
      `SELECT MAX(last_synced_at) AS last_synced_at
       FROM salama_resources`
    );

    // If Salama failed and there is no cached data,
    // report an integration error.
    if (source === 'cache' && !metadata[0].last_synced_at) {
      return res.status(502).json({
        error: 'Salama is unavailable and no cached resources exist.',
        resources: []
      });
    }

    return res.status(200).json({
      resources,
      source,
      lastSyncedAt: metadata[0].last_synced_at
    });

  } catch (error) {
    console.error(
      'Failed to retrieve stored resources:',
      error.message
    );

    return res.status(500).json({
      error: 'Could not retrieve support resources.'
    });
  }
});


// ======================================================
// POST CONSUMER PROTECTION REPORT
// POST /api/salama/consumer-reports
// ======================================================

router.post('/consumer-reports', async (req, res) => {
  const {
    category,
    county,
    order_reference,
    description
  } = req.body;

  if (!ALLOWED_REPORT_CATEGORIES.has(category)) {
    return res.status(400).json({
      error: 'Please select a valid report category.'
    });
  }

  if (
    typeof county !== 'string' ||
    !county.trim() ||
    county.trim().length > 100
  ) {
    return res.status(400).json({
      error: 'A valid county is required.'
    });
  }

  if (
    typeof description !== 'string' ||
    description.trim().length < 10 ||
    description.trim().length > 3000
  ) {
    return res.status(400).json({
      error: 'Description must contain between 10 and 3000 characters.'
    });
  }

  if (
    order_reference !== undefined &&
    order_reference !== null &&
    (
      typeof order_reference !== 'string' ||
      order_reference.trim().length > 50
    )
  ) {
    return res.status(400).json({
      error: 'Order reference must not exceed 50 characters.'
    });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO consumer_protection_reports (
        category,
        county,
        order_reference,
        description,
        is_anonymous
      )
      VALUES (?, ?, ?, ?, 1)`,
      [
        category,
        county.trim(),
        order_reference ? order_reference.trim() : null,
        description.trim()
      ]
    );

    const caseRef = `SD-CP-${new Date().getFullYear()}-${String(
      result.insertId
    ).padStart(6, '0')}`;

    await db.query(
      `UPDATE consumer_protection_reports
       SET case_ref = ?
       WHERE id = ?`,
      [caseRef, result.insertId]
    );

    return res.status(201).json({
      message: 'Your protection report was submitted successfully.',
      case_ref: caseRef,
      status: 'received'
    });

  } catch (error) {
    console.error(
      'Consumer protection report error:',
      error.message
    );

    return res.status(500).json({
      error: 'Unable to submit your report. Please try again.'
    });
  }
});

module.exports = router;
