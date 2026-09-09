import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../api/api';
import { useAuth } from '../context/AuthContext';
import '../styles/shared.css';
import '../styles/register.css';

const COUNTIES = ['Nairobi', 'Kiambu', 'Kirinyaga', 'Nakuru', 'Uasin Gishu', 'Nyandarua', 'Meru', 'Kajiado', 'Machakos', 'Kisumu', 'Other'];

const emptyFarmer = {
  fullName: '', phoneNumber: '', county: '', farmSize: '1 – 5 acres',
  mainCrops: '', nationalId: '', password: '', agree: false
};
const emptyCompany = {
  companyName: '', kraPin: '', fullName: '', phoneNumber: '', email: '',
  businessType: '', productsNeeded: '', deliveryAddress: '', password: ''
};

function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [tab, setTab] = useState('farmer');
  const [farmer, setFarmer] = useState(emptyFarmer);
  const [company, setCompany] = useState(emptyCompany);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const updateFarmer = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFarmer((prev) => ({ ...prev, [field]: value }));
  };
  const updateCompany = (field) => (e) => setCompany((prev) => ({ ...prev, [field]: e.target.value }));

  const submitFarmer = async (e) => {
    e.preventDefault();
    if (!farmer.agree) {
      setErrorMsg('Please agree to the Terms of Service and Privacy Policy.');
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const { userId } = await registerUser({ role: 'farmer', ...farmer });
      login({ id: userId, full_name: farmer.fullName, role: 'farmer' });
      navigate('/dashboard');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const submitCompany = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const { userId } = await registerUser({ role: 'buyer', ...company });
      login({ id: userId, full_name: company.fullName, role: 'buyer' });
      navigate('/dashboard');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="reg-page">
      <div className="reg-container">
        <div className="reg-header">
          <div className="section-label">Join for Free</div>
          <h2 className="section-title">Create Your Account</h2>
          <p style={{ color: 'var(--text-muted)' }}>No fees. No subscriptions. We only earn when you do — 3% platform fee per sale.</p>
          <p className="reg-signin-callout">
            Already have an account? <Link to="/dashboard">Log in here →</Link>
          </p>
        </div>

        <div className="benefits-list">
          <div className="benefit-item"><span className="benefit-check">✅</span> <span>Free to register — no monthly charges</span></div>
          <div className="benefit-item"><span className="benefit-check">✅</span> <span>Get paid directly via M-Pesa</span></div>
          <div className="benefit-item"><span className="benefit-check">✅</span> <span>Access buyers from all 47 counties</span></div>
          <div className="benefit-item"><span className="benefit-check">✅</span> <span>Works on any smartphone or feature phone</span></div>
        </div>

        <div className="reg-tabs">
          <button type="button" className={`reg-tab${tab === 'farmer' ? ' active' : ''}`} onClick={() => setTab('farmer')}>🌾 I'm a Farmer</button>
          <button type="button" className={`reg-tab${tab === 'company' ? ' active' : ''}`} onClick={() => setTab('company')}>🏢 I'm a Company/Buyer</button>
        </div>

        {errorMsg && <p style={{ color: 'crimson', textAlign: 'center' }}>{errorMsg}</p>}

        {/* Farmer Form */}
        <form className={`reg-form${tab !== 'farmer' ? ' form-hidden' : ''}`} onSubmit={submitFarmer}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input type="text" className="form-input" placeholder="e.g. James Mwangi" value={farmer.fullName} onChange={updateFarmer('fullName')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number (M-Pesa) *</label>
              <input type="tel" className="form-input" placeholder="0712 345 678" value={farmer.phoneNumber} onChange={updateFarmer('phoneNumber')} required />
            </div>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">County *</label>
              <select className="form-input form-select" value={farmer.county} onChange={updateFarmer('county')} required>
                <option value="">Select your county</option>
                {COUNTIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Farm Size (Acres)</label>
              <select className="form-input form-select" value={farmer.farmSize} onChange={updateFarmer('farmSize')}>
                <option>Less than 1 acre</option>
                <option>1 – 5 acres</option>
                <option>5 – 20 acres</option>
                <option>More than 20 acres</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Main Crops You Grow *</label>
            <input type="text" className="form-input" placeholder="e.g. Tomatoes, Maize, Potatoes" value={farmer.mainCrops} onChange={updateFarmer('mainCrops')} required />
          </div>
          <div className="form-group">
            <label className="form-label">National ID Number</label>
            <input type="text" className="form-input" placeholder="For identity verification" value={farmer.nationalId} onChange={updateFarmer('nationalId')} />
          </div>
          <div className="form-group">
            <label className="form-label">Create Password *</label>
            <input type="password" className="form-input" placeholder="At least 8 characters" minLength={8} value={farmer.password} onChange={updateFarmer('password')} required />
          </div>
          <div className="form-group">
            <label className="filter-option" style={{ fontSize: '0.88rem' }}>
              <input type="checkbox" style={{ accentColor: 'var(--green)' }} checked={farmer.agree} onChange={updateFarmer('agree')} />
              {' '}I agree to the <a href="#terms" style={{ color: 'var(--green)' }}>Terms of Service</a> and <a href="#privacy" style={{ color: 'var(--green)' }}>Privacy Policy</a>
            </label>
          </div>
          <button className="form-submit" type="submit" style={{ display: 'block', width: '100%', textAlign: 'center' }} disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create Farmer Account →'}
          </button>
        </form>

        {/* Company Form */}
        <form className={`reg-form${tab !== 'company' ? ' form-hidden' : ''}`} onSubmit={submitCompany}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Company / Organisation Name *</label>
              <input type="text" className="form-input" placeholder="e.g. Nairobi Provisions Ltd" value={company.companyName} onChange={updateCompany('companyName')} required />
            </div>
            <div className="form-group">
              <label className="form-label">KRA PIN</label>
              <input type="text" className="form-input" placeholder="For verified buyers" value={company.kraPin} onChange={updateCompany('kraPin')} />
            </div>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Contact Person Name *</label>
              <input type="text" className="form-input" placeholder="Full name" value={company.fullName} onChange={updateCompany('fullName')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input type="tel" className="form-input" placeholder="0712 345 678" value={company.phoneNumber} onChange={updateCompany('phoneNumber')} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input type="email" className="form-input" placeholder="info@company.co.ke" value={company.email} onChange={updateCompany('email')} />
          </div>
          <div className="form-group">
            <label className="form-label">Type of Business *</label>
            <select className="form-input form-select" value={company.businessType} onChange={updateCompany('businessType')} required>
              <option value="">Select type</option>
              <option>Supermarket / Retail</option>
              <option>Food Processing Company</option>
              <option>Restaurant / Hotel</option>
              <option>School Feeding Program</option>
              <option>Export Company</option>
              <option>Other</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Products You Need (Regularly)</label>
            <input type="text" className="form-input" placeholder="e.g. Tomatoes, Maize, Onions" value={company.productsNeeded} onChange={updateCompany('productsNeeded')} />
          </div>
          <div className="form-group">
            <label className="form-label">Delivery / Collection Address *</label>
            <input type="text" className="form-input" placeholder="City, area, county" value={company.deliveryAddress} onChange={updateCompany('deliveryAddress')} required />
          </div>
          <div className="form-group">
            <label className="form-label">Create Password *</label>
            <input type="password" className="form-input" placeholder="At least 8 characters" minLength={8} value={company.password} onChange={updateCompany('password')} required />
          </div>
          <button className="form-submit" type="submit" style={{ display: 'block', width: '100%', textAlign: 'center' }} disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create Buyer Account →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Already registered? <Link to="/dashboard" style={{ color: 'var(--green)', fontWeight: 700 }}>Log in to your account →</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
