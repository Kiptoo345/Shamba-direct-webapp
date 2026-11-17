import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMarketPrices } from '../api/api';
import CropImage from '../components/CropImage';
import '../styles/shared.css';
import '../styles/home.css';

function Home() {
  const [marketPrices, setMarketPrices] = useState([]);
  const [marketPricesLoading, setMarketPricesLoading] = useState(true);
  const [marketPricesError, setMarketPricesError] = useState('');

  useEffect(() => {
    let active = true;

    getMarketPrices()
      .then((prices) => {
        if (active) {
          setMarketPrices(prices);
        }
      })
      .catch((error) => {
        if (active) {
          setMarketPricesError(error.message);
        }
      })
      .finally(() => {
        if (active) {
          setMarketPricesLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="hero-content">
          <div>
            <div className="hero-badge">🇰🇪 Made for Kenyan Farmers</div>
            <h1>Sell Your Harvest <em>Direct.</em><br />Earn What You Deserve.</h1>
            <p className="hero-desc">No middlemen. No brokers. Connect directly with food companies, supermarkets, and processors across Kenya — and keep up to 85% of every sale.</p>
            <div className="hero-ctas">
              <Link className="btn-gold" to="/register">🌾 I'm a Farmer</Link>
              <Link className="btn-secondary" style={{ borderColor: 'rgba(255,255,255,0.5)', color: '#fff' }} to="/register">🏢 I'm a Buyer</Link>
            </div>
            <div className="hero-stats">
              <div>
                <div className="hero-stat-num">4,200+</div>
                <div className="hero-stat-label">Farmers Registered</div>
              </div>
              <div>
                <div className="hero-stat-num">47</div>
                <div className="hero-stat-label">Counties Covered</div>
              </div>
              <div>
                <div className="hero-stat-num">KES 82M</div>
                <div className="hero-stat-label">Paid to Farmers</div>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-card">
              <div className="hero-card-top">
                <span className="hero-card-title">🍅 Fresh Tomatoes</span>
                <span className="price-badge">KES 45/kg</span>
              </div>
              <div className="hero-card-img">
                <CropImage name="Fresh Tomatoes" />
              </div>
              <div className="hero-card-meta">
                <span className="meta-tag">📍 Kirinyaga</span>
                <span className="meta-tag">500 kg Available</span>
                <span className="meta-tag">✅ Verified Farmer</span>
              </div>
            </div>
            <div className="hero-card">
              <div className="hero-card-top">
                <span className="hero-card-title">🌽 Grade A Maize</span>
                <span className="price-badge">KES 32/kg</span>
              </div>
              <div className="hero-card-img">
                <CropImage name="Grade A Maize" />
              </div>
              <div className="hero-card-meta">
                <span className="meta-tag">📍 Uasin Gishu</span>
                <span className="meta-tag">2,000 kg Available</span>
                <span className="meta-tag">✅ Verified Farmer</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM vs SOLUTION */}
      <section className="section problem-section">
        <div className="container">
          <div className="section-label">The Problem We're Solving</div>
          <h2 className="section-title">Brokers Take Your Money.<br />We Give It Back.</h2>
          <div className="compare-grid">
            <div className="compare-card bad">
              <div className="compare-label">❌ Old Broker System</div>
              <div className="compare-chain">
                <div className="chain-step"><span className="chain-dot bad">🌾</span> Farmer harvests crop</div>
                <div className="chain-arrow">↓ Sells at 20% farm gate price</div>
                <div className="chain-step"><span className="chain-dot bad">🧑‍💼</span> Broker 1 buys cheap</div>
                <div className="chain-arrow">↓ Adds markup</div>
                <div className="chain-step"><span className="chain-dot bad">🧑‍💼</span> Broker 2 resells</div>
                <div className="chain-arrow">↓ Adds markup again</div>
                <div className="chain-step"><span className="chain-dot bad">🏢</span> Company pays full price</div>
              </div>
              <div className="earn-highlight bad">
                <div className="earn-pct">20–35%</div>
                <div className="earn-label">Farmer earns of the final price</div>
              </div>
            </div>
            <div className="compare-vs">VS</div>
            <div className="compare-card good">
              <div className="compare-label">✅ Shamba Direct</div>
              <div className="compare-chain">
                <div className="chain-step"><span className="chain-dot good">🌾</span> Farmer lists produce online</div>
                <div className="chain-arrow">↓ Direct connection</div>
                <div className="chain-step"><span className="chain-dot good">📱</span> Company sees listing & contacts farmer</div>
                <div className="chain-arrow">↓ Agree on price</div>
                <div className="chain-step"><span className="chain-dot good">💸</span> M-Pesa payment direct to farmer</div>
                <div className="chain-arrow">↓</div>
                <div className="chain-step"><span className="chain-dot good">✅</span> Delivery confirmed</div>
              </div>
              <div className="earn-highlight good">
                <div className="earn-pct">80–85%</div>
                <div className="earn-label">Farmer earns of the final price</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS QUICK */}
      <section className="section" style={{ background: '#fff' }}>
        <div className="container">
          <div style={{ textAlign: 'center' }}>
            <div className="section-label">Simple Process</div>
            <h2 className="section-title">Start Selling in 3 Steps</h2>
            <p className="section-sub" style={{ margin: '0 auto' }}>No tech skills needed. Works on any phone with internet.</p>
          </div>
          <div className="step-grid">
            <div className="step-card">
              <div className="step-num">1</div>
              <div className="step-icon">📝</div>
              <div className="step-title">Register Free</div>
              <p className="step-desc">Sign up using your phone number. Add your name, county, and crops you grow. Takes less than 5 minutes.</p>
            </div>
            <div className="step-card">
              <div className="step-num">2</div>
              <div className="step-icon">📸</div>
              <div className="step-title">List Your Produce</div>
              <p className="step-desc">Post photos, set your price per kg, and share how much you have. Companies in your county will see your listing.</p>
            </div>
            <div className="step-card">
              <div className="step-num">3</div>
              <div className="step-icon">💰</div>
              <div className="step-title">Get Paid via M-Pesa</div>
              <p className="step-desc">Agree on price with the buyer. Receive payment directly on M-Pesa before or at delivery. No delays, no middlemen.</p>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Link className="btn-primary" to="/how-it-works">Learn More →</Link>
          </div>
        </div>
      </section>

      {/* MARKET PRICES */}
      <section className="section" style={{ background: 'var(--cream)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.5rem' }}>
            <div>
              <div className="section-label">Market Prices</div>
              <h2 className="section-title">Products &amp; Their Market Prices</h2>
            </div>
            <Link className="btn-secondary" to="/marketplace">Browse Marketplace →</Link>
          </div>
          <div className="produce-grid">
            {marketPricesLoading && (
              <p role="status">Loading market prices…</p>
            )}
            {marketPricesError && (
              <p role="alert">Couldn't load market prices: {marketPricesError}</p>
            )}
            {!marketPricesLoading && !marketPricesError && marketPrices.length === 0 && (
              <p>No market prices are available right now.</p>
            )}
            {!marketPricesLoading && !marketPricesError && marketPrices.map((price) => (
              <div className="produce-card" key={`${price.crop_name}-${price.county}`}>
                <div className="produce-img">
                  <CropImage name={price.crop_name} />
                </div>
                <div className="produce-body">
                  <div className="produce-name">{price.crop_name}</div>
                  <div className="produce-meta">
                    <span className="produce-price">
                      KES {Number(price.price_per_kg).toLocaleString()}/kg
                    </span>
                  </div>
                  <div className="produce-county">📍 {price.county || 'Kenya'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS BAND */}
      <div className="stats-band">
        <div className="container">
          <div className="stats-band-grid">
            <div><div className="stat-num">4,200+</div><div className="stat-label">Registered Farmers</div></div>
            <div><div className="stat-num">580+</div><div className="stat-label">Verified Buyers &amp; Companies</div></div>
            <div><div className="stat-num">47</div><div className="stat-label">Counties Covered</div></div>
            <div><div className="stat-num">KES 82M</div><div className="stat-label">Paid Directly to Farmers</div></div>
          </div>
        </div>
      </div>

      {/* TESTIMONIALS */}
      <section className="section" style={{ background: 'var(--warm-white)' }}>
        <div className="container">
          <div style={{ textAlign: 'center' }}>
            <div className="section-label">Real Stories</div>
            <h2 className="section-title">Farmers &amp; Buyers Love Shamba Direct</h2>
          </div>
          <div className="testimonial-grid">
            <div className="testimonial-card">
              <div className="stars">★★★★★</div>
              <p className="testimonial-quote">"Before Shamba Direct I was selling my tomatoes at KES 8 per kilo to a broker. Now I get KES 42 directly from Nairobi Provisions. My income has tripled in one season."</p>
              <div className="testimonial-author">
                <div className="author-avatar" style={{ background: 'var(--green)' }}>JM</div>
                <div><div className="author-name">James Mwangi</div><div className="author-role">Tomato Farmer, Kirinyaga</div></div>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="stars">★★★★★</div>
              <p className="testimonial-quote">"We source 60% of our fresh produce through Shamba Direct. The quality is better, the price is fair for both sides, and we know exactly where our food comes from."</p>
              <div className="testimonial-author">
                <div className="author-avatar" style={{ background: 'var(--earth)' }}>SK</div>
                <div><div className="author-name">Sarah Kariuki</div><div className="author-role">Procurement, Nairobi Provisions Ltd</div></div>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="stars">★★★★★</div>
              <p className="testimonial-quote">"Nilikuwa sijui how to reach big companies. Shamba Direct ilinitoa kwa brokers. Now I have 3 regular buyers and I plan my planting around their orders."</p>
              <div className="testimonial-author">
                <div className="author-avatar" style={{ background: 'var(--gold)' }}>GA</div>
                <div><div className="author-name">Grace Achieng</div><div className="author-role">Maize Farmer, Uasin Gishu</div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <div className="cta-banner">
        <div className="container">
          <h2>Ready to Earn What Your Farm Deserves?</h2>
          <p>Join 4,200+ Kenyan farmers already selling direct. Free registration. M-Pesa payments. No brokers.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link className="btn-primary" to="/register" style={{ background: 'var(--green-dark)' }}>🌾 Register as Farmer</Link>
            <Link className="btn-secondary" to="/register" style={{ borderColor: 'var(--green-dark)', color: 'var(--green-dark)' }}>🏢 Register as Buyer</Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default Home;
