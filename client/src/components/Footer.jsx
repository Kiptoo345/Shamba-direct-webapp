import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer>
      <div className="footer-main">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-logo">
              <div className="footer-logo-icon">🌱</div>
              <div className="footer-logo-text">Shamba Direct</div>
            </div>
            <p>Connecting Kenya's farms directly to companies, supermarkets, and restaurants. No brokers. Fair prices. Better livelihoods.</p>
            <div className="social-links">
              <a className="social-btn" href="#top" title="Facebook">f</a>
              <a className="social-btn" href="#top" title="Instagram">📷</a>
              <a className="social-btn" href="#top" title="Twitter/X">𝕏</a>
              <a className="social-btn" href="#top" title="YouTube">▶</a>
            </div>
            <div className="lang-toggle" style={{ marginTop: '1rem' }}>
              <button className="lang-btn active" type="button">English</button>
              <button className="lang-btn" type="button">Kiswahili</button>
            </div>
          </div>
          <div>
            <div className="footer-col-title">Quick Links</div>
            <Link className="footer-link" to="/">Home</Link>
            <Link className="footer-link" to="/marketplace">Marketplace</Link>
            <Link className="footer-link" to="/how-it-works">How It Works</Link>
            <Link className="footer-link" to="/contact">About Us</Link>
            <Link className="footer-link" to="/contact">Contact</Link>
          </div>
          <div>
            <div className="footer-col-title">For Farmers</div>
            <Link className="footer-link" to="/register">Register Free</Link>
            <Link className="footer-link" to="/dashboard">Post Produce</Link>
            <Link className="footer-link" to="/dashboard">Track Orders</Link>
            <Link className="footer-link" to="/how-it-works">How It Works</Link>
            <Link className="footer-link" to="/how-it-works">FAQ</Link>
          </div>
          <div>
            <div className="footer-col-title">Contact Us</div>
            <div className="footer-contact-item"><span className="footer-contact-icon">📞</span> +254 700 123 456</div>
            <div className="footer-contact-item"><span className="footer-contact-icon">💬</span> WhatsApp Support</div>
            <div className="footer-contact-item"><span className="footer-contact-icon">✉️</span> hello@shambadirect.co.ke</div>
            <div className="footer-contact-item"><span className="footer-contact-icon">📍</span> Ngong Road, Nairobi</div>
            <div className="footer-contact-item"><span className="footer-contact-icon">🕐</span> Mon–Sat, 7am–7pm</div>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="footer-bottom-inner">
          <div className="footer-bottom-left">© 2025 Shamba Direct Ltd. All rights reserved. Registered in Kenya.</div>
          <div className="footer-bottom-links">
            <a href="#top">Privacy Policy</a>
            <a href="#top">Terms of Use</a>
            <a href="#top">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
