'use client';

import React, { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { CartContext } from '../contexts/CartContext';
import { AuthContext } from '../contexts/AuthContext';
import { LocationContext } from '../contexts/LocationContext';
import ZomatoLocationModal from '../components/ZomatoLocationModal';
import PaymentModal from '../components/PaymentModal';
import './checkout.css';
import config from '../../config';

// Use CartItem type from context - we'll work with the context's interface
type CartItemType = {
  id: string;
  name?: string;
  variant?: string;
  price?: number;
  quantity: number;
};

interface CustomerInfo {
  fullName: string;
  phone: string;
  email: string;
}

interface AddressDetails {
  houseNumber: string;
  street: string;
  landmark: string;
}

interface DeliveryAddress {
  type: string;
  address: string;
}

interface Coupon {
  _id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_value: number;
  valid_to: string;
}

const buildApiUrl = (endpoint: string) => {
  return `${config.api.baseUrl}${endpoint}`;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, updateQuantity, isLoading } = useContext(CartContext) || {};
  const { user } = useContext(AuthContext) || {};
  const { userLocation, setUserLocation } = useContext(LocationContext) || {};

  // State management
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    fullName: '',
    phone: '',
    email: ''
  });

  // Fetch real user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          // For now, use the username from auth context and construct phone/email
          // In a real app, you'd have a user profile endpoint
          setCustomerInfo({
            fullName: user,  // Using username as full name
            phone: '+918299585475',  // Real phone number
            email: 'ambujdwivedi1947@gmail.com'  // Real email
          });
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Fallback to basic user data
          setCustomerInfo({
            fullName: user,
            phone: '+918299585475',
            email: 'ambujdwivedi1947@gmail.com'
          });
        }
      }
    };

    fetchUserData();
  }, [user]);

  // Calculate delivery info when userLocation changes or component mounts
  useEffect(() => {
    if (userLocation && userLocation.lat && userLocation.lng) {
      // Simulate delivery calculation for existing location
      const estimatedMinutes = 35; // Default estimation
      setDeliveryInfo({
        duration: `${estimatedMinutes} mins (estimated)`,
        durationMinutes: estimatedMinutes,
        distance: userLocation.distance ? userLocation.distance.toString() : '3.5',
        available: true
      });
    } else {
      // Set default delivery for current address (Kanpur location)
      const defaultMinutes = 45; // Default delivery time for Kanpur
      setDeliveryInfo({
        duration: `${defaultMinutes} mins (estimated)`,
        durationMinutes: defaultMinutes,
        distance: '5.2',
        available: true
      });
    }
  }, [userLocation]);

  const [addressDetails] = useState<AddressDetails>({
    houseNumber: '',
    street: '',
    landmark: ''
  });

  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>({
    type: 'Home',
    address: ''
  });

  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isUserDetailsExpanded, setIsUserDetailsExpanded] = useState(true);
  
  // Delivery time state
  const [deliveryInfo, setDeliveryInfo] = useState<{
    duration: string;
    durationMinutes: number | null;
    distance: string | null;
    available: boolean;
  }>({
    duration: 'Calculating...',
    durationMinutes: null,
    distance: null,
    available: true
  });
  
  // Coupon states
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [showAllCoupons, setShowAllCoupons] = useState(false);

  // Constants
  const minimumCashAmount = 499;
  const packagingCharge = 20;
  const deliveryCharge = 0;

  // Calculate subtotal
  const subtotal = (cartItems || []).reduce((sum: number, item: CartItemType) => sum + ((item.price || 0) * item.quantity), 0);
  const finalTotal = subtotal + packagingCharge + deliveryCharge - couponDiscount;
  const isEligibleForCash = finalTotal >= minimumCashAmount;

  // Load coupons
  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const apiUrl = buildApiUrl(config.api.endpoints.coupons.active);
        console.log('Fetching coupons from:', apiUrl);
        const response = await fetch(apiUrl);
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Coupons response:', data);
        
        if (Array.isArray(data) && data.length > 0) {
          // Map backend coupon structure to frontend structure
          const mappedCoupons = data.map(coupon => ({
            _id: coupon._id || coupon.id || Date.now().toString(),
            code: coupon.code,
            description: coupon.description,
            discount_type: (coupon.discount_type === 'percent' ? 'percentage' : 'fixed') as 'percentage' | 'fixed',
            discount_value: coupon.discount_value,
            min_order_value: coupon.min_purchase_amount,
            valid_to: coupon.valid_to
          }));
          setCoupons(mappedCoupons);
          console.log(`✅ Successfully loaded ${mappedCoupons.length} coupons from backend:`, mappedCoupons);
        } else if (Array.isArray(data) && data.length === 0) {
          console.log('📋 Backend returned empty coupons array');
          setCoupons([]);
        } else {
          console.log('❌ Invalid response format from backend:', typeof data, data);
          setCoupons([]);
        }
      } catch (error) {
        console.error('Error fetching coupons:', error);
        setCoupons([]);
      }
    };

    fetchCoupons();
  }, []);

  // Mobile payment modal fix
  useEffect(() => {
    // Add mobile-friendly touch handling for payment modals
    const handleTouchStart = (e: TouchEvent) => {
      // Prevent zoom on double tap for payment buttons
      if ((e.target as HTMLElement)?.closest('.razorpay-container, .razorpay-checkout-frame')) {
        e.preventDefault();
      }
    };

    // Ensure Razorpay modal is properly positioned on mobile
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        const style = document.createElement('style');
        style.textContent = `
          .razorpay-container {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            z-index: 999999 !important;
          }
        `;
        document.head.appendChild(style);
        
        // Clean up on unmount
        return () => {
          document.head.removeChild(style);
        };
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('resize', handleResize);
    handleResize(); // Call once on mount

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Functions
  const applyCoupon = (code: string) => {
    if (!code.trim()) {
      alert('Please enter a coupon code');
      return;
    }

    const coupon = coupons.find(c => c.code.toUpperCase() === code.toUpperCase());
    if (!coupon) {
      alert('Invalid coupon code. Please check and try again.');
      return;
    }

    // Check if coupon is already applied
    if (appliedCoupon && appliedCoupon.code === coupon.code) {
      alert('This coupon is already applied');
      return;
    }

    if (subtotal < coupon.min_order_value) {
      alert(`Minimum order value for this coupon is ₹${coupon.min_order_value}. Your current order is ₹${subtotal.toFixed(2)}`);
      return;
    }

    const discount = coupon.discount_type === 'percentage' 
      ? Math.min((subtotal * coupon.discount_value) / 100, subtotal * 0.5) // Max 50% discount
      : Math.min(coupon.discount_value, subtotal); // Can't discount more than subtotal

    setAppliedCoupon(coupon);
    setCouponDiscount(discount);
    setCouponCode('');
    setShowAllCoupons(false); // Hide coupons after applying
    
    // Success feedback
    alert(`Coupon applied successfully! You saved ₹${discount.toFixed(2)}`);
  };

  const removeCoupon = () => {
    const savedAmount = couponDiscount;
    setAppliedCoupon(null);
    setCouponDiscount(0);
    // Provide feedback
    alert(`Coupon removed. ₹${savedAmount.toFixed(2)} discount has been removed from your total.`);
  };

  const handlePlaceOrder = async () => {
    if (paymentMethod === 'online') {
      await processOnlinePayment();
    } else {
      await processCashPayment();
    }
  };

  const processOnlinePayment = async () => {
    try {
      setIsProcessingPayment(true);
      
      const orderResponse = await fetch(buildApiUrl(config.api.endpoints.payments.createOrder), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalTotal,
          currency: 'INR',
          receipt: `order_${Date.now()}`
        })
      });

      const orderData = await orderResponse.json();
      if (!orderData.success) {
        throw new Error(orderData.message || 'Failed to create order');
      }

      const options = {
        key: orderData.key_id,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'The Quisine',
        description: 'Food Order Payment',
        order_id: orderData.order.id,
        handler: async (response: any) => {
          // Handle payment success
          console.log('Payment successful:', response);
          router.push('/checkout/success');
        },
        modal: {
          ondismiss: function() {
            console.log('Payment modal dismissed');
            setIsProcessingPayment(false);
          },
          escape: true,
          backdropclose: false
        },
        prefill: {
          name: customerInfo.fullName,
          email: customerInfo.email,
          contact: customerInfo.phone
        },
        theme: { 
          color: 'rgb(184, 134, 11)',
          backdrop_color: 'rgba(0, 0, 0, 0.6)'
        },
        config: {
          display: {
            blocks: {
              banks: {
                name: 'Pay using ' + (window.innerWidth < 768 ? 'UPI/Cards' : 'NetBanking'),
                instruments: [
                  {
                    method: 'card'
                  },
                  {
                    method: 'upi'
                  },
                  {
                    method: 'netbanking'
                  }
                ]
              }
            },
            sequence: ['block.banks'],
            preferences: {
              show_default_blocks: true
            }
          }
        }
      };

      // @ts-expect-error Razorpay is loaded dynamically via script tag
      const rzp = new window.Razorpay(options);
      rzp.open();
      
    } catch (error) {
      console.error('Payment processing error:', error);
      alert('Payment processing failed. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const processCashPayment = async () => {
    try {
      setIsProcessingPayment(true);
      
      const response = await fetch(buildApiUrl(config.api.endpoints.payments.cash), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalTotal,
          orderDetails: {
            userId: user,
            cartItems,
            customerInfo,
            deliveryAddress,
            addressDetails,
            subtotal,
            packagingCharge,
            couponDiscount,
            finalTotal,
            appliedCoupon
          }
        })
      });

      const result = await response.json();
      if (result.success) {
        router.push('/checkout/success');
      } else {
        alert(result.message || 'Failed to place cash order');
      }
      
    } catch (error) {
      console.error('Cash payment error:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Show loading state while cart is being loaded
  if (isLoading) {
    return (
      <div className="checkout-container">
        <div className="loading-cart">
          <div className="loading-spinner"></div>
          <h2>Loading your cart...</h2>
        </div>
      </div>
    );
  }

  // Redirect if cart is empty after loading
  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="checkout-container">
        <div className="empty-cart">
          <h2>Your cart is empty</h2>
          <button onClick={() => router.push('/')} className="continue-shopping-btn">
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      {/* Header */}
      <div className="checkout-header">
        <button className="back-btn" onClick={() => router.push('/')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1>Checkout</h1>
      </div>

      <div className="checkout-content">
        {/* Left Side - Desktop */}
        <div className="checkout-left">
          {/* Your Details Section */}
          <div className="section">
            <div className="section-header">
              <h2>Your Details</h2>
              <button 
                className="toggle-btn"
                onClick={() => setIsUserDetailsExpanded(!isUserDetailsExpanded)}
              >
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none"
                  style={{ transform: isUserDetailsExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}
                >
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            
            {isUserDetailsExpanded && (
              <div className="user-details">
              <div className="detail-item">
                <span className="detail-icon">👤</span>
                <span className="detail-text">{customerInfo.fullName}</span>
              </div>
              <div className="detail-item">
                <span className="detail-icon">📞</span>
                <span className="detail-text">{customerInfo.phone}</span>
              </div>
              <div className="detail-item">
                <span className="detail-icon">📧</span>
                <span className="detail-text">{customerInfo.email}</span>
              </div>
            </div>
            )}
          </div>

          {/* Delivery Address Section */}
          <div className="section">
            <div className="section-header">
              <h2>Delivery Address</h2>
              <button 
                className="change-btn" 
                onClick={() => setShowLocationModal(true)}
              >
                Change Address
              </button>
            </div>
            
            <div className="address-content">
              <div className="address-type">
                <span className="home-icon">🏠</span>
                <span>Home</span>
              </div>
              <div className="address-text">
                {deliveryAddress.address || userLocation?.address || '4040, Nachital Nilaya, 11th Cross Road, Bellandur Main Rd, Bellandur, Bengaluru, Karnataka, India, Bengaluru, 560103'}
              </div>
            </div>
          </div>

          {/* Delivery Time Section */}
          <div className="section">
            <div className="section-header">
              <h2>Delivery Time</h2>
            </div>
            <div className="delivery-info">
              <div className="delivery-option selected">
                <span className="delivery-label">Deliver Later</span>
                <div className="delivery-time">
                  {(() => {
                    if (!deliveryInfo.durationMinutes) {
                      return `Your order will be delivered on ${new Date(Date.now() + 24*60*60*1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} between 12:00 - 12:30`;
                    }
                    
                    const deliveryTime = new Date(Date.now() + deliveryInfo.durationMinutes * 60 * 1000);
                    const deliveryEndTime = new Date(deliveryTime.getTime() + 30 * 60 * 1000); // 30 minutes window
                    
                    const formatTime = (date: Date) => date.toLocaleTimeString('en-GB', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: false 
                    });
                    
                    return `Your order will be delivered on ${deliveryTime.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} between ${formatTime(deliveryTime)} - ${formatTime(deliveryEndTime)}`;
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Mode Section */}
          <div className="section">
            <div className="section-header">
              <h2>Payment Mode</h2>
            </div>
            <div className="payment-content">
              <div className="payment-methods">
                <div 
                  className={`payment-method-card ${paymentMethod === 'online' ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod('online')}
                >
                  <div className="payment-method-info">
                    <div className="payment-icon">💳</div>
                    <div className="payment-details">
                      <div className="payment-title">Pay Online</div>
                      <div className="payment-subtitle">UPI, Cards, Wallets & more</div>
                    </div>
                  </div>
                  <div className="payment-total">₹{finalTotal.toFixed(2)}</div>
                </div>
                
                <div 
                  className={`payment-method-card ${paymentMethod === 'cash' ? 'selected' : ''} ${!isEligibleForCash ? 'disabled' : ''}`}
                  onClick={() => isEligibleForCash && setPaymentMethod('cash')}
                >
                  <div className="payment-method-info">
                    <div className="payment-icon">💵</div>
                    <div className="payment-details">
                      <div className="payment-title">Cash on Delivery</div>
                      <div className="payment-subtitle">
                        {isEligibleForCash ? 'Pay cash when delivered' : `Minimum ₹${minimumCashAmount} required`}
                      </div>
                    </div>
                  </div>
                  {paymentMethod === 'cash' && isEligibleForCash && (
                    <div className="payment-total">₹{finalTotal.toFixed(2)}</div>
                  )}
                </div>
              </div>
              
              <button 
                className="place-order-btn"
                onClick={() => {
                  if (!paymentMethod) {
                    alert('Please select a payment method first');
                    return;
                  }
                  if (paymentMethod === 'online') {
                    setShowPaymentModal(true);
                  } else if (paymentMethod === 'cash' && isEligibleForCash) {
                    handlePlaceOrder(); // Direct order for cash
                  }
                }}
                disabled={isProcessingPayment || (paymentMethod === 'cash' && !isEligibleForCash)}
              >
                {isProcessingPayment ? 'Processing...' : 
                 !paymentMethod ? 'Select Payment Method' :
                 paymentMethod === 'online' ? 'Proceed to Payment' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Side - Desktop and Mobile */}
        <div className="checkout-right">
          {/* Cart Summary Section */}
          <div className="section">
            <div className="section-header">
              <h2>Cart Summary ({cartItems.reduce((sum: number, item: CartItemType) => sum + item.quantity, 0)} items)</h2>
            </div>
            
            {/* Cart Items */}
            <div className="cart-items">
              {cartItems.map((item: CartItemType) => (
                <div key={item.id} className="cart-item">
                  <div className="item-details">
                    <h3 className="item-name">{item.name || 'Hyderabadi Chicken Biryani'}</h3>
                    {item.variant && (
                      <div className="item-variant">{item.variant}</div>
                    )}
                  </div>
                  <div className="item-controls">
                    <div className="quantity-controls">
                      <button 
                        className="quantity-btn"
                        onClick={() => updateQuantity?.(item.id, item.quantity - 1)}
                      >
                        −
                      </button>
                      <span className="quantity">{item.quantity}</span>
                      <button 
                        className="quantity-btn"
                        onClick={() => updateQuantity?.(item.id, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <div className="item-price">₹{((item.price || 364) * item.quantity).toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="add-more-items" onClick={() => router.push('/')}>
              Add more items
            </button>
          </div>

          {/* Special Request Section */}
          <div className="section">
            <div className="special-request-input">
              <span className="request-icon">📝</span>
              <input 
                type="text" 
                placeholder="Enter your special request"
                className="request-input"
              />
            </div>
          </div>

          {/* Apply Coupon Section */}
          <div className="section">
            <div className="coupon-header">
              <h3>Apply Coupon</h3>
              <button 
                className="view-coupons"
                onClick={() => setShowAllCoupons(!showAllCoupons)}
              >
                View all coupons →
              </button>
            </div>
            
            <div className="coupon-input-wrapper">
              <span className="coupon-icon">🏷️</span>
              <input
                type="text"
                placeholder="Enter a coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="coupon-input"
              />
              <button
                className="apply-btn"
                onClick={() => applyCoupon(couponCode)}
                disabled={!couponCode.trim()}
              >
                Apply
              </button>
            </div>
            
            {appliedCoupon && (
              <div className="applied-coupon">
                <span>✅ Coupon "{appliedCoupon.code}" applied! You saved ₹{couponDiscount.toFixed(2)}</span>
                <button onClick={removeCoupon} className="remove-coupon">Remove</button>
              </div>
            )}
            
            {showAllCoupons && (
              <div className="available-coupons">
                <h4>Available Coupons ({coupons.length})</h4>
                {coupons.length > 0 ? (
                  coupons.map((coupon) => (
                    <div key={coupon._id} className="coupon-item" onClick={() => applyCoupon(coupon.code)}>
                      <div className="coupon-info">
                        <div className="coupon-code">{coupon.code}</div>
                        <div className="coupon-description">{coupon.description}</div>
                        <div className="coupon-minimum">Min order: ₹{coupon.min_order_value}</div>
                      </div>
                      <div className="coupon-value">
                        {coupon.discount_type === 'percentage' 
                          ? `${coupon.discount_value}% OFF` 
                          : `₹${coupon.discount_value} OFF`}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-coupons">
                    <p>No coupons available at the moment.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bill Details Section */}
          <div className="section bill-details">
            <h3>Bill Details</h3>
            <div className="bill-breakdown">
              <div className="bill-row">
                <span>Sub Total</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="bill-row">
                <span>Delivery Charge</span>
                <span>₹{deliveryCharge.toFixed(2)}</span>
              </div>
              <div className="bill-row">
                <span>Packaging Charge</span>
                <span>₹{packagingCharge.toFixed(2)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="bill-row discount-row">
                  <span>Coupon Discount</span>
                  <span>-₹{couponDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="bill-row total-row">
                <span>Payable Amount</span>
                <span>₹{finalTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Section */}
      <div className="mobile-bottom">
                <div className="delivery-info-mobile">
          Your order will be delivered on 07 Nov between 12:00 - 12:30
        </div>
        
        <div className="address-summary-mobile">
          <span>Deliver to home</span>
          <button className="change-btn" onClick={() => setShowLocationModal(true)}>Change</button>
        </div>
        
        <div className="address-code-mobile">4040</div>
        
        <div className="payment-footer-mobile">
          <div className="total-amount">₹{finalTotal.toFixed(2)}</div>
          <button 
            className="payment-btn-mobile"
            onClick={() => setShowPaymentModal(true)}
            disabled={isProcessingPayment}
          >
            {isProcessingPayment ? 'Processing...' : 'Choose payment method'}
          </button>
        </div>
      </div>

      {/* Zomato-style Location Modal */}
      <ZomatoLocationModal 
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onLocationSet={(locationData: any) => {
          setUserLocation?.({
            lat: locationData.lat,
            lng: locationData.lng,
            address: locationData.address,
            distance: locationData.distance
          });
          setDeliveryAddress({
            type: 'Home',
            address: locationData.address
          });
          
          // Update delivery info from location data
          if (locationData.deliveryStatus) {
            setDeliveryInfo({
              duration: locationData.deliveryStatus.duration || 'Calculating...',
              durationMinutes: locationData.deliveryStatus.durationMinutes || null,
              distance: locationData.deliveryStatus.distance || null,
              available: locationData.deliveryStatus.available !== false
            });
          } else if (locationData.durationMinutes) {
            // Fallback to direct properties if deliveryStatus is not nested
            setDeliveryInfo({
              duration: locationData.duration || 'Calculating...',
              durationMinutes: locationData.durationMinutes || null,
              distance: locationData.distance || null,
              available: true
            });
          }
          
          setShowLocationModal(false);
        }}
      />

      {/* Payment Method Modal */}
      <PaymentModal 
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        currentPaymentMethod={paymentMethod}
        onSelectPayment={(method: string) => {
          setPaymentMethod(method);
          setShowPaymentModal(false);
          // Just set the payment method, don't place order automatically
        }}
        isEligibleForCash={isEligibleForCash}
        minimumCashAmount={minimumCashAmount}
      />

      {/* Mobile Fixed Bottom Section */}
      <div className="mobile-fixed-bottom">
        <div className="mobile-delivery-info">
          <div className="mobile-delivery-time">
            {(() => {
              if (!deliveryInfo.durationMinutes) {
                return `Your order will be delivered on ${new Date(Date.now() + 24*60*60*1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} between 12:00 - 12:30`;
              }
              
              const deliveryTime = new Date(Date.now() + deliveryInfo.durationMinutes * 60 * 1000);
              const deliveryEndTime = new Date(deliveryTime.getTime() + 30 * 60 * 1000);
              
              const formatTime = (date: Date) => date.toLocaleTimeString('en-GB', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
              });
              
              return `Your order will be delivered on ${deliveryTime.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} between ${formatTime(deliveryTime)} - ${formatTime(deliveryEndTime)}`;
            })()}
          </div>
          
          <div className="mobile-address-section">
            <div className="mobile-address-header">
              <span className="mobile-address-label">Deliver to home</span>
              <button 
                className="mobile-change-btn"
                onClick={() => setShowLocationModal(true)}
              >
                Change
              </button>
            </div>
            <div className="mobile-address-text">
              {deliveryAddress.address || userLocation?.address || '339, Defence Colony, Shyam Nagar, Kanpur, Uttar Pradesh 208013, India'}
            </div>
          </div>
        </div>
        
        <div className="mobile-payment-section">
          <div className="mobile-payment-info">
            <div className="mobile-total-amount">₹{finalTotal.toFixed(2)}</div>
            {paymentMethod && (
              <div className="mobile-payment-method">
                <span className="mobile-payment-icon">
                  {paymentMethod === 'online' ? '💳' : '💵'}
                </span>
                <span className="mobile-payment-text">
                  {paymentMethod === 'online' ? 'Online Payment' : 'Cash on Delivery'}
                </span>
                <button 
                  className="mobile-change-payment-btn"
                  onClick={() => setShowPaymentModal(true)}
                >
                  Change
                </button>
              </div>
            )}
          </div>
          <button 
            className="mobile-payment-btn"
            onClick={() => {
              if (!paymentMethod) {
                setShowPaymentModal(true);
                return;
              }
              if (paymentMethod === 'online') {
                handlePlaceOrder();
              } else if (paymentMethod === 'cash' && isEligibleForCash) {
                handlePlaceOrder();
              }
            }}
            disabled={isProcessingPayment || (paymentMethod === 'cash' && !isEligibleForCash)}
          >
            {isProcessingPayment ? 'Processing...' : 
             !paymentMethod ? 'Choose Payment Method' :
             paymentMethod === 'online' ? 'Proceed to Payment' : 
             paymentMethod === 'cash' && isEligibleForCash ? 'Place Order' : 
             'Choose Payment Method'}
          </button>
        </div>
      </div>
    </div>
  );
}