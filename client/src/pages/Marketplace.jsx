import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, createEnquiry, createOrder } from '../api/api';
import { useAuth } from '../context/AuthContext';
import '../styles/shared.css';
import '../styles/marketplace.css';

const COUNTIES = ['Nairobi', 'Kirinyaga', 'Uasin Gishu', 'Nakuru', 'Meru', 'Kajiado', 'Nyandarua'];

function Marketplace() {
  const { user, isLoggedIn } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [countyFilter, setCountyFilter] = useState('All');
  const [minQuantity, setMinQuantity] = useState('Any');
  const [sortBy, setSortBy] = useState('newest');

  const [enquiryTarget, setEnquiryTarget] = useState(null); // listing being contacted
  const [enquiryMessage, setEnquiryMessage] = useState('');
  const [enquiryStatus, setEnquiryStatus] = useState(null);

  const [orderTarget, setOrderTarget] = useState(null); // listing being ordered
  const [orderQuantity, setOrderQuantity] = useState('');
  const [orderStatus, setOrderStatus] = useState(null); // null | 'sending' | 'placed' | 'error: ...'
  const [loginPromptListing, setLoginPromptListing] = useState(null); // { listing, action } set when a guest clicks "Place Order" or "Contact Farmer"

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    getProducts({ status: 'active' })
      .then((data) => { if (!ignore) setListings(data); })
      .catch((err) => { if (!ignore) setError(err.message); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, []);

  const filtered = useMemo(() => {
    let result = [...listings];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((l) =>
        l.name.toLowerCase().includes(q) ||
        (l.farmer_name || '').toLowerCase().includes(q) ||
        (l.county || '').toLowerCase().includes(q)
      );
    }
    if (countyFilter !== 'All') {
      result = result.filter((l) => l.county === countyFilter);
    }
    if (minQuantity !== 'Any') {
      const threshold = parseInt(minQuantity, 10);
      result = result.filter((l) => Number(l.quantity_kg) >= threshold);
    }
    if (sortBy === 'price-asc') result.sort((a, b) => a.price_per_kg - b.price_per_kg);
    else if (sortBy === 'price-desc') result.sort((a, b) => b.price_per_kg - a.price_per_kg);
    else if (sortBy === 'quantity-desc') result.sort((a, b) => b.quantity_kg - a.quantity_kg);
    else result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return result;
  }, [listings, search, countyFilter, minQuantity, sortBy]);

  // Contacting a farmer, like placing an order, is only available to
  // logged-in accounts — guests are shown a prompt to log in / register
  // instead of the enquiry form.
  const openEnquiry = (listing) => {
    if (!isLoggedIn) {
      setLoginPromptListing({ listing, action: 'contact' });
      return;
    }
    setEnquiryTarget(listing);
    setEnquiryMessage(`Hi ${listing.farmer_name}, I'm interested in your ${listing.name} listing.`);
    setEnquiryStatus(null);
  };

  const submitEnquiry = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) return; // safety net — the form is only reachable when logged in
    setEnquiryStatus('sending');
    try {
      await createEnquiry({
        productId: enquiryTarget.id,
        buyerId: user.id,
        message: enquiryMessage
      });
      setEnquiryStatus('sent');
    } catch (err) {
      setEnquiryStatus(`error: ${err.message}`);
    }
  };

  // Ordering is only available to logged-in accounts — guests are shown a
  // prompt to log in / register instead of the order form.
  const openOrder = (listing) => {
    if (!isLoggedIn) {
      setLoginPromptListing({ listing, action: 'order' });
      return;
    }
    setOrderTarget(listing);
    setOrderQuantity('');
    setOrderStatus(null);
  };

  const submitOrder = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) return; // safety net — the form is only reachable when logged in
    setOrderStatus('sending');
    try {
      await createOrder({
        productId: orderTarget.id,
        buyerId: user.id,
        quantityKg: Number(orderQuantity)
      });
      setOrderStatus('placed');
    } catch (err) {
      setOrderStatus(`error: ${err.message}`);
    }
  };

  return (
    <>
      {/* MARKETPLACE HEADER */}
      <div className="mp-header">
        <div className="container">
          <h1>Kenya's Fresh Produce Marketplace</h1>
          <p>Browse verified listings from farmers across all 47 counties. Filter by crop, county, and quantity.</p>
          <div className="mp-search-bar">
            <input
              type="text"
              placeholder="Search by crop, county, or farmer name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="button" onClick={() => {}}>Search</button>
          </div>
        </div>
      </div>

      {/* MARKETPLACE LAYOUT */}
      <div className="mp-layout">
        {/* Filters Sidebar */}
        <aside className="mp-filters">
          <div className="filter-title">Filter Listings</div>
          <div className="filter-group">
            <div className="filter-group-title">County</div>
            <label className="filter-option">
              <input type="checkbox" checked={countyFilter === 'All'} onChange={() => setCountyFilter('All')} /> All Counties
            </label>
            {COUNTIES.map((c) => (
              <label className="filter-option" key={c}>
                <input type="checkbox" checked={countyFilter === c} onChange={() => setCountyFilter(c)} /> {c}
              </label>
            ))}
          </div>
          <div className="filter-group">
            <div className="filter-group-title">Min. Quantity (kg)</div>
            <select
              className="form-input form-select"
              style={{ marginBottom: 0 }}
              value={minQuantity}
              onChange={(e) => setMinQuantity(e.target.value)}
            >
              <option>Any</option>
              <option>50</option>
              <option>200</option>
              <option>500</option>
              <option>1000</option>
            </select>
          </div>
          <div className="filter-group">
            <div className="filter-group-title">Verified Only</div>
            <label className="filter-option"><input type="checkbox" checked readOnly /> ✅ Showing verified farmers only</label>
          </div>
        </aside>

        {/* Results */}
        <div>
          <div className="mp-results-header">
            <span className="mp-results-count">
              {loading ? 'Loading listings…' : `Showing ${filtered.length} listing${filtered.length === 1 ? '' : 's'} across Kenya`}
            </span>
            <select className="mp-sort" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="newest">Sort: Newest First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="quantity-desc">Quantity: Largest First</option>
            </select>
          </div>

          {error && <p style={{ color: 'crimson' }}>Couldn't load listings: {error}</p>}

          <div className="produce-grid">
            {filtered.map((listing) => (
              <div className="produce-card" key={listing.id}>
                <div className="produce-img">
                  <div className="produce-img-emoji">{listing.image_emoji || '🌾'}</div>
                  <span className="produce-badge">{listing.farmer_verified ? '✅ Verified' : 'Unverified'}</span>
                </div>
                <div className="produce-body">
                  <div className="produce-name">{listing.name}</div>
                  <div className="produce-farmer">👤 {listing.farmer_name}</div>
                  <div className="produce-meta">
                    <span className="produce-price">KES {Number(listing.price_per_kg).toLocaleString()}/kg</span>
                    <span className="produce-qty">{Number(listing.quantity_kg).toLocaleString()} kg</span>
                  </div>
                  <div className="produce-county">📍 {listing.county || 'Kenya'} {listing.harvest_note ? `• ${listing.harvest_note}` : ''}</div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <button className="produce-btn" style={{ flex: 1 }} onClick={() => openOrder(listing)}>
                      Place Order
                    </button>
                    <button className="produce-btn produce-btn-secondary" style={{ flex: 1 }} onClick={() => openEnquiry(listing)}>
                      Contact Farmer
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {!loading && filtered.length === 0 && !error && (
              <p>No listings match your filters yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* ENQUIRY MODAL (simple inline panel, no extra deps) */}
      {enquiryTarget && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
          }}
          onClick={() => setEnquiryTarget(null)}
        >
          <div
            className="reg-form"
            style={{ maxWidth: 420, width: '90%', padding: '2rem', background: '#fff', borderRadius: 'var(--radius)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '1rem' }}>
              Contact {enquiryTarget.farmer_name} about {enquiryTarget.name}
            </div>
            <form onSubmit={submitEnquiry}>
              <div className="form-group">
                <label className="form-label">Your Message</label>
                <textarea
                  className="form-input"
                  rows="4"
                  style={{ resize: 'vertical' }}
                  value={enquiryMessage}
                  onChange={(e) => setEnquiryMessage(e.target.value)}
                  required
                />
              </div>
              <button className="form-submit" type="submit" disabled={enquiryStatus === 'sending'}>
                {enquiryStatus === 'sending' ? 'Sending…' : 'Send Enquiry →'}
              </button>
              {enquiryStatus === 'sent' && <p style={{ color: 'var(--green)', marginTop: '0.75rem' }}>Enquiry sent! The farmer will be notified.</p>}
              {enquiryStatus && enquiryStatus.startsWith('error') && <p style={{ color: 'crimson', marginTop: '0.75rem' }}>{enquiryStatus.replace('error: ', '')}</p>}
            </form>
            <button
              type="button"
              onClick={() => setEnquiryTarget(null)}
              style={{ marginTop: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ORDER MODAL — only ever opened for a logged-in user (see openOrder) */}
      {orderTarget && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
          }}
          onClick={() => setOrderTarget(null)}
        >
          <div
            className="reg-form"
            style={{ maxWidth: 420, width: '90%', padding: '2rem', background: '#fff', borderRadius: 'var(--radius)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '1rem' }}>
              Order {orderTarget.name} from {orderTarget.farmer_name}
            </div>
            {orderStatus !== 'placed' && (
              <form onSubmit={submitOrder}>
                <div className="form-group">
                  <label className="form-label">
                    Quantity (kg) — {Number(orderTarget.quantity_kg).toLocaleString()} kg available
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    min="1"
                    max={orderTarget.quantity_kg}
                    step="0.01"
                    value={orderQuantity}
                    onChange={(e) => setOrderQuantity(e.target.value)}
                    required
                  />
                </div>
                {orderQuantity > 0 && (
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Estimated total: <strong>KES {(Number(orderQuantity) * Number(orderTarget.price_per_kg)).toLocaleString()}</strong>
                  </p>
                )}
                <button className="form-submit" type="submit" disabled={orderStatus === 'sending'}>
                  {orderStatus === 'sending' ? 'Placing order…' : 'Confirm Order →'}
                </button>
                {orderStatus && orderStatus.startsWith('error') && (
                  <p style={{ color: 'crimson', marginTop: '0.75rem' }}>{orderStatus.replace('error: ', '')}</p>
                )}
              </form>
            )}
            {orderStatus === 'placed' && (
              <p style={{ color: 'var(--green)', fontWeight: 700 }}>
                ✅ Order placed! You'll see it under "My Orders" on your dashboard, and {orderTarget.farmer_name} has been notified.
              </p>
            )}
            <button
              type="button"
              onClick={() => setOrderTarget(null)}
              style={{ marginTop: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              {orderStatus === 'placed' ? 'Close' : 'Cancel'}
            </button>
          </div>
        </div>
      )}

      {/* LOGIN-REQUIRED PROMPT — shown when a guest clicks "Place Order" or "Contact Farmer" */}
      {loginPromptListing && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
          }}
          onClick={() => setLoginPromptListing(null)}
        >
          <div
            className="reg-form"
            style={{ maxWidth: 400, width: '90%', padding: '2rem', background: '#fff', borderRadius: 'var(--radius)', textAlign: 'center' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔒</div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
              Please log in to {loginPromptListing.action === 'order' ? 'place an order' : 'contact this farmer'}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              You need an account to {loginPromptListing.action === 'order' ? 'order' : 'message'} {loginPromptListing.listing.name} from {loginPromptListing.listing.farmer_name}. It only takes a minute to sign in or register.
            </p>
            <Link className="form-submit" style={{ display: 'block', textAlign: 'center', marginBottom: '0.75rem' }} to="/dashboard">
              Log In →
            </Link>
            <Link
              className="produce-btn-secondary"
              style={{ display: 'block', textAlign: 'center', textDecoration: 'none', padding: '0.65rem', borderRadius: 8 }}
              to="/register"
            >
              Create a Free Account
            </Link>
            <button
              type="button"
              onClick={() => setLoginPromptListing(null)}
              style={{ marginTop: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Marketplace;
