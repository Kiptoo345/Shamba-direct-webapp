import React, {
  useEffect,
  useState
} from 'react';

import {
  getSalamaResources,
  submitEconomicAbuseReport
} from '../api/salama';

import '../styles/safety-support.css';


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


function SafetySupport() {

  // Support directory state
  const [county, setCounty] = useState('nairobi');
  const [type, setType] = useState('');

  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resourceError, setResourceError] = useState('');


  // Incident reporting state
  const [incidentDate, setIncidentDate] = useState('');
  const [incidentCounty, setIncidentCounty] = useState('nairobi');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [anonymous, setAnonymous] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [reportResult, setReportResult] = useState(null);
  const [reportError, setReportError] = useState(null);


  // Load resources whenever filters change.
  useEffect(() => {

    let active = true;

    setLoading(true);
    setResourceError('');

    getSalamaResources({
      county,
      type
    })

      .then((data) => {
        if (active) {
          setResources(data);
        }
      })

      .catch((error) => {
        if (active) {
          setResourceError(error.message);
        }
      })

      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };

  }, [county, type]);


  // Submit economic-abuse report.
  async function handleReportSubmit(event) {

    event.preventDefault();

    setSubmitting(true);
    setReportError('');
    setReportResult(null);

    try {

      const result = await submitEconomicAbuseReport({

        incident_date: incidentDate,

        county: incidentCounty,

        location,

        description,

        is_anonymous: anonymous

      });

      setReportResult(result);

      // Clear form after successful submission.
      setIncidentDate('');
      setLocation('');
      setDescription('');
      setAnonymous(true);

    } catch (error) {

      setReportError(error.message);

    } finally {

      setSubmitting(false);

    }
  }


  return (

    <main className="safety-page">

      {/* HERO SECTION */}

      <header className="safety-hero">

        <p className="safety-eyebrow">
          FARMER SAFETY & SUPPORT
        </p>

        <h1>
          Support when you need it
        </h1>

        <p>
          Find support organisations by county,
          or submit an economic-abuse report to Salama.
        </p>

      </header>


      {/* SUPPORT DIRECTORY */}

      <section className="safety-section">

        <div className="safety-section-heading">

          <div>

            <p className="safety-eyebrow">
              SALAMA SUPPORT DIRECTORY
            </p>

            <h2>
              Support services near you
            </h2>

          </div>


          <div className="safety-filters">

            <label>

              County

              <select
                value={county}
                onChange={(event) =>
                  setCounty(event.target.value)
                }
              >

                {COUNTIES.map((item) => (

                  <option
                    key={item}
                    value={item}
                  >
                    {item.replace(/-/g, ' ')}
                  </option>

                ))}

              </select>

            </label>


            <label>

              Service type

              <select
                value={type}
                onChange={(event) =>
                  setType(event.target.value)
                }
              >

                <option value="">
                  All services
                </option>

                <option value="hotline">
                  Hotline
                </option>

                <option value="shelter">
                  Shelter
                </option>

                <option value="legal">
                  Legal aid
                </option>

                <option value="medical">
                  Medical
                </option>

                <option value="mental-health">
                  Mental health
                </option>

              </select>

            </label>

          </div>

        </div>


        {/* Loading */}

        {loading && (

          <p className="safety-state">
            Loading support services…
          </p>

        )}


        {/* Error */}

        {resourceError && (

          <p className="safety-error">
            {resourceError}
          </p>

        )}


        {/* Empty results */}

        {!loading &&
          !resourceError &&
          resources.length === 0 && (

            <p className="safety-state">
              No services were returned for these filters.
            </p>

          )}


        {/* Resource cards */}

        <div className="safety-resource-grid">

          {resources.map((resource) => (

            <article
              className="safety-resource-card"
              key={resource.id}
            >

              <span className="safety-resource-type">

                {(resource.type || 'support').replace('-', ' ')}

              </span>


              <h3>
                {resource.name}
              </h3>


              <p>
                {resource.description}
              </p>


              <p>
                <strong>County:</strong> {resource.county}
              </p>


              <p>
                <strong>Availability:</strong>{' '}
                {resource.available || 'Contact provider to confirm'}
              </p>


              {resource.contact && (

                <p>
                  <strong>Contact:</strong> {resource.contact}
                </p>

              )}

            </article>

          ))}

        </div>

      </section>


      {/* ECONOMIC ABUSE REPORTING */}

      <section className="safety-section safety-report-section">

        <p className="safety-eyebrow">
          CONFIDENTIAL REPORTING
        </p>


        <h2>
          Report economic abuse
        </h2>


        <p className="safety-intro">

          This form sends an economic-abuse incident report
          to Salama. Share only information needed to describe
          what happened. Do not include passwords, PINs or
          bank credentials.

        </p>


        <form
          className="safety-report-form"
          onSubmit={handleReportSubmit}
        >

          {/* Date */}

          <label>

            Date of incident

            <input
              type="date"
              value={incidentDate}
              onChange={(event) =>
                setIncidentDate(event.target.value)
              }
              required
            />

          </label>


          {/* County */}

          <label>

            County

            <select
              value={incidentCounty}
              onChange={(event) =>
                setIncidentCounty(event.target.value)
              }
            >

              {COUNTIES.map((item) => (

                <option
                  key={item}
                  value={item}
                >
                  {item.replace(/-/g, ' ')}
                </option>

              ))}

            </select>

          </label>


          {/* Location */}

          <label className="safety-full">

            General location (optional)

            <input
              value={location}
              onChange={(event) =>
                setLocation(event.target.value)
              }
              placeholder="e.g. market centre or sub-county"
            />

          </label>


          {/* Description */}

          <label className="safety-full">

            What happened?

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              minLength={10}
              rows={5}
              required
            />

          </label>


          {/* Anonymous option */}

          <label className="safety-check safety-full">

            <input
              type="checkbox"
              checked={anonymous}
              onChange={(event) =>
                setAnonymous(event.target.checked)
              }
            />

            Submit anonymously

          </label>


          {/* Submit */}

          <button
            className="safety-submit"
            type="submit"
            disabled={submitting}
          >

            {submitting
              ? 'Submitting…'
              : 'Submit report to Salama'}

          </button>

        </form>


        {/* Report error */}

        {reportError && (

          <p
            className="safety-error"
            role="alert"
          >
            {reportError}
          </p>

        )}


        {/* Successful submission */}

        {reportResult && (

          <div
            className="safety-success"
            role="status"
          >

            <strong>
              {reportResult.message}
            </strong>


            {reportResult.case_ref && (

              <p>
                Reference: {reportResult.case_ref}
              </p>

            )}


            <p>
              Keep this reference if one was provided.
              Shamba Direct does not monitor Salama reports.
            </p>

          </div>

        )}


        {/* Disclaimer */}

        <p className="safety-disclaimer">

          Salama is an external support and reporting service.
          This page is not an emergency response channel.
          Confirm service contacts and availability directly
          with the provider.

        </p>

      </section>

    </main>

  );

}


export default SafetySupport;