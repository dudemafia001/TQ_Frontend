"use client";
import React from 'react';
import './about.css';

export default function AboutPage() {
  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Welcome to The Quisine</h1>
          <p className="hero-description">
            At The Quisine, we bring the taste of authentic North Indian cuisine straight from our kitchen to your doorstep. 
            Based in Kanpur, our cloud kitchen is dedicated to serving freshly prepared, hygienic, and 100% vegetarian meals — 
            made with love and the finest ingredients.
          </p>
          <p className="hero-subtitle">
            Whether you're ordering your daily meal or planning food for a special occasion, we ensure every bite feels like home.
          </p>
          <div className="hero-buttons">
            <button className="cta-primary" onClick={() => window.location.href = '/'}>
              Explore Our Menu
            </button>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="story-section">
        <div className="container">
          <h2 className="section-title">Our Journey</h2>
          <div className="story-content">
            <p>
              The Quisine started with a simple vision — to make delicious, wholesome food accessible to everyone, 
              without compromising on quality or freshness.
            </p>
            <p>
              What began as a small kitchen with a handful of dishes has now grown into Kanpur's favorite vegetarian 
              cloud kitchen, loved for its flavorful curries, soft naans, and comforting thalis.
            </p>
            <p>
              Every dish we create reflects our passion for good food and our commitment to serving meals that 
              satisfy both the heart and the stomach.
            </p>
          </div>
        </div>
      </section>

      {/* Our Specialities */}
      <section className="specialities-section">
        <div className="container">
          <h2 className="section-title">Our Specialities</h2>
          <div className="specialities-grid">
            <div className="specialty-item">
              <div className="specialty-icon">🌶️</div>
              <h3>Paneer Butter Masala</h3>
              <p>Creamy, rich, and packed with flavor.</p>
            </div>
            <div className="specialty-item">
              <div className="specialty-icon">🍛</div>
              <h3>Daal Makhani</h3>
              <p>Slow-cooked perfection with authentic North Indian spices.</p>
            </div>
            <div className="specialty-item">
              <div className="specialty-icon">🫓</div>
              <h3>Stuffed & Butter Naans</h3>
              <p>Soft, buttery, and freshly tandoor-baked.</p>
            </div>
            <div className="specialty-item">
              <div className="specialty-icon">🍱</div>
              <h3>Thali Boxes</h3>
              <p>Complete meals starting at ₹229, packed hygienically for office lunches or home dinners.</p>
            </div>
            <div className="specialty-item">
              <div className="specialty-icon">�</div>
              <h3>Our Services</h3>
              <p>Explore our complete range of services including bulk orders, event catering, and customized food boxes.</p>
              <a href="/services" className="specialty-link">View All Services →</a>
            </div>
            <div className="specialty-item">
              <div className="specialty-icon">🥘</div>
              <h3>Bulk Food Orders</h3>
              <p>Large quantity orders for 20–100 people delivered in air-tight casseroles with disposals, perfect for offices, events, and family gatherings.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="why-choose-section">
        <div className="container">
          <h2 className="section-title">Why People Love The Quisine</h2>
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-check">✅</div>
              <span>100% Pure Vegetarian Food</span>
            </div>
            <div className="feature-item">
              <div className="feature-check">✅</div>
              <span>Made Fresh for Every Order</span>
            </div>
            <div className="feature-item">
              <div className="feature-check">✅</div>
              <span>Free Delivery in Kanpur</span>
            </div>
            <div className="feature-item">
              <div className="feature-check">✅</div>
              <span>Leak-proof Packaging with Full Cutlery Kit</span>
            </div>
            <div className="feature-item">
              <div className="feature-check">✅</div>
              <span>Customizable Event Menus</span>
            </div>
            <div className="feature-item">
              <div className="feature-check">✅</div>
              <span>Hygienic Cloud Kitchen Setup</span>
            </div>
          </div>
          <p className="features-tagline">
            We believe great food doesn't just fill your stomach — it fills your day with joy.
          </p>
        </div>
      </section>

      {/* Meet Our Team */}
      <section className="team-section">
        <div className="container">
          <h2 className="section-title">Meet Our Team</h2>
          <div className="team-content">
            <p>
              Behind every delicious meal is a passionate team of chefs and food lovers who care deeply about 
              quality and customer satisfaction.
            </p>
            <p>
              From selecting fresh ingredients daily to maintaining top hygiene standards, our team ensures your 
              food reaches you perfectly cooked, beautifully packed, and on time — every time.
            </p>
          </div>
        </div>
      </section>

      {/* Community & Values */}
      <section className="values-section">
        <div className="container">
          <h2 className="section-title">Our Promise</h2>
          <div className="values-content">
            <p>
              We're proud to be a part of Kanpur's food culture and constantly strive to serve the community 
              with love, integrity, and flavor.
            </p>
            <p>
              Sustainability and minimal food waste are at the heart of what we do — because we believe good 
              food should also do good.
            </p>
          </div>
        </div>
      </section>

      {/* CTA / Contact Section */}
      <section className="contact-cta-section">
        <div className="container">
          <h2 className="section-title">Don't let your hunger wait!!! We Deliver.</h2>
          <p className="contact-subtitle">Planning a party or simply craving homestyle food?</p>
          
          <div className="contact-options">
            <div className="contact-item">
              <span className="contact-icon">📞</span>
              <div className="contact-details">
                <span className="contact-label">Call us at</span>
                <a href="tel:+917992132123" className="contact-link">7992132123</a>
              </div>
            </div>
            <div className="contact-item">
              <span className="contact-icon">🌐</span>
              <div className="contact-details">
                <span className="contact-label">Order Online</span>
                <a href="/" className="contact-link">thequisine.in</a>
              </div>
            </div>
          </div>

          <p className="contact-tagline">
            From family dinners to festive feasts — The Quisine is just a click away!
          </p>

          <div className="final-cta-buttons">
            <button className="cta-primary" onClick={() => window.location.href = '/'}>
              Start Ordering
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}