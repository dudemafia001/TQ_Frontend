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
  const { user, fullName, isAuthenticated, loading: authLoading } = useContext(AuthContext) || {};
  const { userLocation, setUserLocation } = useContext(LocationContext) || {};

  // ALL STATE HOOKS - Must be called before any conditional returns
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    fullName: '',
    phone: '',
    email: ''
  });

  const [addressDetails] = useState<AddressDetails>({
    houseNumber: '',
    street: '',
    landmark: ''
  });

  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>({
    type: 'Home',
    address: ''
  });
  
  const [manualAddress, setManualAddress] = useState<string>('');

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
  
  // Site status and operating hours state
  const [siteStatus, setSiteStatus] = useState<{
    isOpen: boolean;
    canAcceptOrders: boolean;
    isWithinOperatingHours: boolean;
    outsideHoursMessage: string;
    closedMessage: string;
  }>({
    isOpen: true,
    canAcceptOrders: true,
    isWithinOperatingHours: true,
    outsideHoursMessage: '',
    closedMessage: ''
  });
  
  // Coupon states
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [showAllCoupons, setShowAllCoupons] = useState(false);

  // ALL EFFECT HOOKS - Must be called before any conditional returns  
  // Check site status and operating hours
  useEffect(() => {
    const fetchSiteStatus = async () => {
      try {
        const response = await fetch(buildApiUrl(config.api.endpoints.site.status));
        const data = await response.json();
        if (data.success) {
          setSiteStatus(data.data);
        }
      } catch (error) {
        console.error('Error fetching site status:', error);
      }
    };
    fetchSiteStatus();
  }, []);

  // Authentication check - redirect to auth page if not signed in
  useEffect(() => {
    // Only check authentication after auth loading is complete
    if (!authLoading && !isAuthenticated && !user) {
      router.push('/auth?redirect=checkout');
      return;
    }
  }, [isAuthenticated, user, router, authLoading]);

  // Fetch real user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          // Fetch user profile from backend
          const apiUrl = buildApiUrl(`${config.api.endpoints.auth.profile}/${user}`);
          const response = await fetch(apiUrl);
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.user) {
              setCustomerInfo({
                fullName: data.user.fullName || user,
                phone: data.user.mobile || '',
                email: data.user.email || `${user}@example.com`  // Fallback email if not stored
              });
            } else {
              throw new Error('Failed to fetch user data');
            }
          } else {
            throw new Error('Failed to fetch user data');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Fallback to basic user data from context
          setCustomerInfo({
            fullName: fullName || user,
            phone: '',  // Empty phone if we can't fetch it
            email: `${user}@example.com`  // Fallback email
          });
        }
      }
    };

    fetchUserData();
  }, [user, fullName]);

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

  // Constants
  const minimumCashAmount = 499;
  const packagingCharge = 20;
  const deliveryCharge = 0;

  // Calculate subtotal
  const subtotal = (cartItems || []).reduce((sum: number, item: CartItemType) => sum + ((item.price || 0) * item.quantity), 0);
  const finalTotal = subtotal + packagingCharge + deliveryCharge - couponDiscount;
  const isEligibleForCash = finalTotal >= minimumCashAmount;

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="checkout-container">
        <div className="checkout-loading">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render checkout if user is not authenticated
  if (!isAuthenticated && !user) {
    return (
      <div className="checkout-container">
        <div className="checkout-loading">
          <p>Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

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
    // Validate site status and operating hours
    if (!siteStatus.canAcceptOrders) {
      if (!siteStatus.isOpen) {
        alert(`⚠️ ${siteStatus.closedMessage || 'We are currently closed. Please check back later!'}`);
        return;
      }
      if (!siteStatus.isWithinOperatingHours) {
        alert(`⏰ ${siteStatus.outsideHoursMessage || 'We accept orders only between 12:00 PM to 11:00 PM. Please visit us during our operating hours!'}`);
        return;
      }
    }

    // Validate delivery availability
    if (!deliveryInfo.available) {
      alert('⚠️ Delivery not available at your location. We only deliver within 6km radius.');
      return;
    }

    // Validate address
    if (!manualAddress || manualAddress.trim() === '') {
      alert('Please enter your complete delivery address');
      return;
    }

    // Validate location is set
    if (!userLocation || !userLocation.lat || !userLocation.lng) {
      alert('Please select your delivery location first');
      setShowLocationModal(true);
      return;
    }

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
          // Handle payment success - verify payment and save order
          console.log('Payment successful:', response);
          
          try {
            const verifyResponse = await fetch(buildApiUrl(config.api.endpoints.payments.verify), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderDetails: {
                  userId: user,
                  cartItems,
                  customerInfo,
                  deliveryAddress: {
                    address: manualAddress || deliveryAddress.address || userLocation?.address || 'No address provided',
                    lat: userLocation?.lat,
                    lng: userLocation?.lng
                  },
                  addressDetails,
                  subtotal,
                  packagingCharge,
                  couponDiscount,
                  finalTotal,
                  appliedCoupon
                }
              })
            });
            
            const verifyResult = await verifyResponse.json();
            if (verifyResult.success) {
              console.log('Order saved successfully');
              router.push('/checkout/success');
            } else {
              throw new Error(verifyResult.message || 'Payment verification failed');
            }
          } catch (error) {
            console.error('Error verifying payment:', error);
            alert('Payment successful but order could not be saved. Please contact support with payment ID: ' + response.razorpay_payment_id);
          }
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
            deliveryAddress: {
              address: manualAddress || deliveryAddress.address || userLocation?.address || 'No address provided',
              lat: userLocation?.lat,
              lng: userLocation?.lng
            },
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
      {/* Operating Hours Warning Banner */}
      {!siteStatus.canAcceptOrders && (
        <div style={{
          padding: '1rem',
          backgroundColor: siteStatus.isOpen ? '#fff3cd' : '#f8d7da',
          border: `2px solid ${siteStatus.isOpen ? '#ffc107' : '#f5c6cb'}`,
          borderRadius: '8px',
          margin: '1rem',
          color: siteStatus.isOpen ? '#856404' : '#721c24',
          fontSize: '14px',
          fontWeight: '600',
          textAlign: 'center'
        }}>
          {siteStatus.isOpen ? (
            <>⏰ {siteStatus.outsideHoursMessage || 'We accept orders only between 12:00 PM to 11:00 PM. Please visit us during our operating hours!'}</>
          ) : (
            <>🚫 {siteStatus.closedMessage || 'We are currently closed. Please check back later!'}</>
          )}
        </div>
      )}

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
            
            {/* Delivery Status Warning */}
            {!deliveryInfo.available && (
              <div style={{
                padding: '12px',
                backgroundColor: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '8px',
                marginBottom: '15px',
                color: '#856404',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                ⚠️ This location is outside our 6km delivery radius. Please change your address to proceed.
              </div>
            )}
            
            {/* Delivery Info Display */}
            {deliveryInfo.distance && (
              <div style={{
                padding: '12px',
                backgroundColor: deliveryInfo.available ? '#d4edda' : '#f8d7da',
                border: `1px solid ${deliveryInfo.available ? '#c3e6cb' : '#f5c6cb'}`,
                borderRadius: '8px',
                marginBottom: '15px',
                fontSize: '14px'
              }}>
                <div style={{ marginBottom: '5px' }}>
                  📍 <strong>Distance:</strong> {deliveryInfo.distance} km
                </div>
                <div>
                  ⏱️ <strong>Estimated Time:</strong> {deliveryInfo.duration}
                </div>
              </div>
            )}
            
            <div className="address-content">
              <div className="address-type">
                <span className="home-icon">🏠</span>
                <span>Home</span>
              </div>
              <div className="address-text">
                {deliveryAddress.address || userLocation?.address || '4040, Nachital Nilaya, 11th Cross Road, Bellandur Main Rd, Bellandur, Bengaluru, Karnataka, India, Bengaluru, 560103'}
              </div>
              
              {/* Manual Address Input */}
              <div className="manual-address-input" style={{ marginTop: '15px' }}>
                <label htmlFor="manual-address" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                  Complete Address <span style={{ color: 'red' }}>*</span> (House No., Street, Landmark)
                </label>
                <textarea
                  id="manual-address"
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  placeholder="Enter your complete delivery address with house number, street name, and landmark"
                  rows={3}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: manualAddress.trim() === '' ? '1px solid #ff6b6b' : '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    minHeight: '80px'
                  }}
                />
                <p style={{ fontSize: '12px', color: manualAddress.trim() === '' ? '#ff6b6b' : '#666', marginTop: '5px' }}>
                  {manualAddress.trim() === '' ? '⚠️ This field is required for delivery' : 'This will be used as your delivery address'}
                </p>
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
                  // Check site status and operating hours
                  if (!siteStatus.canAcceptOrders) {
                    if (!siteStatus.isOpen) {
                      alert(`⚠️ ${siteStatus.closedMessage || 'We are currently closed. Please check back later!'}`);
                      return;
                    }
                    if (!siteStatus.isWithinOperatingHours) {
                      alert(`⏰ ${siteStatus.outsideHoursMessage || 'We accept orders only between 12:00 PM to 11:00 PM. Please visit us during our operating hours!'}`);
                      return;
                    }
                  }
                  
                  if (!deliveryInfo.available) {
                    alert('⚠️ Delivery not available at your location. We only deliver within 6km radius. Please change your delivery address.');
                    setShowLocationModal(true);
                    return;
                  }
                  if (!manualAddress || manualAddress.trim() === '') {
                    alert('Please enter your complete delivery address');
                    return;
                  }
                  if (!userLocation || !userLocation.lat || !userLocation.lng) {
                    alert('Please select your delivery location first');
                    setShowLocationModal(true);
                    return;
                  }
                  if (!paymentMethod) {
                    alert('Please select a payment method first');
                    return;
                  }
                  // Proceed directly with the selected payment method
                  handlePlaceOrder();
                }}
                disabled={isProcessingPayment || (paymentMethod === 'cash' && !isEligibleForCash) || !deliveryInfo.available || !siteStatus.canAcceptOrders}
              >
                {isProcessingPayment ? 'Processing...' : 
                 !siteStatus.canAcceptOrders ? (
                   siteStatus.isOpen ? '⏰ Outside Operating Hours' : '🚫 Currently Closed'
                 ) :
                 !deliveryInfo.available ? '❌ Delivery Not Available' :
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
                    <div className="quantity-display">
                      <span className="quantity">Qty: {item.quantity}</span>
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
            onClick={() => {
              // Check site status and operating hours
              if (!siteStatus.canAcceptOrders) {
                if (!siteStatus.isOpen) {
                  alert(`⚠️ ${siteStatus.closedMessage || 'We are currently closed. Please check back later!'}`);
                  return;
                }
                if (!siteStatus.isWithinOperatingHours) {
                  alert(`⏰ ${siteStatus.outsideHoursMessage || 'We accept orders only between 12:00 PM to 11:00 PM. Please visit us during our operating hours!'}`);
                  return;
                }
              }
              
              if (!deliveryInfo.available) {
                alert('⚠️ Delivery not available at your location. We only deliver within 6km radius. Please change your delivery address.');
                setShowLocationModal(true);
                return;
              }
              if (!manualAddress || manualAddress.trim() === '') {
                alert('Please enter your complete delivery address');
                return;
              }
              if (!userLocation || !userLocation.lat || !userLocation.lng) {
                alert('Please select your delivery location first');
                setShowLocationModal(true);
                return;
              }
              setShowPaymentModal(true);
            }}
            disabled={isProcessingPayment || !deliveryInfo.available || !siteStatus.canAcceptOrders}
          >
            {isProcessingPayment ? 'Processing...' : 
             !siteStatus.canAcceptOrders ? (
               siteStatus.isOpen ? '⏰ Outside Hours' : '🚫 Closed'
             ) :
             !deliveryInfo.available ? '❌ Delivery Not Available' : 'Choose payment method'}
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
          {!paymentMethod ? (
            <button 
              className="mobile-select-payment-btn"
              onClick={() => setShowPaymentModal(true)}
            >
              <span className="payment-prompt-icon">💳</span>
              <span className="payment-prompt-text">Select Payment Method</span>
              <span className="payment-prompt-arrow">→</span>
            </button>
          ) : (
            <>
              <div className="mobile-payment-info">
                <div className="mobile-total-amount">₹{finalTotal.toFixed(2)}</div>
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
              </div>
              <button 
                className="mobile-payment-btn"
                onClick={() => {
                  if (!manualAddress || manualAddress.trim() === '') {
                    alert('Please enter your complete delivery address');
                    return;
                  }
                  handlePlaceOrder();
                }}
                disabled={isProcessingPayment || (paymentMethod === 'cash' && !isEligibleForCash)}
              >
                {isProcessingPayment ? 'Processing...' : 
                 paymentMethod === 'online' ? 'Proceed to Payment' : 
                 paymentMethod === 'cash' && isEligibleForCash ? 'Place Order' : 
                 'Place Order'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}