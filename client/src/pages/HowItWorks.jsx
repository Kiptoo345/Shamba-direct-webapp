import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/shared.css';
import '../styles/how-it-works.css';

const FARMER_STEPS = [
  { title: 'Register with Your Phone Number', body: "Create a free account using your phone number or email. Provide your county, farm size, and main crops. Your account is verified within 24 hours using your National ID. Works on any internet-enabled phone." },
  { title: 'Post Your Produce Listing', body: 'Take a photo of your harvest and upload it. Set your price per kg, total quantity available, and your earliest delivery date. Listings go live immediately and are visible to all verified buyers in your region.' },
  { title: 'Receive Enquiries from Buyers', body: 'Companies and restaurants will contact you directly through the platform. Chat, agree on final price and logistics. You can negotiate — the buyer sees your listed price as a starting point.' },
  { title: 'Confirm Order & Arrange Delivery', body: 'Once a buyer confirms, you arrange delivery or farm pickup. Many buyers organize their own transport — especially for large orders. Shamba Direct provides a logistics partner directory at no extra cost.' },
  { title: 'Receive Payment Directly via M-Pesa', body: 'Payment is sent to your M-Pesa number directly. You can request upfront payment or 50% deposit. Shamba Direct holds a 3% platform fee only — the rest goes to you, immediately. No waiting weeks for money.' }
];

const COMPANY_STEPS = [
  { title: 'Register Your Company', body: "Create a verified buyer account with your company name, KRA PIN, and contact details. Verification takes 24–48 hours. Once verified, you're marked as a trusted buyer — farmers prioritize verified buyers." },
  { title: 'Browse the Marketplace', body: 'Search by crop type, county, quantity, and price. Filter by verified farmers only. See full farmer profiles including ratings, past transaction history, and photos of the produce.' },
  { title: 'Contact Farmer & Negotiate', body: 'Send an enquiry directly to the farmer. Discuss quantity, delivery schedule, and price. All communication is logged on the platform for transparency and dispute resolution.' },
  { title: 'Confirm Order & Arrange Logistics', body: 'Confirm the order on the platform. Arrange pickup from the farm or request delivery. Our partner logistics companies can be booked through the platform for counties within 200km of Nairobi.' },
  { title: 'Receive Fresh Produce & Build Relationships', body: 'Once satisfied with the produce, confirm delivery on the platform. Rate the farmer. Many buyers set up recurring orders — building a direct, long-term supply chain without any broker.' }
];

const FAQS = [
  { q: 'Is it really free to register as a farmer?', a: "Yes, completely free. There are no registration fees, no monthly charges, and no subscription. Shamba Direct earns a small 3% platform fee only when you successfully complete a sale. If you don't sell, you pay nothing." },
  { q: 'How do I receive payment?', a: 'Payments are sent directly to your M-Pesa number. You can negotiate with buyers for upfront payment, 50% deposit before delivery, or payment on delivery. Shamba Direct facilitates the transaction but the money goes to you directly.' },
  { q: "What if I don't have a smartphone?", a: 'You can use Shamba Direct on any internet-enabled phone using our mobile website. We also have SMS-based listing submission — contact our support line and a Shamba Direct agent will post your listing for you.' },
  { q: 'What happens if there is a dispute over quality?', a: 'All listings require photos of the produce at time of posting. We have a dispute resolution team available 7 days a week. Both parties can upload evidence and a Shamba Direct mediator will resolve issues within 48 hours.' },
  { q: 'Can I list any crop?', a: 'Yes. Shamba Direct supports all food crops grown in Kenya — vegetables, fruits, cereals, legumes, roots, herbs, and animal products. We review listings to ensure they meet our quality and safety standards.' },
  { q: 'How does transport and delivery work?', a: 'Transport is arranged between farmer and buyer directly. For large orders, many buyers send their own trucks. Shamba Direct has partnered with logistics companies and the details are available in your dashboard once registered. Farm pickup is also common.' }
];

function StepList({ steps }) {
  return (
    <div className="hiw-steps">
      {steps.map((step, idx) => (
        <div className="hiw-step" key={step.title}>
          <div className="hiw-step-num">{idx + 1}</div>
          <div className="hiw-step-content">
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function HowItWorks() {
  const [tab, setTab] = useState('farmer');
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <>
      {/* HIW HERO */}
      <div className="hiw-hero">
        <h1>How Shamba Direct Works</h1>
        <p>Simple, transparent, and designed for every Kenyan farmer — whether you have a smartphone or not.</p>
      </div>

      {/* STEPS */}
      <section className="section" style={{ background: '#fff' }}>
        <div className="container">
          <div className="hiw-tabs-outer">
            <button type="button" className={`hiw-tab${tab === 'farmer' ? ' active' : ''}`} onClick={() => setTab('farmer')}>🌾 For Farmers</button>
            <button type="button" className={`hiw-tab${tab === 'company' ? ' active' : ''}`} onClick={() => setTab('company')}>🏢 For Companies</button>
          </div>

          {tab === 'farmer' ? <StepList steps={FARMER_STEPS} /> : <StepList steps={COMPANY_STEPS} />}
        </div>
      </section>

      {/* FAQ */}
      <section className="section faq-section">
        <div className="container-sm">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div className="section-label">Common Questions</div>
            <h2 className="section-title">Frequently Asked Questions</h2>
          </div>
          {FAQS.map((faq, idx) => (
            <div className={`faq-item${openFaq === idx ? ' open' : ''}`} key={faq.q}>
              <div className="faq-q" onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}>
                <span>{faq.q}</span>
                <span className="faq-icon">+</span>
              </div>
              <div className="faq-a">{faq.a}</div>
            </div>
          ))}
          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem' }}>Still have questions?</p>
            <Link className="btn-primary" to="/contact">Contact Our Team →</Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default HowItWorks;
