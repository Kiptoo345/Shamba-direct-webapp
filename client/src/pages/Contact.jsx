import { useState } from 'react';
import { submitContactMessage } from '../api/api';
import '../styles/shared.css';
import '../styles/contact.css';

const EMPTY_FORM = { name: '', contactInfo: '', subject: 'I need help with my account', message: '' };

function Contact() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [status, setStatus] = useState(null);

  const update = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    try {
      await submitContactMessage(form);
      setStatus('sent');
      setForm(EMPTY_FORM);
    } catch (err) {
      setStatus(`error: ${err.message}`);
    }
  };

  return (
    <>
      {/* ABOUT / MISSION */}
      <section className="section" style={{ background: 'var(--warm-white)' }}>
        <div className="container">
          <div className="section-label">Our Story</div>
          <h2 className="section-title">Built for Kenya's Farmers,<br />By People Who Care.</h2>
          <div className="grid-2" style={{ marginTop: '2.5rem', gap: '3rem', alignItems: 'start' }}>
            <div>
              <div className="mission-box">
                <h3>🌱 Our Mission</h3>
                <p>Shamba Direct was founded in 2022 after seeing Kenyan farmers earn just KES 10 per kg for tomatoes that retailed for KES 60 in Nairobi. The only winners were the brokers in between. We built this platform to eliminate that gap — giving farmers a direct digital route to the companies that need their produce, and giving companies access to fresher, traceable food at fair prices.</p>
              </div>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: '1.5rem', lineHeight: 1.8 }}>Today Shamba Direct serves over 4,200 farmers across all 47 counties of Kenya, with partnerships with major supermarkets, hotels, school feeding programs, and food processing companies. Our goal by 2027 is to have 50,000 farmers using the platform.</p>
            </div>
            <div>
              <div style={{ background: 'var(--green-light)', borderRadius: 'var(--radius)', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '6rem' }}>🇰🇪🌾</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                <div className="metric-card"><div className="metric-label">Founded</div><div className="metric-value" style={{ fontSize: '1.4rem' }}>2022</div></div>
                <div className="metric-card"><div className="metric-label">Headquarters</div><div className="metric-value" style={{ fontSize: '1rem', marginTop: 4 }}>Nairobi, Kenya</div></div>
              </div>
            </div>
          </div>

          {/* Team */}
          <div className="team-section">
            <div className="section-label">The Team</div>
            <h3 className="section-title" style={{ fontSize: '1.8rem' }}>Meet the People Behind Shamba Direct</h3>
            <div className="team-grid">
              <div className="team-card">
                <div className="team-avatar" style={{ background: 'var(--green)' }}>CA</div>
                <div className="team-name">Carldon Aminga</div>
                <div className="team-role">Co-Founder & CEO</div>
              </div>
              <div className="team-card">
                <div className="team-avatar" style={{ background: 'var(--earth)' }}>LO</div>
                <div className="team-name">Linus Odhiambo</div>
                <div className="team-role">Co-Founder & CTO</div>
              </div>
              <div className="team-card">
                <div className="team-avatar" style={{ background: 'var(--gold)' }}>MK</div>
                <div className="team-name">Maxwell Kimani</div>
                <div className="team-role">Head of Farmer Relations</div>
              </div>
              <div className="team-card">
                <div className="team-avatar" style={{ background: 'var(--green-dark)' }}>VK</div>
                <div className="team-name">Victor Kiptoo</div>
                <div className="team-role">Head of Transportation</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="section" style={{ background: '#fff' }}>
        <div className="container">
          <div className="section-label">Get in Touch</div>
          <h2 className="section-title">We're Here to Help</h2>
          <div className="contact-layout" style={{ marginTop: '2.5rem' }}>
            <div className="contact-info">
              <h3>Contact Information</h3>
              <p>Our support team is available 7 days a week. We speak English, Kiswahili, and several local languages.</p>
              <div className="contact-item">
                <div className="contact-icon">📞</div>
                <div>
                  <div className="contact-item-label">Phone / WhatsApp</div>
                  <div className="contact-item-value">+254 700 123 456</div>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon">✉️</div>
                <div>
                  <div className="contact-item-label">Email</div>
                  <div className="contact-item-value">hello@shambadirect.co.ke</div>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon">📍</div>
                <div>
                  <div className="contact-item-label">Office Address</div>
                  <div className="contact-item-value">2nd Floor, Ngong Road Plaza<br />Ngong Road, Nairobi, Kenya</div>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon">🕐</div>
                <div>
                  <div className="contact-item-label">Support Hours</div>
                  <div className="contact-item-value">Monday – Saturday: 7am – 7pm<br />Sunday: 9am – 3pm</div>
                </div>
              </div>
            </div>

            <div>
              <form className="reg-form" style={{ padding: '2rem' }} onSubmit={submit}>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '1.5rem', color: 'var(--green-dark)' }}>Send Us a Message</div>
                <div className="form-group">
                  <label className="form-label">Your Name</label>
                  <input type="text" className="form-input" placeholder="Full name" value={form.name} onChange={update('name')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone or Email</label>
                  <input type="text" className="form-input" placeholder="We'll reply here" value={form.contactInfo} onChange={update('contactInfo')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <select className="form-input form-select" value={form.subject} onChange={update('subject')}>
                    <option>I need help with my account</option>
                    <option>I want to report a problem</option>
                    <option>I have a partnership enquiry</option>
                    <option>Media / Press enquiry</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Message</label>
                  <textarea className="form-input" rows="5" placeholder="Tell us how we can help..." style={{ resize: 'vertical' }} value={form.message} onChange={update('message')} required />
                </div>
                <button className="form-submit" type="submit" disabled={status === 'sending'}>
                  {status === 'sending' ? 'Sending…' : 'Send Message →'}
                </button>
                {status === 'sent' && <p style={{ color: 'var(--green)', marginTop: '0.75rem' }}>Thanks! We'll get back to you shortly.</p>}
                {status && status.startsWith('error') && <p style={{ color: 'crimson', marginTop: '0.75rem' }}>{status.replace('error: ', '')}</p>}
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default Contact;
