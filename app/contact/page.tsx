"use client";
import { useState } from 'react';
import './contact.css';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('http://localhost:5001/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSubmitStatus('success');
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: ''
        });
        
        // Clear success message after 5 seconds
        setTimeout(() => setSubmitStatus(''), 5000);
      } else {
        setSubmitStatus('error');
        console.error('Form submission failed:', result.message);
        
        // Clear error message after 5 seconds
        setTimeout(() => setSubmitStatus(''), 5000);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus('error');
      
      // Clear error message after 5 seconds
      setTimeout(() => setSubmitStatus(''), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-page">
      {/* Hero Section */}
      <section className="contact-hero">
        <div className="container">
          <div className="hero-content">
            <h1>Contact The Quisine</h1>
            <p>We'd love to hear from you! Get in touch with us for any questions, feedback, or special requests.</p>
          </div>
        </div>
      </section>

      {/* Contact Information & Form Section */}
      <section className="contact-main">
        <div className="container">
          <div className="contact-grid">
            
            {/* Contact Information */}
            <div className="contact-info">
              <h2>Get in Touch</h2>
              <p className="contact-subtitle">
                Have questions about our menu, want to place a bulk order, or need assistance? 
                We're here to help!
              </p>

              <div className="contact-methods">
                <div className="contact-method">
                  <div className="method-icon">📞</div>
                  <div className="method-details">
                    <h3>Call Us</h3>
                    <p>For immediate assistance and order inquiries</p>
                    <a href="tel:7992132123" className="contact-link">+91 79921 32123</a>
                  </div>
                </div>

                <div className="contact-method">
                  <div className="method-icon">💬</div>
                  <div className="method-details">
                    <h3>WhatsApp</h3>
                    <p>Quick messages and order status updates</p>
                    <a 
                      href="https://wa.me/917992132123?text=Hi, I have a query about The Quisine services"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="contact-link"
                    >
                      Chat with us
                    </a>
                  </div>
                </div>

                <div className="contact-method">
                  <div className="method-icon">📧</div>
                  <div className="method-details">
                    <h3>Email</h3>
                    <p>For detailed inquiries and feedback</p>
                    <a href="mailto:support@thequisine.in" className="contact-link">support@thequisine.in</a>
                  </div>
                </div>

                <div className="contact-method">
                  <div className="method-icon">📍</div>
                  <div className="method-details">
                    <h3>Location</h3>
                    <p>We deliver across Kanpur</p>
                    <span className="contact-text">Kanpur, Uttar Pradesh</span>
                  </div>
                </div>
              </div>

              <div className="business-hours">
                <h3>Business Hours</h3>
                <div className="hours-grid">
                  <div className="day-hours">
                    <span className="day">Monday - Sunday</span>
                    <span className="hours">12:00 PM - 11:00 PM</span>
                  </div>
                </div>
                <p className="hours-note">
                  <em>We're open 7 days a week to serve you fresh, delicious meals!</em>
                </p>
              </div>
            </div>

            {/* Contact Form */}
            <div className="contact-form-section">
              <div className="form-container">
                <h2>Send us a Message</h2>
                <p className="form-subtitle">
                  Fill out the form below and we'll get back to you as soon as possible.
                </p>

                {submitStatus === 'success' && (
                  <div className="success-message">
                    <div className="success-icon">✓</div>
                    <div>
                      <h4>Message Sent Successfully!</h4>
                      <p>Thank you for contacting us. We'll get back to you within 24 hours.</p>
                    </div>
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="error-message">
                    <div className="error-icon">✗</div>
                    <div>
                      <h4>Failed to Send Message</h4>
                      <p>Please try again later or contact us directly via phone or WhatsApp.</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="contact-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="name">Full Name *</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="email">Email Address *</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="phone">Phone Number</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Enter your phone number"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="subject">Subject *</label>
                      <select
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select a subject</option>
                        <option value="general">General Inquiry</option>
                        <option value="order">Order Related</option>
                        <option value="catering">Event Catering</option>
                        <option value="bulk">Bulk Orders</option>
                        <option value="feedback">Feedback</option>
                        <option value="complaint">Complaint</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="message">Message *</label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={5}
                      placeholder="Tell us how we can help you..."
                    ></textarea>
                  </div>

                  <button 
                    type="submit" 
                    className={`submit-btn ${isSubmitting ? 'submitting' : ''}`}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner"></span>
                        Sending...
                      </>
                    ) : (
                      'Send Message'
                    )}
                  </button>
                </form>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Quick Actions Section */}
      <section className="quick-actions">
        <div className="container">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <div className="action-card">
              <div className="action-icon">🍽️</div>
              <h3>Browse Menu</h3>
              <p>Explore our delicious North Indian cuisine</p>
              <a href="/" className="action-btn">View Menu</a>
            </div>
            <div className="action-card">
              <div className="action-icon">📋</div>
              <h3>Track Order</h3>
              <p>Check the status of your current orders</p>
              <a href="/orders" className="action-btn">My Orders</a>
            </div>
            <div className="action-card">
              <div className="action-icon">�</div>
              <h3>Services</h3>
              <p>Explore our complete range of services and offerings</p>
              <a href="/services" className="action-btn">View Services</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}