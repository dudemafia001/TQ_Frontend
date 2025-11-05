"use client";
import { useEffect } from 'react';
import './modal.css';

export default function OrderDetailsModal({ order, isOpen, onClose }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !order) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const getStatusIcon = (status) => {
    const icons = {
      placed: '📝',
      confirmed: '✅',
      preparing: '👨‍🍳',
      out_for_delivery: '🚚',
      delivered: '✅',
      cancelled: '❌'
    };
    return icons[status] || '📦';
  };

  const getPaymentStatusClass = (status) => {
    switch (status) {
      case 'paid': return 'payment-paid';
      case 'pending': return 'payment-pending';
      case 'failed': return 'payment-failed';
      default: return 'payment-pending';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Order Details #{order.orderId}</h2>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          {/* Order Information Grid */}
          <div className="order-info-grid">
            <div className="info-card">
              <h4>Customer Information</h4>
              <p><strong>{order.customerInfo.name}</strong></p>
              <p>{order.customerInfo.phone}</p>
              {order.customerInfo.email && <p>{order.customerInfo.email}</p>}
            </div>

            <div className="info-card delivery-address-card">
              <h4>📍 Delivery Address</h4>
              <p><strong>{order.deliveryAddress.address}</strong></p>
              
              {/* Always Show Map Actions */}
              <div className="location-section">
                {order.deliveryAddress.coordinates ? (
                  <div className="location-details">
                    <div className="coordinates-badge">
                      📌 Lat: {order.deliveryAddress.coordinates.lat?.toFixed(6)}, 
                      Lng: {order.deliveryAddress.coordinates.lng?.toFixed(6)}
                    </div>
                    
                    {/* Google Maps Actions */}
                    <div className="map-actions">
                      <a 
                        href={`https://www.google.com/maps?q=${order.deliveryAddress.coordinates.lat},${order.deliveryAddress.coordinates.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="map-button primary"
                      >
                        � Open in Google Maps
                      </a>
                      <a 
                        href={`https://maps.google.com/maps?daddr=${order.deliveryAddress.coordinates.lat},${order.deliveryAddress.coordinates.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="map-button secondary"
                      >
                        🧭 Get Directions
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="no-coordinates">
                    <p className="warning-text">⚠️ No precise coordinates available</p>
                    <a 
                      href={`https://www.google.com/maps/search/${encodeURIComponent(order.deliveryAddress.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="map-button view-location"
                    >
                      � View Location
                    </a>
                  </div>
                )}
              </div>
              
              {/* Additional Address Details */}
              {(order.deliveryAddress.houseNumber || order.deliveryAddress.street || order.deliveryAddress.landmark) && (
                <div className="address-details">
                  {order.deliveryAddress.houseNumber && (
                    <p><strong>House/Flat:</strong> {order.deliveryAddress.houseNumber}</p>
                  )}
                  {order.deliveryAddress.street && (
                    <p><strong>Street:</strong> {order.deliveryAddress.street}</p>
                  )}
                  {order.deliveryAddress.landmark && (
                    <p><strong>Landmark:</strong> {order.deliveryAddress.landmark}</p>
                  )}
                  {order.deliveryAddress.instructions && (
                    <p><strong>Instructions:</strong> {order.deliveryAddress.instructions}</p>
                  )}
                </div>
              )}
              
              {order.estimatedDeliveryTime && (
                <p className="highlight">⏰ ETA: {order.estimatedDeliveryTime}</p>
              )}
            </div>

            <div className="info-card">
              <h4>Order Timeline</h4>
              <p><strong>Placed:</strong> {formatDate(order.createdAt)}</p>
              <p><strong>Updated:</strong> {formatDate(order.updatedAt)}</p>
              <p><strong>Status:</strong> 
                <span className="highlight"> {order.orderStatus.replace('_', ' ').toUpperCase()}</span>
              </p>
            </div>

            <div className="info-card">
              <h4>Payment Information</h4>
              <p><strong>Method:</strong> {order.paymentInfo.method === 'online' ? 'Online Payment' : 'Cash on Delivery'}</p>
              <p><strong>Status:</strong> 
                <span className={`payment-status ${getPaymentStatusClass(order.paymentInfo.status)}`}>
                  {order.paymentInfo.status}
                </span>
              </p>
              {order.paymentInfo.paymentId && (
                <p><strong>Payment ID:</strong> {order.paymentInfo.paymentId}</p>
              )}
            </div>
          </div>

          {/* Applied Coupon */}
          {order.appliedCoupon?.code && (
            <div className="coupon-info">
              <div className="coupon-code">🎫 Coupon Applied: {order.appliedCoupon.code}</div>
              <div className="coupon-discount">Discount: {formatCurrency(order.appliedCoupon.discount)}</div>
            </div>
          )}

          {/* Order Items */}
          <div className="order-items-section">
            <h3 className="section-title">Order Items</h3>
            <table className="items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Variant</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <div className="item-name">{item.productName}</div>
                    </td>
                    <td>
                      <div className="item-variant">{item.variant}</div>
                    </td>
                    <td className="price-cell">
                      {formatCurrency(item.price)}
                    </td>
                    <td>
                      <span className="quantity-badge">{item.quantity}</span>
                    </td>
                    <td className="price-cell">
                      {formatCurrency(item.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pricing Summary */}
          <div className="pricing-summary">
            <h3 className="section-title">Pricing Breakdown</h3>
            
            <div className="pricing-row">
              <span className="pricing-label">Subtotal</span>
              <span className="pricing-value">{formatCurrency(order.pricing.subtotal)}</span>
            </div>

            {order.pricing.packagingCharge > 0 && (
              <div className="pricing-row">
                <span className="pricing-label">Packaging Charge</span>
                <span className="pricing-value">{formatCurrency(order.pricing.packagingCharge)}</span>
              </div>
            )}

            {order.pricing.couponDiscount > 0 && (
              <div className="pricing-row">
                <span className="pricing-label">Coupon Discount</span>
                <span className="pricing-value discount">-{formatCurrency(order.pricing.couponDiscount)}</span>
              </div>
            )}

            <div className="pricing-row">
              <span className="pricing-label">Final Total</span>
              <span className="pricing-value final">{formatCurrency(order.pricing.finalTotal)}</span>
            </div>
          </div>

          {/* Order Status Timeline */}
          <div className="timeline-section">
            <h3 className="section-title">Order Status History</h3>
            <div className="timeline-item">
              <div className="timeline-icon">
                {getStatusIcon(order.orderStatus)}
              </div>
              <div className="timeline-content">
                <h5>Current Status: {order.orderStatus.replace('_', ' ').toUpperCase()}</h5>
                <p>Last updated: {formatDate(order.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}