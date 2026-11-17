import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/shared.css';
import '../styles/how-it-works.css';

const FAQ_GROUPS = [
  {
    title: 'Getting started',
    questions: [
      {
        id: 'account',
        question: 'How do I create an account?',
        answer: 'Choose Farmer or Buyer on the Register page, complete the matching form, and submit it. After successful registration, you are taken to your dashboard to manage listings or orders.'
      },
      {
        id: 'listing',
        question: 'How does a farmer post or update a produce listing?',
        answer: 'Open My Listings in the farmer dashboard and choose Post New Produce. Enter the crop name, category, price per kilogram, quantity, county, and an optional harvest note. Use Edit to change a listing or Delete to remove it. The current listing form does not support photo uploads.'
      },
      {
        id: 'find-produce',
        question: 'How can a buyer find produce?',
        answer: 'Browse the Marketplace and search by crop, farmer, or county. You can also filter by county, minimum quantity, or verified farmers and sort listings by date, price, or quantity. Each listing shows its available quantity, price per kilogram, county, and farmer verification status when available.'
      }
    ]
  },
  {
    id: 'requirements',
    title: 'Requirements',
    questions: [
      {
        id: 'fair-trade-pricing',
        question: 'What are the fair-trade requirements?',
        answer: 'Prices and quantities should be clear before an order is placed, and buyers should understand the total cost. Farmers and buyers should negotiate voluntarily, without intimidation, coercion, or discriminatory treatment.'
      },
      {
        id: 'economic-empowerment',
        question: 'How does Shamba Direct support fair access?',
        answer: 'The marketplace is intended to give women and small-scale farmers equal access to buyers, marketplace opportunities, and fair commercial participation.'
      },
      {
        id: 'transaction-records',
        question: 'What transaction records should I keep?',
        answer: 'Keep clear records of agreed prices, quantities, order status, and relevant payment confirmations to reduce misunderstandings and support follow-up.'
      },
      {
        id: 'unfair-trading',
        question: 'What should I do if I experience unfair trading?',
        answer: 'Do not accept threats, forced discounts, discriminatory treatment, or demands for unofficial payments. Keep records of suspicious transactions and report concerns through the Farmers Protection page.'
      }
    ]
  },
  {
    title: 'Orders and communication',
    questions: [
      {
        id: 'place-order',
        question: 'How do I place an order?',
        answer: 'Sign in as a buyer, choose Place Order on a listing, and enter the quantity in kilograms. The estimated total is calculated from the listed price and quantity. Submitting creates an order that you can follow from your dashboard.'
      },
      {
        id: 'order-status',
        question: 'What happens after an order is placed?',
        answer: 'The order appears in both dashboards as pending. The farmer can confirm it from their dashboard. After the produce has been received, the buyer confirms receipt; the order is then marked delivered and the buyer can rate the farmer.'
      },
      {
        id: 'contact',
        question: 'How do I contact a farmer about a listing?',
        answer: 'Sign in and select Contact Farmer on the listing. Write and send your enquiry from the form. You need an account to send an enquiry or place an order.'
      }
    ]
  },
  {
    title: 'Payments, delivery, and help',
    questions: [
      {
        id: 'payment',
        question: 'How are payments handled?',
        answer: 'Payments are not processed through the current Shamba Direct website. Agree the final price and payment method directly with the other party, and confirm the terms before delivery. A listing price and order estimate are not proof of payment.'
      },
      {
        id: 'delivery',
        question: 'Who arranges collection or delivery?',
        answer: 'The farmer and buyer coordinate collection or delivery directly. The website records the order but does not book transport or confirm a delivery service.'
      },
      {
        id: 'fees',
        question: 'Does the website collect a registration or order fee?',
        answer: 'The current website does not collect a registration payment or process an order payment. If you are asked to pay a fee outside the website, confirm the terms with the other party before proceeding.'
      },
      {
        id: 'verification',
        question: 'What does the farmer verification badge mean?',
        answer: 'The badge reflects the verification status available for that farmer account. If you have a question about an account or a listing, contact the support team before proceeding with a transaction.'
      },
      {
        id: 'support',
        question: 'Where can I get help or report a concern?',
        answer: 'Use the Contact page to reach the support team. For farmer protection resources, visit the Farmers Protection page.'
      }
    ]
  }
];

function HowItWorks() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <>
      <div className="hiw-hero">
        <h1>How Shamba Direct Works</h1>
        <p>Find clear answers about accounts, listings, orders, payments, and delivery.</p>
      </div>

      <section className="section faq-section" id="faqs">
        <div className="container-sm">
          <div className="faq-heading">
            <div className="section-label">Common Questions</div>
            <h2 className="section-title">Frequently Asked Questions</h2>
          </div>
          {FAQ_GROUPS.map((group) => (
            <section
              className="faq-group"
              id={group.id}
              aria-labelledby={group.id ? `${group.id}-heading` : undefined}
              key={group.title}
            >
              <h3
                className="faq-group-title"
                id={group.id ? `${group.id}-heading` : undefined}
              >
                {group.title}
              </h3>
              {group.questions.map((faq) => {
                const isOpen = openFaq === faq.id;
                const answerId = `faq-answer-${faq.id}`;

                return (
                  <div className={`faq-item${isOpen ? ' open' : ''}`} key={faq.id}>
                    <h4 className="faq-q">
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={answerId}
                        onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                      >
                        <span>{faq.question}</span>
                        <span className="faq-icon" aria-hidden="true">+</span>
                      </button>
                    </h4>
                    <div className="faq-a" id={answerId} hidden={!isOpen}>
                      <p>{faq.answer}</p>
                    </div>
                  </div>
                );
              })}
            </section>
          ))}
          <div className="faq-contact">
            <p>Still have questions?</p>
            <Link className="btn-primary" to="/contact">Contact Our Team →</Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default HowItWorks;
