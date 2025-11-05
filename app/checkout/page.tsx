"use client";
import { useState, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import { useLocation } from '../contexts/LocationContext';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import './checkout.css';
import ZomatoLocationModal from '../components/ZomatoLocationModal';
import '../components/ZomatoLocationModal.css';

interface Coupon {
  _id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  max_discount?: number;
  min_purchase_amount: number;
  valid_from: string;
  valid_to: string;
  usage_limit?: number;
  usage_limit_per_user: number;
  is_active: boolean;
  description: string;
  applicable_users: string[];
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, subtotal, updateQuantity, removeFromCart } = useCart();
  const { userLocation, deliveryAvailable, setUserLocation, setDeliveryAvailable } = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  
  const [customerInfo, setCustomerInfo] = useState({
    fullName: 'Ambuj Dwivedi',
    phone: '+919299586475',
    email: 'ambujdwivedi1947@gmail.com'
  });
  
  const [deliveryAddress, setDeliveryAddress] = useState({
    type: 'Home',
    address: ''
  });
  
  const [manualAddress, setManualAddress] = useState('');
  const [addressDetails, setAddressDetails] = useState({
    houseNumber: '',
    street: '',
    landmark: '',
    instructions: ''
  });
  
  const [isAddressSaved, setIsAddressSaved] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Coupon states
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [showAllCoupons, setShowAllCoupons] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Load address from location context
  useEffect(() => {
    if (userLocation?.address) {
      setDeliveryAddress({
        type: 'Home',
        address: userLocation.address
      });
    }
  }, [userLocation]);

  // Fetch active coupons
  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/coupons/active');
        if (response.ok) {
          const couponsData = await response.json();
          setCoupons(couponsData);
        }
      } catch (error) {
        console.error('Error fetching coupons:', error);
      }
    };
    
    fetchCoupons();
  }, []);

  // Apply coupon function
  const applyCoupon = async (code: string) => {
    try {
      const response = await fetch('http://localhost:5001/api/coupons/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code,
          orderAmount: subtotal
        })
      });

      const result = await response.json();

      if (response.ok && result.valid) {
        setAppliedCoupon(result.coupon);
        setCouponDiscount(result.discountAmount);
        setCouponCode(code);
      } else {
        alert(result.message || 'Invalid coupon code');
      }
    } catch (error) {
      console.error('Error applying coupon:', error);
      alert('Error applying coupon. Please try again.');
    }
  };

  // Remove coupon function
  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode('');
  };

  // Change location function
  const handleChangeLocation = () => {
    setShowLocationModal(true);
  };

  // Set delivery date on client side to avoid hydration mismatch
  useEffect(() => {
    setDeliveryDate(new Date().toLocaleDateString('en-IN', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }));
    setIsLoading(false);
    
    // Clean up any lingering modal backdrops from previous pages
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(backdrop => backdrop.remove());
    
    // Reset body styles that might be set by Bootstrap modals
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  }, []);

  // No automatic redirect - let user choose to add items

  const [paymentMethod, setPaymentMethod] = useState('online');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Payment validation constants
  const minimumCashAmount = 499;

  // Load checkout data from localStorage on component mount
  useEffect(() => {
    const savedCustomerInfo = localStorage.getItem('checkoutCustomerInfo');
    const savedPaymentMethod = localStorage.getItem('checkoutPaymentMethod');
    const savedManualAddress = localStorage.getItem('checkoutManualAddress');
    
    if (savedCustomerInfo) {
      try {
        setCustomerInfo(JSON.parse(savedCustomerInfo));
      } catch (error) {
        console.error('Error loading customer info from localStorage:', error);
      }
    }
    
    if (savedPaymentMethod) {
      setPaymentMethod(savedPaymentMethod);
    }
    
    if (savedManualAddress) {
      setManualAddress(savedManualAddress);
    }
  }, []);

  // Save customer info to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('checkoutCustomerInfo', JSON.stringify(customerInfo));
  }, [customerInfo]);

  // Save payment method to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('checkoutPaymentMethod', paymentMethod);
  }, [paymentMethod]);

  // Save manual address to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('checkoutManualAddress', manualAddress);
  }, [manualAddress]);

  // Reset saved state when address details change
  useEffect(() => {
    setIsAddressSaved(false);
  }, [addressDetails.houseNumber, addressDetails.street, addressDetails.landmark, addressDetails.instructions]);

  // Calculate values
  const packagingCharge = 20;
  
  const finalTotal = subtotal + packagingCharge - couponDiscount;
  
  // Payment validation
  const isEligibleForCash = finalTotal >= minimumCashAmount;

  // Auto-switch to online payment if cash is not eligible and currently selected
  useEffect(() => {
    if (paymentMethod === 'cash' && !isEligibleForCash) {
      setPaymentMethod('online');
    }
  }, [paymentMethod, isEligibleForCash]);

  // Razorpay payment processing
  const processOnlinePayment = async () => {
    try {
      setIsProcessingPayment(true);

      // Create order on backend
      const orderResponse = await fetch('http://localhost:5001/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

      // Razorpay options
      const options = {
        key: orderData.key_id,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'The Quisine',
        description: 'Food Order Payment',
        order_id: orderData.order.id,
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          try {
            // Verify payment on backend
            const verifyResponse = await fetch('http://localhost:5001/api/payments/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
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

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              // Payment successful - redirect to success page
              router.push('/checkout/success');
            } else {
              alert('Payment verification failed. Please contact support.');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: customerInfo.fullName,
          email: customerInfo.email,
          contact: customerInfo.phone
        },
        theme: {
          color: '#F37254'
        }
      };

      // Load Razorpay and open payment modal
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error('Payment processing error:', error);
      alert('Payment processing failed. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Cash payment processing
  const processCashPayment = async () => {
    try {
      setIsProcessingPayment(true);

      const response = await fetch('http://localhost:5001/api/payments/cash', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
        // Cash order successful - redirect to success page
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

  // Handle place order
  const validateAddressDetails = () => {
    // Check if location is selected
    if (!userLocation || !userLocation.lat || !userLocation.lng) {
      alert('Please select your delivery location on the map first');
      setIsZomatoModalOpen(true);
      return false;
    }
    
    if (!addressDetails.houseNumber.trim()) {
      alert('Please enter your house/flat/office number');
      return false;
    }
    if (!addressDetails.street.trim()) {
      alert('Please enter your street/area details');
      return false;
    }
    
    if (!isAddressSaved) {
      alert('Please save your address details before proceeding');
      return false;
    }
    
    return true;
  };

  const handleSaveAddress = () => {
    if (!addressDetails.houseNumber.trim()) {
      alert('Please enter your house/flat/office number');
      return;
    }
    if (!addressDetails.street.trim()) {
      alert('Please enter your street/area details');
      return;
    }
    
    setIsAddressSaved(true);
    alert('Address saved successfully!');
  };

  const handlePlaceOrder = () => {
    // Validate address details
    if (!validateAddressDetails()) {
      return;
    }

    if (paymentMethod === 'online') {
      processOnlinePayment();
    } else if (paymentMethod === 'cash') {
      if (!isEligibleForCash) {
        alert(`Minimum order amount for cash payment is ₹${minimumCashAmount}`);
        return;
      }
      processCashPayment();
    }
  };

  if (isLoading || loading) {
    return (
      <div className="checkout-container">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '50vh',
          fontSize: '18px',
          color: '#4a5568'
        }}>
          Loading checkout...
        </div>
      </div>
    );
  }

  // Require authentication to access checkout
  if (!isAuthenticated) {
    return (
      <div className="checkout-container">
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '50vh',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#124f31', marginBottom: '20px' }}>Sign In Required</h2>
          <p style={{ fontSize: '18px', color: '#4a5568', marginBottom: '30px' }}>
            Please sign in to place your order
          </p>
          <button 
            onClick={() => router.push('/auth')}
            style={{
              backgroundColor: '#124f31',
              color: 'white',
              padding: '12px 30px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Sign In to Continue
          </button>
        </div>
      </div>
    );
  }

  // Show empty cart message if no items
  if (cartItems.length === 0) {
    return (
      <div className="checkout-container">
        <div className="empty-cart-container">
          <div className="empty-cart-content">
            <div className="empty-cart-icon">🛒</div>
            <h2 className="empty-cart-title">Your Cart is Empty</h2>
            <p className="empty-cart-message">
              Looks like you haven&apos;t added any delicious items to your cart yet!
            </p>
            <button 
              className="add-items-btn"
              onClick={() => router.push('/')}
            >
              🍽️ Browse Menu & Add Items
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <div className="checkout-content">
        {/* Left Column - Customer Info and Cart */}
        <div className="checkout-left">
          {/* Customer Information */}
          <div className="checkout-section">
            <h2 className="section-title">Customer Information</h2>
            <div className="customer-info">
              <div className="info-item">
                <span className="info-icon">👤</span>
                <div className="info-details">
                  <div className="info-label">FULL NAME</div>
                  <div className="info-value">{customerInfo.fullName}</div>
                </div>
              </div>
              <div className="info-item">
                <span className="info-icon">📱</span>
                <div className="info-details">
                  <div className="info-label">PHONE NUMBER</div>
                  <div className="info-value">{customerInfo.phone}</div>
                </div>
              </div>
              <div className="info-item">
                <span className="info-icon">✉️</span>
                <div className="info-details">
                  <div className="info-label">EMAIL ADDRESS</div>
                  <div className="info-value">{customerInfo.email}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="checkout-section">
            <div className="section-header">
              <h2 className="section-title">Deliver to</h2>
              <button className="change-btn" onClick={handleChangeLocation}>Change</button>
            </div>
            <div className="delivery-address">
              <div className="address-type">{deliveryAddress.type}</div>
              <div className="address-text">
                {deliveryAddress.address || userLocation?.address || (
                  <div className="select-location-prompt">
                    <button 
                      className="select-location-btn"
                      onClick={handleChangeLocation}
                    >
                      📍 Select Delivery Location
                    </button>
                    <p className="location-help-text">Choose your delivery location on the map</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Address Details Form */}
            <div className={`address-details-form ${isAddressSaved ? 'address-saved' : ''}`}>
              <h3 className="form-subtitle">
                {isAddressSaved ? '✅ Address Completed' : 'Complete your address'}
              </h3>
              <div className="address-inputs">
                <div className="input-row">
                  <div className="input-group">
                    <label htmlFor="houseNumber">House/Flat/Office No.*</label>
                    <input
                      id="houseNumber"
                      type="text"
                      placeholder="E.g. 305, 2nd Floor"
                      value={addressDetails.houseNumber}
                      onChange={(e) => setAddressDetails({...addressDetails, houseNumber: e.target.value})}
                      className="address-input"
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="street">Street/Area*</label>
                    <input
                      id="street"
                      type="text"
                      placeholder="E.g. Sector 53, Golf Course Road"
                      value={addressDetails.street}
                      onChange={(e) => setAddressDetails({...addressDetails, street: e.target.value})}
                      className="address-input"
                    />
                  </div>
                </div>
                <div className="input-row">
                  <div className="input-group">
                    <label htmlFor="landmark">Nearby Landmark</label>
                    <input
                      id="landmark"
                      type="text"
                      placeholder="E.g. Near Metro Station, Opposite Mall"
                      value={addressDetails.landmark}
                      onChange={(e) => setAddressDetails({...addressDetails, landmark: e.target.value})}
                      className="address-input"
                    />
                  </div>
                </div>
                <div className="input-row">
                  <div className="input-group full-width">
                    <label htmlFor="instructions">Delivery Instructions (Optional)</label>
                    <input
                      type="text"
                      id="instructions"
                      placeholder="E.g. Ring the doorbell, Call before delivery, Leave at gate"
                      value={addressDetails.instructions}
                      onChange={(e) => setAddressDetails({...addressDetails, instructions: e.target.value})}
                      className="address-input"
                    />
                  </div>
                </div>
                
                {/* Save Address Button */}
                <div className="address-save-section">
                  <button 
                    type="button"
                    onClick={handleSaveAddress}
                    className={`save-address-btn ${isAddressSaved ? 'saved' : ''}`}
                    disabled={isAddressSaved}
                  >
                    {isAddressSaved ? '✅ Address Saved' : '💾 Save Address'}
                  </button>
                  {!isAddressSaved && (
                    <p className="save-note">* Save your address before proceeding to payment</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Date */}
          <div className="checkout-section">
            <h2 className="section-title">Delivery Date</h2>
            <div className="delivery-date">
              <div className="date-display">📅 {deliveryDate || 'Loading...'}</div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="checkout-section">
            <h2 className="section-title">Payments</h2>
            <div className="payment-methods">
              <div 
                className={`payment-option ${paymentMethod === 'online' ? 'selected' : ''}`}
                onClick={() => setPaymentMethod('online')}
                style={{ cursor: 'pointer' }}
              >
                <div className="payment-icon">📱</div>
                <div className="payment-details">
                  <div className="payment-name">Pay Online</div>
                  <div className="payment-desc">UPI, Cards, Netbanking, Wallets</div>
                </div>
              </div>
              <div 
                className={`payment-option ${paymentMethod === 'cash' ? 'selected' : ''} ${!isEligibleForCash ? 'disabled' : ''}`}
                onClick={() => isEligibleForCash && setPaymentMethod('cash')}
                style={{ cursor: isEligibleForCash ? 'pointer' : 'not-allowed' }}
              >
                <div className="payment-icon">💵</div>
                <div className="payment-details">
                  <div className="payment-name">Cash on Delivery</div>
                  <div className={`payment-limit ${!isEligibleForCash ? 'error' : ''}`}>
                    {!isEligibleForCash ? 
                      `Minimum ₹${minimumCashAmount} required` : 
                      `Available for orders ₹${minimumCashAmount}+`
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Cart Summary */}
        <div className="checkout-right">
          <div className="cart-summary-container">
            {/* My Cart Header */}
            <div className="cart-header">
              <h3>My Cart ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} items)</h3>
              <button 
                className="edit-cart-btn"
                onClick={() => router.push('/')}
              >
                ✏️
              </button>
            </div>

            {/* Cart Items Display */}
            {cartItems.length > 0 && (
              <div className="cart-items-section">
                {cartItems.map((item) => (
                  <div key={item.id} className="cart-item">
                    <div className="item-info">
                      <div className="item-name">{item.name || 'Product'}</div>
                      <div className="item-variant">{item.variant}</div>
                      <div className="item-price">₹{item.price}</div>
                    </div>
                    <div className="item-controls">
                      <div className="quantity-controls">
                        <button 
                          className="quantity-btn minus"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          −
                        </button>
                        <span className="quantity-display">{item.quantity}</span>
                        <button 
                          className="quantity-btn plus"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                      <div className="item-total">₹{((item.price || 0) * item.quantity).toFixed(2)}</div>
                      <button 
                        className="remove-item-btn"
                        onClick={() => removeFromCart(item.id)}
                        title="Remove item"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Bill Details */}
            <div className="bill-details">
              <div className="bill-row">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
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

              <br />

            {/* Proceed to Pay */}
            <button 
              className="proceed-btn"
              onClick={handlePlaceOrder}
              disabled={isProcessingPayment || (paymentMethod === 'cash' && !isEligibleForCash)}
            >
              {isProcessingPayment ? 
                'Processing...' : 
                `${paymentMethod === 'online' ? 'Pay Online' : 'Place Order'} - ₹${finalTotal.toFixed(2)}`
              }
            </button>

            {/* Special Request */}
            <div className="special-request">
              <input 
                type="text" 
                placeholder="Enter cooking instructions here"
                className="request-input"
              />
            </div>

            </div>

            {/* Apply Coupon Section */}
            <div className="coupon-section">
              <h3 className="coupon-title">Apply Coupon</h3>
              
              {!appliedCoupon ? (
                <div className="coupon-input-section">
                  <div className="coupon-input-container">
                    <span className="coupon-icon">🏷️</span>
                    <input
                      type="text"
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="coupon-input"
                    />
                    <button
                      className="apply-coupon-btn"
                      onClick={() => applyCoupon(couponCode)}
                      disabled={!couponCode.trim()}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              ) : (
                <div className="applied-coupon">
                  <span className="coupon-icon">🏷️</span>
                  <span className="applied-coupon-code">{appliedCoupon.code}</span>
                  <button className="remove-coupon-btn" onClick={removeCoupon}>
                    Remove
                  </button>
                </div>
              )}

              <div className="coupon-list-toggle">
                <button
                  className="see-all-coupons-btn"
                  onClick={() => setShowAllCoupons(!showAllCoupons)}
                >
                  See all coupons ({coupons.length}) →
                </button>
              </div>

              {showAllCoupons && (
                <div className="available-coupons">
                  {coupons.map((coupon) => (
                    <div key={coupon._id} className="coupon-card">
                      <div className="coupon-details">
                        <div className="coupon-name">{coupon.code}</div>
                        <div className="coupon-description">{coupon.description}</div>
                        <div className="coupon-code-line">
                          CODE: {coupon.code}
                        </div>
                      </div>
                      <div className="coupon-actions">
                        <div className="coupon-expiry">
                          {new Date(coupon.valid_to).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                        {appliedCoupon?.code === coupon.code ? (
                          <button className="remove-coupon-card-btn" onClick={removeCoupon}>
                            Remove
                          </button>
                        ) : (
                          <button
                            className="apply-coupon-card-btn"
                            onClick={() => applyCoupon(coupon.code)}
                          >
                            Apply
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Zomato-style Location Modal */}
      <ZomatoLocationModal 
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onLocationSet={(locationData) => {
          setUserLocation({
            lat: locationData.lat,
            lng: locationData.lng,
            address: locationData.address,
            distance: locationData.distance
          });
          setDeliveryAvailable(locationData.isWithinDeliveryRadius);
          setDeliveryAddress({
            type: 'Home',
            address: locationData.address
          });
          setShowLocationModal(false);
        }}
      />
    </div>
  );
}
