'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/app/contexts/CartContext';
import { useAuth } from '@/app/contexts/AuthContext';
import config, { buildApiUrl } from '@/config';
import './success.css';

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const { clearCart } = useCart();
  const { user } = useAuth();
  const [latestOrder, setLatestOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Clear cart on successful order
    clearCart();
    setLoading(false);
  }, [clearCart]);

  return (
    <div className="success-container">
      <div className="success-content">
        <div className="success-icon">✅</div>
        <h1 className="success-title">Order Placed Successfully!</h1>
        <p className="success-message">
          Thank you for your order. We&apos;ll prepare your delicious food and deliver it to you soon.
        </p>

        <div className="success-actions">
          <button 
            className="continue-shopping-btn"
            onClick={() => router.push('/')}
          >
            Continue Shopping
          </button>
          <button 
            className="view-orders-btn"
            onClick={() => router.push('/orders')}
          >
            View Orders
          </button>
        </div>
      </div>

      <style jsx>{`
        .success-container {
          min-height: calc(100vh - 120px);
          background: #f8f9fa;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }

        .success-content {
          background: white;
          padding: 60px 40px;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          text-align: center;
          max-width: 500px;
          width: 100%;
        }

        .success-icon {
          font-size: 80px;
          margin-bottom: 24px;
        }

        .success-title {
          font-size: 32px;
          font-weight: 700;
          color: #2d3748;
          margin: 0 0 16px 0;
        }

        .success-message {
          font-size: 16px;
          color: #4a5568;
          line-height: 1.6;
          margin-bottom: 32px;
        }

        .success-details {
          background: #f7fafc;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 32px;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .detail-item:last-child {
          margin-bottom: 0;
        }

        .detail-label {
          font-size: 14px;
          color: #4a5568;
        }

        .detail-value {
          font-size: 14px;
          font-weight: 600;
          color: #2d3748;
        }

        .success-actions {
          display: flex;
          gap: 12px;
          flex-direction: column;
        }

        .continue-shopping-btn,
        .view-orders-btn {
          padding: 14px 24px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }

        .continue-shopping-btn {
          background: #dd9933;
          color: white;
        }

        .continue-shopping-btn:hover {
          background: #c87f2a;
          transform: translateY(-2px);
        }

        .view-orders-btn {
          background: transparent;
          color: #dd9933;
          border: 2px solid #dd9933;
        }

        .view-orders-btn:hover {
          background: #dd9933;
          color: white;
        }

        @media (min-width: 640px) {
          .success-actions {
            flex-direction: row;
          }
        }
      `}</style>
    </div>
  );
}