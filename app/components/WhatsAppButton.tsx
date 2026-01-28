"use client";
import { useState, useEffect } from 'react';
import './WhatsAppButton.css';

export default function WhatsAppButton() {
  const [isVisible, setIsVisible] = useState(false);

  // Show button after page loads
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleWhatsAppClick = () => {
    // Replace with your restaurant's WhatsApp number (with country code, no + or spaces)
    const phoneNumber = '917992132123'; // Format: country code + number (no spaces)
    const message = encodeURIComponent(
      'Hi! I would like to order from The Quisine. Please share the menu and help me place an order. 🍽️'
    );
    
    // WhatsApp deep link - works on both mobile and desktop
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div 
      className={`whatsapp-float ${isVisible ? 'visible' : ''}`}
      onClick={handleWhatsAppClick}
      role="button"
      aria-label="Order on WhatsApp"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleWhatsAppClick();
        }
      }}
    >
      <svg 
        className="whatsapp-icon" 
        viewBox="0 0 32 32" 
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path fill="currentColor" d="M16 0c-8.837 0-16 7.163-16 16 0 2.825 0.737 5.607 2.137 8.048l-2.137 7.952 7.933-2.127c2.42 1.37 5.173 2.127 8.067 2.127 8.837 0 16-7.163 16-16s-7.163-16-16-16zM16 29.467c-2.482 0-4.908-0.646-7.07-1.87l-0.507-0.292-5.245 1.408 1.408-5.245-0.292-0.507c-1.224-2.162-1.87-4.588-1.87-7.070 0-7.72 6.28-14 14-14s14 6.28 14 14-6.28 14-14 14zM21.617 18.753c-0.292-0.146-1.727-0.853-1.996-0.951-0.268-0.097-0.463-0.146-0.658 0.146s-0.756 0.951-0.927 1.145c-0.171 0.195-0.342 0.219-0.634 0.073-0.292-0.146-1.232-0.454-2.347-1.448-0.868-0.774-1.454-1.729-1.625-2.021s-0.018-0.449 0.128-0.594c0.131-0.131 0.292-0.342 0.439-0.512s0.195-0.293 0.292-0.488c0.098-0.195 0.049-0.366-0.024-0.512s-0.658-1.586-0.902-2.171c-0.238-0.571-0.479-0.494-0.658-0.502-0.171-0.008-0.366-0.010-0.561-0.010s-0.512 0.073-0.78 0.366c-0.268 0.293-1.024 1.001-1.024 2.441s1.049 2.832 1.195 3.027c0.146 0.195 2.064 3.152 5.002 4.42 0.699 0.301 1.244 0.481 1.668 0.615 0.701 0.223 1.339 0.191 1.843 0.116 0.562-0.084 1.727-0.706 1.971-1.389s0.244-1.268 0.171-1.389c-0.073-0.122-0.268-0.195-0.561-0.342z"/>
      </svg>
      <div className="whatsapp-pulse"></div>
      <div className="whatsapp-tooltip">Order on WhatsApp</div>
    </div>
  );
}
