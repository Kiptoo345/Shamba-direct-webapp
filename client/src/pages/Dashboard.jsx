import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  loginUser, getProducts, createProduct, updateProduct, deleteProduct,
  getOrders, updateOrderStatus, getRatings, createRating
} from '../api/api';
import { useAuth } from '../context/AuthContext';
import '../styles/shared.css';
import '../styles/dashboard.css';

const EMPTY_LISTING = { name: '', category: '', pricePerKg: '', quantityKg: '', county: '', harvestNote: '' };

function LoginForm({ onLoggedIn }) {
  const [form, setForm] = useState({ phoneNumber: '', password: '' });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const { user } = await loginUser(form);
      onLoggedIn(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="reg-page">
      <div className="reg-container" style={{ maxWidth: 460 }}>
        <div className="reg-header">
          <div className="section-label">Welcome Back</div>
          <h2 className="section-title">Sign In to Your Dashboard</h2>
        </div>
        {error && <p style={{ color: 'crimson', textAlign: 'center' }}>{error}</p>}
        <form className="reg-form" onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              type="tel" className="form-input" placeholder="0712 345 678"
              value={form.phoneNumber}
              onChange={(e) => setForm((p) => ({ ...p, phoneNumber: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password" className="form-input" placeholder="Your password"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              required
            />
          </div>
          <button className="form-submit" type="submit" style={{ display: 'block', width: '100%', textAlign: 'center' }} disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--green)', fontWeight: 700 }}>Register free →</Link>
        </p>
      </div>
    </div>
  );
}

function FarmerDashboard({ user, onLogout }) {
  const [listings, setListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [rating, setRating] = useState({ averageRating: 0, reviewCount: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newListing, setNewListing] = useState(EMPTY_LISTING);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [listingData, orderData, ratingData] = await Promise.all([
        getProducts({ farmerId: user.id }),
        getOrders({ farmerId: user.id }),
        getRatings({ farmerId: user.id })
      ]);
      setListings(listingData);
      setOrders(orderData);
      setRating(ratingData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadAll(); }, [user.id]);

  const submitListing = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        farmerId: user.id,
        name: newListing.name,
        category: newListing.category,
        pricePerKg: Number(newListing.pricePerKg),
        quantityKg: Number(newListing.quantityKg),
        county: newListing.county,
        harvestNote: newListing.harvestNote,
        status: 'active'
      };
      if (editingId) {
        await updateProduct(editingId, payload);
      } else {
        await createProduct(payload);
      }
      setNewListing(EMPTY_LISTING);
      setEditingId(null);
      setShowForm(false);
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const editListing = (listing) => {
    setEditingId(listing.id);
    setNewListing({
      name: listing.name, category: listing.category || '', pricePerKg: listing.price_per_kg,
      quantityKg: listing.quantity_kg, county: listing.county || '', harvestNote: listing.harvest_note || ''
    });
    setShowForm(true);
  };

  const removeListing = async (id) => {
    if (!window.confirm('Delete this listing? This cannot be undone.')) return;
    try {
      await deleteProduct(id);
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  // Farmers accept a pending order (moves it to "confirmed"). Final delivery
  // confirmation is done by the buyer from their own dashboard — see
  // BuyerDashboard's confirmReceipt — since only the buyer actually knows
  // when the produce has arrived.
  const confirmOrder = async (order) => {
    try {
      await updateOrderStatus(order.id, 'confirmed');
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const monthEarnings = orders
    .filter((o) => o.status === 'delivered')
    .reduce((sum, o) => sum + Number(o.total_price), 0);

  const initials = user.full_name ? user.full_name.split(' ').map((p) => p[0]).slice(0, 2).join('') : 'U';

  return (
    <div className="dash-layout">
      {/* Sidebar */}
      <aside className="dash-sidebar">
        <div className="dash-user">
          <div className="dash-avatar">{initials}</div>
          <div className="dash-user-name">{user.full_name}</div>
          <div className="dash-user-role">🌾 {user.is_verified ? 'Verified Farmer' : 'Farmer'}</div>
        </div>
        <div className="dash-nav-item active">📊 <span>Overview</span></div>
        <div className="dash-nav-item">📋 <span>My Listings</span></div>
        <div className="dash-nav-item">📦 <span>Orders</span></div>
        <div className="dash-nav-item">💰 <span>Earnings</span></div>
        <button
          type="button"
          className="dash-nav-item"
          style={{ marginTop: '2rem', border: 'none', background: 'none', textAlign: 'left', width: '100%', cursor: 'pointer' }}
          onClick={onLogout}
        >
          🚪 <span>Log Out</span>
        </button>
      </aside>

      {/* Main Area */}
      <main className="dash-main">
        <div className="dash-header">
          <h2>Good day, {user.full_name.split(' ')[0]} 👋</h2>
          <p>Here's your Shamba Direct activity — {new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        {error && <p style={{ color: 'crimson' }}>{error}</p>}

        {/* Metrics */}
        <div className="dash-metrics">
          <div className="metric-card">
            <div className="metric-label">Total Delivered Earnings</div>
            <div className="metric-value">KES {monthEarnings.toLocaleString()}</div>
            <div className="metric-sub">From delivered orders</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Active Listings</div>
            <div className="metric-value">{listings.filter((l) => l.status === 'active').length}</div>
            <div className="metric-sub">{listings.length} total listings</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Orders</div>
            <div className="metric-value">{orders.length}</div>
            <div className="metric-sub">{orders.filter((o) => o.status === 'delivered').length} delivered</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Farmer Rating</div>
            <div className="metric-value">{rating.averageRating || '—'}⭐</div>
            <div className="metric-sub">Based on {rating.reviewCount || 0} reviews</div>
          </div>
        </div>

        {/* Active Listings Table */}
        <div className="dash-table-card">
          <div className="dash-table-title">
            <span>My Listings</span>
            <button className="post-btn" type="button" onClick={() => { setShowForm((s) => !s); setEditingId(null); setNewListing(EMPTY_LISTING); }}>
              {showForm ? '✕ Close' : '+ Post New Produce'}
            </button>
          </div>

          {showForm && (
            <form onSubmit={submitListing} style={{ padding: '1.5rem', borderBottom: '1px solid var(--border, #eee)' }}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Crop Name *</label>
                  <input className="form-input" required value={newListing.name} onChange={(e) => setNewListing((p) => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input className="form-input" value={newListing.category} onChange={(e) => setNewListing((p) => ({ ...p, category: e.target.value }))} placeholder="e.g. Vegetables" />
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Price per kg (KES) *</label>
                  <input className="form-input" type="number" min="0" step="0.01" required value={newListing.pricePerKg} onChange={(e) => setNewListing((p) => ({ ...p, pricePerKg: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Quantity (kg) *</label>
                  <input className="form-input" type="number" min="0" step="0.01" required value={newListing.quantityKg} onChange={(e) => setNewListing((p) => ({ ...p, quantityKg: e.target.value }))} />
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">County</label>
                  <input className="form-input" value={newListing.county} onChange={(e) => setNewListing((p) => ({ ...p, county: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Note</label>
                  <input className="form-input" placeholder="e.g. Harvested 2 days ago" value={newListing.harvestNote} onChange={(e) => setNewListing((p) => ({ ...p, harvestNote: e.target.value }))} />
                </div>
              </div>
              <button className="form-submit" type="submit">{editingId ? 'Update Listing' : 'Publish Listing'}</button>
            </form>
          )}

          <table className="dash-table">
            <thead>
              <tr>
                <th>Crop</th><th>Price/kg</th><th>Quantity</th><th>Views</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="6">Loading…</td></tr>}
              {!loading && listings.length === 0 && <tr><td colSpan="6">No listings yet — post your first produce above.</td></tr>}
              {listings.map((l) => (
                <tr key={l.id}>
                  <td><strong>{l.name}</strong></td>
                  <td>KES {Number(l.price_per_kg).toLocaleString()}</td>
                  <td>{Number(l.quantity_kg).toLocaleString()} kg</td>
                  <td>{l.views}</td>
                  <td>
                    <span className={`status-pill ${l.status === 'active' ? 'status-confirmed' : 'status-pending'}`}>
                      {l.status === 'active' ? 'Active' : l.status === 'sold_out' ? 'Sold Out' : 'Pending Review'}
                    </span>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button type="button" onClick={() => editListing(l)} style={{ marginRight: 8 }}>Edit</button>
                    <button type="button" onClick={() => removeListing(l.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Orders Table */}
        <div className="dash-table-card">
          <div className="dash-table-title">
            <span>Recent Orders</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Updates as soon as a buyer places an order
            </span>
          </div>
          <table className="dash-table">
            <thead>
              <tr><th>Order #</th><th>Buyer</th><th>Buyer Contact</th><th>Crop</th><th>Qty (kg)</th><th>Total (KES)</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {!loading && orders.length === 0 && <tr><td colSpan="8">No orders yet.</td></tr>}
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>#{String(o.id).padStart(4, '0')}</td>
                  <td>
                    <strong>{o.buyer_name}</strong>
                    {o.buyer_company_name && o.buyer_company_name !== o.buyer_name && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{o.buyer_company_name}</div>
                    )}
                  </td>
                  <td>
                    {o.buyer_phone && <div>📞 {o.buyer_phone}</div>}
                    {(o.buyer_delivery_address || o.buyer_county) && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        📍 {o.buyer_delivery_address || o.buyer_county}
                      </div>
                    )}
                  </td>
                  <td>{o.product_name}</td>
                  <td>{Number(o.quantity_kg).toLocaleString()}</td>
                  <td>{Number(o.total_price).toLocaleString()}</td>
                  <td>
                    <span className={`status-pill ${o.status === 'delivered' ? 'status-delivered' : o.status === 'confirmed' ? 'status-confirmed' : 'status-pending'}`}>
                      {o.status[0].toUpperCase() + o.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    {o.status === 'pending' && (
                      <button type="button" onClick={() => confirmOrder(o)}>
                        Accept Order
                      </button>
                    )}
                    {o.status === 'confirmed' && (
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Awaiting buyer confirmation</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

function RatingModal({ order, onClose, onSubmitted }) {
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [status, setStatus] = useState(null); // null | 'sending' | 'error: ...'

  const submit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    try {
      await createRating({
        farmerId: order.farmer_id,
        buyerId: order.buyer_id,
        orderId: order.id,
        rating,
        reviewText: reviewText || null
      });
      onSubmitted();
    } catch (err) {
      setStatus(`error: ${err.message}`);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        className="reg-form"
        style={{ maxWidth: 420, width: '90%', padding: '2rem', background: '#fff', borderRadius: 'var(--radius)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '1rem' }}>
          Rate {order.farmer_name} — {order.product_name}
        </div>
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Rating</label>
            <div style={{ fontSize: '1.6rem', letterSpacing: '0.15em' }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <span
                  key={n}
                  onClick={() => setRating(n)}
                  style={{ cursor: 'pointer', color: n <= rating ? 'var(--gold)' : '#ddd' }}
                >
                  ★
                </span>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Review (optional)</label>
            <textarea
              className="form-input"
              rows="3"
              style={{ resize: 'vertical' }}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            />
          </div>
          <button className="form-submit" type="submit" disabled={status === 'sending'}>
            {status === 'sending' ? 'Submitting…' : 'Submit Rating →'}
          </button>
          {status && status.startsWith('error') && (
            <p style={{ color: 'crimson', marginTop: '0.75rem' }}>{status.replace('error: ', '')}</p>
          )}
        </form>
        <button
          type="button"
          onClick={onClose}
          style={{ marginTop: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function BuyerDashboard({ user, onLogout }) {
  const [orders, setOrders] = useState([]);
  const [ratedOrderIds, setRatedOrderIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ratingOrder, setRatingOrder] = useState(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const [orderData, ratingData] = await Promise.all([
        getOrders({ buyerId: user.id }),
        getRatings({ buyerId: user.id })
      ]);
      setOrders(orderData);
      setRatedOrderIds(ratingData.map((r) => r.order_id).filter(Boolean));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadOrders(); }, [user.id]);

  // Buyer confirms the order has actually arrived. This is what finally
  // moves an order to "delivered" — only the buyer can know this has
  // happened, which is also the moment it counts toward the farmer's
  // "Total Delivered Earnings" on their dashboard.
  const confirmReceipt = async (order) => {
    try {
      await updateOrderStatus(order.id, 'delivered');
      loadOrders();
    } catch (err) {
      setError(err.message);
    }
  };

  const totalSpent = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + Number(o.total_price), 0);

  const initials = user.full_name ? user.full_name.split(' ').map((p) => p[0]).slice(0, 2).join('') : 'U';

  return (
    <div className="dash-layout">
      {/* Sidebar */}
      <aside className="dash-sidebar">
        <div className="dash-user">
          <div className="dash-avatar">{initials}</div>
          <div className="dash-user-name">{user.full_name}</div>
          <div className="dash-user-role">🏢 Buyer / Company</div>
        </div>
        <div className="dash-nav-item active">📊 <span>Overview</span></div>
        <Link className="dash-nav-item" to="/marketplace">🛒 <span>Browse Marketplace</span></Link>
        <div className="dash-nav-item">📦 <span>My Orders</span></div>
        <button
          type="button"
          className="dash-nav-item"
          style={{ marginTop: '2rem', border: 'none', background: 'none', textAlign: 'left', width: '100%', cursor: 'pointer' }}
          onClick={onLogout}
        >
          🚪 <span>Log Out</span>
        </button>
      </aside>

      {/* Main Area */}
      <main className="dash-main">
        <div className="dash-header">
          <h2>Good day, {user.full_name.split(' ')[0]} 👋</h2>
          <p>Here's your Shamba Direct activity — {new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        {error && <p style={{ color: 'crimson' }}>{error}</p>}

        {/* Metrics */}
        <div className="dash-metrics">
          <div className="metric-card">
            <div className="metric-label">Total Spent</div>
            <div className="metric-value">KES {totalSpent.toLocaleString()}</div>
            <div className="metric-sub">Across all orders</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Orders Placed</div>
            <div className="metric-value">{orders.length}</div>
            <div className="metric-sub">{orders.filter((o) => o.status === 'delivered').length} delivered</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Pending / Confirmed</div>
            <div className="metric-value">{orders.filter((o) => o.status === 'pending' || o.status === 'confirmed').length}</div>
            <div className="metric-sub">Awaiting delivery</div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="dash-table-card">
          <div className="dash-table-title">
            <span>My Orders</span>
            <Link className="post-btn" to="/marketplace">+ Browse & Place an Order</Link>
          </div>
          <table className="dash-table">
            <thead>
              <tr><th>Order #</th><th>Farmer</th><th>Crop</th><th>Qty (kg)</th><th>Total (KES)</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="7">Loading…</td></tr>}
              {!loading && orders.length === 0 && (
                <tr><td colSpan="7">No orders yet — <Link to="/marketplace">browse the marketplace</Link> to place your first order.</td></tr>
              )}
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>#{String(o.id).padStart(4, '0')}</td>
                  <td>{o.farmer_name}</td>
                  <td>{o.product_name}</td>
                  <td>{Number(o.quantity_kg).toLocaleString()}</td>
                  <td>{Number(o.total_price).toLocaleString()}</td>
                  <td>
                    <span className={`status-pill ${o.status === 'delivered' ? 'status-delivered' : o.status === 'confirmed' ? 'status-confirmed' : 'status-pending'}`}>
                      {o.status[0].toUpperCase() + o.status.slice(1)}
                    </span>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {o.status === 'pending' && (
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Awaiting farmer</span>
                    )}
                    {o.status === 'confirmed' && (
                      <button type="button" onClick={() => confirmReceipt(o)}>
                        Confirm Receipt
                      </button>
                    )}
                    {o.status === 'delivered' && (
                      ratedOrderIds.includes(o.id)
                        ? <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>✅ Rated</span>
                        : <button type="button" onClick={() => setRatingOrder(o)}>Rate Farmer</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {ratingOrder && (
        <RatingModal
          order={ratingOrder}
          onClose={() => setRatingOrder(null)}
          onSubmitted={() => { setRatingOrder(null); loadOrders(); }}
        />
      )}
    </div>
  );
}

function Dashboard() {
  const { user, login, logout } = useAuth();

  if (!user) {
    return <LoginForm onLoggedIn={login} />;
  }

  return user.role === 'buyer'
    ? <BuyerDashboard user={user} onLogout={logout} />
    : <FarmerDashboard user={user} onLogout={logout} />;
}

export default Dashboard;
