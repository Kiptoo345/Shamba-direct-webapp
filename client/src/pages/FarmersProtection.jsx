
import React, { useEffect, useState } from 'react';
import {
  getSalamaResources,
  submitConsumerProtectionReport
} from '../api/salama';

import '../styles/farmers-protection.css';

const COUNTIES = [
  'nairobi',
  'kiambu',
  'machakos',
  'kajiado',
  'nakuru',
  'kisumu',
  'mombasa',
  'uasin-gishu',
  'meru',
  'kakamega'
];

function formatCountyName(county) {
  return county.replace(/-/g, ' ').replace(
    /\b\w/g,
    (letter) => letter.toUpperCase()
  );
}

function FarmersProtection() {
  const [county, setCounty] = useState('nairobi');
  const [type, setType] = useState('');
  const [resources, setResources] = useState([]);
  const [resourceLoading, setResourceLoading] = useState(false);
  const [resourceError, setResourceError] = useState('');
  const [resourceStatus, setResourceStatus] = useState('checking');
  const [resourceRefresh, setResourceRefresh] = useState(0);

  const [consumerCategory, setConsumerCategory] = useState(
    'misleading_listing'
  );
  const [consumerCounty, setConsumerCounty] = useState('nairobi');
  const [consumerOrderReference, setConsumerOrderReference] = useState('');
  const [consumerDescription, setConsumerDescription] = useState('');
  const [consumerSubmitting, setConsumerSubmitting] = useState(false);
  const [consumerReportResult, setConsumerReportResult] = useState(null);
  const [consumerReportError, setConsumerReportError] = useState('');

  const [resourceSource, setResourceSource] = useState('live');
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  useEffect(() => {
    let active = true;

    setResourceLoading(true);
    setResourceError('');
    setResourceStatus('checking');

    getSalamaResources({ county, type })
      .then((result) => {
        if (!Array.isArray(result.resources)) {
          throw new Error('Invalid support resources response.');
        }

        if (active) {
          setResources(result.resources);
          setResourceSource(result.source || 'live');
          setLastSyncedAt(result.lastSyncedAt || null);
          setResourceStatus('online');
        }
      })
      .catch((error) => {
        if (active) {
          console.error('Salama resources error:', error.message);
          setResources([]);
          setResourceStatus('offline');
          setResourceError(
            'Support services are unavailable. Please try again later.'
          );
        }
      })
      .finally(() => {
        if (active) {
          setResourceLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [county, type, resourceRefresh]);

  async function handleConsumerReportSubmit(event) {
    event.preventDefault();

    setConsumerSubmitting(true);
    setConsumerReportError('');
    setConsumerReportResult(null);

    try {
      const result = await submitConsumerProtectionReport({
        category: consumerCategory,
        county: consumerCounty,
        order_reference: consumerOrderReference,
        description: consumerDescription
      });

      setConsumerReportResult(result);
      setConsumerCategory('misleading_listing');
      setConsumerOrderReference('');
      setConsumerDescription('');
    } catch (error) {
      setConsumerReportError(error.message);
    } finally {
      setConsumerSubmitting(false);
    }
  }

  const getResourceContact = (resource) => {
    const contact = typeof resource.contact === 'string'
      ? resource.contact.trim()
      : '';
    const emailValue = resource.email || (
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) ? contact : ''
    );
    const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)
      ? emailValue
      : '';
    const phoneValue = resource.phone || (
      contact && !contact.includes('@') && !/^https?:\/\//i.test(contact)
        ? contact
        : ''
    );
    const normalizedPhone = String(phoneValue).replace(/[^\d+]/g, '');
    const website = resource.website || resource.url || (
      /^https?:\/\//i.test(contact) ? contact : ''
    );

    if (email) {
      return {
        href: `mailto:${email}`,
        type: 'email',
        label: email
      };
    }

    if (normalizedPhone) {
      return {
        href: `tel:${normalizedPhone}`,
        type: 'phone',
        label: phoneValue
      };
    }

    if (/^https?:\/\//i.test(website)) {
      return {
        href: website,
        type: 'website',
        label: website
      };
    }

    return null;
  };

  return (
    <main className="farmers-protection-page">

{/* =====================================================
    COMMUNITY SAFETY & CONSUMER PROTECTION HUB
===================================================== */}

<section className="consumer-hub" id="consumer-protection">

  <div className="consumer-hub-hero">

    <span className="consumer-hub-eyebrow">
      SHAMBA DIRECT COMMUNITY PROTECTION
    </span>

    <h2>
      Shop confidently. Know your rights. Stay protected.
    </h2>

    <p>
      Access community support services, learn how to
      purchase agricultural produce safely and report
      problems with marketplace transactions.
    </p>

    <div className="consumer-hub-status">

      <span className={
        resourceStatus === 'offline'
          ? 'hub-status offline'
          : 'hub-status online'
      }>
        {resourceStatus === 'checking'
          ? 'Checking services...'
          : resourceStatus === 'offline'
            ? 'Services unavailable'
            : resourceSource === 'cache'
              ? 'Using saved support information'
              : 'Support information synchronized'}
      </span>

      {lastSyncedAt && (
        <small>
          Last synchronization: {
            new Date(lastSyncedAt).toLocaleString()
          }
        </small>
      )}

    </div>

  </div>


  {/* CONSUMER GUIDANCE */}

  <div className="consumer-guidance">

    <div className="hub-section-heading">
      <span>01</span>

      <div>
        <h3>Shop safely on Shamba Direct</h3>

        <p>
          Follow these steps before completing a purchase.
        </p>
      </div>
    </div>

    <div className="consumer-guidance-grid">

      <article className="consumer-guidance-card">
        <span>01</span>

        <h4>Check the farmer</h4>

        <p>
          Review the seller's profile and available
          verification status before ordering.
        </p>
      </article>

      <article className="consumer-guidance-card">
        <span>02</span>

        <h4>Understand the price</h4>

        <p>
          Confirm the quantity, price per kilogram,
          total amount and any delivery charges.
        </p>
      </article>

      <article className="consumer-guidance-card">
        <span>03</span>

        <h4>Inspect your produce</h4>

        <p>
          Check the quantity, freshness and condition
          of produce when receiving your order.
        </p>
      </article>

      <article className="consumer-guidance-card">
        <span>04</span>

        <h4>Keep transaction records</h4>

        <p>
          Retain order references and payment
          confirmations in case a dispute occurs.
        </p>
      </article>

    </div>
  </div>

  {/* CONSUMER PROTECTION REPORTING */}

  <div className="consumer-report-panel" id="consumer-reporting">

    <div className="hub-section-heading">
      <span>02</span>

      <div>
        <h3>Report a marketplace concern</h3>

        <p>
          Help us identify problems and improve
          the safety of transactions on Shamba Direct.
        </p>
      </div>
    </div>

    <div className="consumer-report-information">

      <strong>
        What can you report?
      </strong>

      <p>
        Misleading product listings, payment disputes,
        produce quality concerns, delivery problems
        and harassment.
      </p>

      <p>
        Reports are stored securely in Shamba Direct
        for administrative review.
      </p>

    </div>

    <form
      className="consumer-report-form"
      onSubmit={handleConsumerReportSubmit}
    >
      <label>
        Type of concern
        <select
          value={consumerCategory}
          onChange={(event) => setConsumerCategory(event.target.value)}
          required
        >
          <option value="misleading_listing">Misleading product listing</option>
          <option value="payment_dispute">Payment dispute</option>
          <option value="produce_quality">Produce quality concern</option>
          <option value="delivery_issue">Delivery problem</option>
          <option value="harassment">Harassment or intimidation</option>
          <option value="other">Other concern</option>
        </select>
      </label>

      <label>
        County
        <select
          value={consumerCounty}
          onChange={(event) => setConsumerCounty(event.target.value)}
          required
        >
          {COUNTIES.map((item) => (
            <option key={item} value={item}>
              {formatCountyName(item)}
            </option>
          ))}
        </select>
      </label>

      <label>
        Order reference (optional)
        <input
          type="text"
          value={consumerOrderReference}
          onChange={(event) => setConsumerOrderReference(event.target.value)}
          maxLength={50}
          placeholder="Enter your order reference"
        />
      </label>

      <label>
        Explain what happened
        <textarea
          value={consumerDescription}
          onChange={(event) => setConsumerDescription(event.target.value)}
          minLength={10}
          maxLength={3000}
          rows={5}
          required
          placeholder="Describe the problem and provide relevant details..."
        />
      </label>

      {consumerReportError && (
        <div className="hub-error" role="alert">
          {consumerReportError}
        </div>
      )}

      {consumerReportResult && (
        <div className="hub-report-success" role="status">
          <strong>Your report was received successfully.</strong>
          <p>
            Reference number:
            <strong> {consumerReportResult.case_ref}</strong>
          </p>
          <p>Keep this reference number for future follow-up.</p>
        </div>
      )}

      <button
        type="submit"
        disabled={consumerSubmitting}
        className="consumer-report-submit"
      >
        {consumerSubmitting
          ? 'Submitting report...'
          : 'Submit protection report'}
      </button>
    </form>

    <p className="consumer-report-disclaimer">
      Reports are confidential but are not an emergency
      response service. If you are in immediate danger,
      contact an appropriate emergency or protection service.
    </p>

  </div>


  {/* SALAMA SUPPORT DIRECTORY */}

  <div className="consumer-directory">

    <div className="hub-section-heading">
      <span>03</span>

      <div>
        <h3>Find community support</h3>

        <p>
          Support and referral organizations provided
          through our Salama integration.
        </p>
      </div>
    </div>

    <div className="consumer-directory-filters">

      <label>
        Select your county

        <select
          value={county}
          onChange={(event) => setCounty(event.target.value)}
        >
          {COUNTIES.map((item) => (
            <option key={item} value={item}>
              {formatCountyName(item)}
            </option>
          ))}
        </select>
      </label>

      <label>
        Support category

        <select
          value={type}
          onChange={(event) => setType(event.target.value)}
        >
          <option value="">All services</option>
          <option value="hotline">Hotline</option>
          <option value="legal">Legal assistance</option>
          <option value="medical">Medical support</option>
          <option value="mental-health">Mental health</option>
          <option value="shelter">Shelter</option>
        </select>
      </label>

      <button
        type="button"
        className="hub-refresh-button"
        disabled={resourceLoading}
        onClick={() => setResourceRefresh(
          (value) => value + 1
        )}
      >
        {resourceLoading ? 'Synchronizing...' : 'Refresh services'}
      </button>

    </div>


    {resourceLoading && (
      <div className="hub-loading">
        Loading community support services...
      </div>
    )}

    {resourceStatus === 'offline' && (
      <div className="hub-error" role="alert">
        {resourceError}
      </div>
    )}

    {!resourceLoading && resourceStatus === 'online' && (

      <>

        <div className="consumer-directory-summary">
          <strong>
            {resources.length} support services found
          </strong>

          <span>
            {resourceSource === 'cache'
              ? 'Showing previously synchronized information'
              : 'Information received from Salama'}
          </span>
        </div>

        {resources.length === 0 && (
          <div className="hub-empty">
            No support services were found for
            this county and category.
          </div>
        )}

        <div className="consumer-resource-grid">

          {resources.map((resource) => {

            const contact = getResourceContact(resource);

            return (

              <article
                className="consumer-resource-card"
                key={resource.id}
              >

                <div className="resource-card-top">

                  <span className="resource-type">
                    {resource.type.replace(/-/g, ' ')}
                  </span>

                  <span className="resource-available">
                    {resource.available}
                  </span>

                </div>

                <h4>{resource.name}</h4>

                <p>
                  {resource.description}
                </p>

                <div className="resource-location">
                  <span>Location</span>

                  <strong>
                    {resource.county}
                  </strong>
                </div>

                <div className="resource-contact">

                  {contact ? (

                    <a
                      href={contact.href}
                      target={
                        contact.type === 'website'
                          ? '_blank'
                          : undefined
                      }
                      rel={
                        contact.type === 'website'
                          ? 'noopener noreferrer'
                          : undefined
                      }
                    >
                      {contact.label}
                    </a>

                  ) : (

                    <span>
                      Contact details unavailable
                    </span>

                  )}

                </div>

                <small className="resource-source-note">
                  Source: Salama
                </small>

              </article>

            );

          })}

        </div>

      </>

    )}

  </div>


</section>




    </main>
  );
}

export default FarmersProtection;
