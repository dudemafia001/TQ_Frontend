"use client";
import { useState } from 'react';
import './services.css';

export default function ServicesPage() {
  const bulkFoodWhatsAppMessage = encodeURIComponent(
    "Hi, I'm interested in your Bulk Food service. Please provide more details about pricing and availability."
  );

  const cateringWhatsAppMessage = encodeURIComponent(
    "Hi, I'd like to inquire about your Event Catering services. Please share more information about packages and pricing."
  );

  const customBoxesWhatsAppMessage = encodeURIComponent(
    "Hi, I'm interested in your Customized Food Boxes. Please provide details about the available options and minimum quantities."
  );

  const whatsappNumber = "917992132123";

  return (
    <div className="services-page">
      {/* Hero Section */}
      <section className="services-hero">
        <div className="container">
          <div className="hero-content">
            <h1>Our Services</h1>
            <p>From bulk orders to event catering, we provide delicious North Indian cuisine for all your needs</p>
          </div>
        </div>
      </section>

      {/* Services Content */}
      <section className="services-content">
        <div className="container">
          
          {/* Bulk Food Service */}
          <div className="service-section">
            <div className="service-header">
              <h2>🍽️ Bulk Food Orders</h2>
              <p>Perfect for offices, gatherings, and large groups</p>
            </div>
            
            <div className="service-details">
              <div className="menu-section">
                <h3>Menu Includes:</h3>
                <div className="menu-grid">
                  <div className="menu-category">
                    <h4>Main</h4>
                    <ul>
                      <li>Matar Paneer, Kadhai Paneer, or Paneer Butter Masala (Any one)</li>
                      <li>Dry Vegetables</li>
                      <li>Dal/Chola (Any one)</li>
                    </ul>
                  </div>
                  
                  <div className="menu-category">
                    <h4>Dessert</h4>
                    <ul>
                      <li>Gulab Jamun or Kheer (Any one)</li>
                    </ul>
                  </div>
                  
                  <div className="menu-category">
                    <h4>Accompaniments</h4>
                    <ul>
                      <li>Jeera Rice or Matar Pulao (Any one)</li>
                      <li>Fresh Breads</li>
                      <li>Salad</li>
                      <li>Papad</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="pricing-section">
                <h3>Bulk Food Pricing:</h3>
                <div className="pricing-grid">
                  <div className="price-card">
                    <div className="quantity">20-25 People</div>
                    <div className="price">₹4,999</div>
                  </div>
                  <div className="price-card">
                    <div className="quantity">40-50 People</div>
                    <div className="price">₹9,499</div>
                  </div>
                  <div className="price-card">
                    <div className="quantity">90-100 People</div>
                    <div className="price">₹17,999</div>
                  </div>
                </div>
              </div>

              <div className="cta-section">
                <a 
                  href={`https://wa.me/${whatsappNumber}?text=${bulkFoodWhatsAppMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="whatsapp-btn"
                >
                  💬 Enquire on WhatsApp
                </a>
              </div>
            </div>
          </div>

          {/* Event Catering Service */}
          <div className="service-section">
            <div className="service-header">
              <h2>🎉 Event Catering</h2>
              <p>Complete catering solutions for weddings, parties, and special occasions</p>
            </div>
            
            <div className="service-details">
              <div className="menu-section">
                <h3>Catering Menu Includes:</h3>
                <div className="menu-grid">
                  <div className="menu-category">
                    <h4>Starters (Choose 2)</h4>
                    <ul>
                      <li>Chilly Paneer Dry</li>
                      <li>Honey Chilly Potato</li>
                      <li>Aloo Cutlet</li>
                      <li>Hara Bhara Kebab</li>
                      <li>Spring Roll</li>
                    </ul>
                  </div>
                  
                  <div className="menu-category">
                    <h4>Beverages</h4>
                    <ul>
                      <li>Cold Drinks</li>
                    </ul>
                  </div>
                  
                  <div className="menu-category">
                    <h4>Main Course & Sides</h4>
                    <ul>
                      <li>Matar Paneer, Kadhai Paneer, or Paneer Butter Masala (Any one)</li>
                      <li>Dry Vegetables</li>
                      <li>Dal/Chola (Any one)</li>
                      <li>Jeera Rice or Matar Pulao (Any one)</li>
                      <li>Tandoor Breads</li>
                      <li>Fresh Salad</li>
                      <li>Papad</li>
                      <li>Gulab Jamun or Kheer (Any one)</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="pricing-section">
                <h3>Catering Pricing:</h3>
                <div className="pricing-grid">
                  <div className="price-card catering-price">
                    <div className="quantity">Per Person</div>
                    <div className="price">₹350</div>
                    <div className="note">Minimum order applies</div>
                  </div>
                </div>
              </div>

              <div className="cta-section">
                <a 
                  href={`https://wa.me/${whatsappNumber}?text=${cateringWhatsAppMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="whatsapp-btn"
                >
                  💬 Enquire on WhatsApp
                </a>
              </div>
            </div>
          </div>

          {/* Customized Boxes Service */}
          <div className="service-section">
            <div className="service-header">
              <h2>📦 Customized Food Boxes</h2>
              <p>Convenient individual meal boxes for events and corporate orders</p>
            </div>
            
            <div className="service-details">
              <div className="boxes-grid">
                <div className="box-option">
                  <h4>Basic Box</h4>
                  <div className="box-contents">
                    <ul>
                      <li>Puri</li>
                      <li>Sabzi</li>
                      <li>Gulab Jamun</li>
                    </ul>
                  </div>
                  <div className="box-pricing">
                    <span className="box-price">₹60 per box</span>
                    <span className="min-qty">Minimum: 50 boxes</span>
                  </div>
                </div>

                <div className="box-option">
                  <h4>Complete Thali Box</h4>
                  <div className="box-contents">
                    <ul>
                      <li>Paneer Curry</li>
                      <li>Dal</li>
                      <li>Dry Vegetables</li>
                      <li>Rice</li>
                      <li>Roti/Kachori</li>
                      <li>Gulab Jamun</li>
                    </ul>
                  </div>
                  <div className="box-pricing">
                    <span className="box-price">₹100 per box</span>
                    <span className="min-qty">Minimum: 50 boxes</span>
                  </div>
                </div>

                <div className="box-option">
                  <h4>Snacks Box</h4>
                  <div className="box-contents">
                    <ul>
                      <li>Sandwich/Burger</li>
                      <li>Cutlet</li>
                      <li>Gulab Jamun</li>
                    </ul>
                  </div>
                  <div className="box-pricing">
                    <span className="box-price">₹60 per box</span>
                    <span className="min-qty">Minimum: 50 boxes</span>
                  </div>
                </div>
              </div>

              <div className="cta-section">
                <a 
                  href={`https://wa.me/${whatsappNumber}?text=${customBoxesWhatsAppMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="whatsapp-btn"
                >
                  💬 Enquire on WhatsApp
                </a>
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="services-contact">
            <h2>Need Something Custom?</h2>
            <p>We can customize our services based on your specific requirements. Get in touch with us!</p>
            <div className="contact-options">
              <a href="tel:7992132123" className="contact-btn phone-btn">
                📞 Call Us: +91 79921 32123
              </a>
              <a href="/contact" className="contact-btn contact-page-btn">
                📧 Contact Form
              </a>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
