"use client";
import { useState } from "react";
import "./PaymentModal.css";

export default function PaymentModal({ isOpen, onClose, currentPaymentMethod, onSelectPayment, isEligibleForCash, minimumCashAmount }) {
  const [selectedMethod, setSelectedMethod] = useState(currentPaymentMethod);

  const handleSelectPayment = (method) => {
    if (method === 'cash' && !isEligibleForCash) return;
    setSelectedMethod(method);
    onSelectPayment(method);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="payment-modal-header">
          <h2>Choose payment mode</h2>
          <button className="close-payment-modal" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Payment Options */}
        <div className="payment-options-list">
          {/* Pay Online */}
          <div 
            className={`payment-option-item ${selectedMethod === 'online' ? 'selected' : ''}`}
            onClick={() => handleSelectPayment('online')}
          >
            <div className="payment-option-content">
              <div className="payment-option-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <line x1="2" y1="10" x2="22" y2="10" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <div className="payment-option-text">
                <div className="payment-option-name">Pay Online</div>
                <div className="payment-option-desc">UPI, Cards, Netbanking, Wallets</div>
              </div>
            </div>
            <div className="payment-option-radio">
              <div className={`radio-circle ${selectedMethod === 'online' ? 'selected' : ''}`}>
                {selectedMethod === 'online' && <div className="radio-dot"></div>}
              </div>
            </div>
          </div>

          {/* Cash on Delivery */}
          <div 
            className={`payment-option-item ${selectedMethod === 'cash' ? 'selected' : ''} ${!isEligibleForCash ? 'disabled' : ''}`}
            onClick={() => handleSelectPayment('cash')}
          >
            <div className="payment-option-content">
              <div className="payment-option-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="7" width="20" height="10" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="m4.93 4.93 4.24 4.24" stroke="currentColor" strokeWidth="2"/>
                  <path d="m14.83 9.17 4.24-4.24" stroke="currentColor" strokeWidth="2"/>
                  <path d="m14.83 14.83 4.24 4.24" stroke="currentColor" strokeWidth="2"/>
                  <path d="m9.17 14.83-4.24 4.24" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <div className="payment-option-text">
                <div className="payment-option-name">Cash</div>
                <div className={`payment-option-desc ${!isEligibleForCash ? 'error-text' : ''}`}>
                  {!isEligibleForCash ? 
                    `Minimum ₹${minimumCashAmount} required` : 
                    `Available for orders ₹${minimumCashAmount}+`
                  }
                </div>
              </div>
            </div>
            <div className="payment-option-radio">
              <div className={`radio-circle ${selectedMethod === 'cash' ? 'selected' : ''} ${!isEligibleForCash ? 'disabled' : ''}`}>
                {selectedMethod === 'cash' && <div className="radio-dot"></div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}