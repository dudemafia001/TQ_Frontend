"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import "bootstrap/dist/css/bootstrap.min.css";
import "./menu.css";
import { useCart } from "./contexts/CartContext";
import { useLocation } from "./contexts/LocationContext";
import ZomatoLocationModal from "./components/ZomatoLocationModal";
import "./components/ZomatoLocationModal.css";

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedVariants, setSelectedVariants] = useState({});
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");

  const DELIVERY_CENTER = { lat: 26.4201563, lng: 80.3600507 };
  const DELIVERY_RADIUS_KM = 7;
  
  const { addToCart: addToCartContext, updateQuantity, removeFromCart, cartItems, totalItems: cartTotalItems, subtotal } = useCart();
  const { userLocation, deliveryAvailable, setUserLocation, setDeliveryAvailable, clearLocation } = useLocation();

  // Simple distance calculation using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  };

  // Get current location using GPS
  const getCurrentLocation = () => {
    console.log('getCurrentLocation called');
    
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser.");
      console.log('Geolocation not supported');
      return;
    }

    setIsLoadingLocation(true);
    setLocationError("");
    console.log('Starting geolocation request...');
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const distance = calculateDistance(
          latitude, longitude, 
          DELIVERY_CENTER.lat, DELIVERY_CENTER.lng
        );
        
        const location = {
          lat: latitude,
          lng: longitude,
          address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          distance: parseFloat(distance.toFixed(2))
        };
        
        const isWithinRadius = distance <= DELIVERY_RADIUS_KM;
        
        setUserLocation(location);
        setDeliveryAvailable(isWithinRadius);
        setShowLocationPrompt(false);
        setIsLoadingLocation(false);
      },
      (error) => {
        console.log('Geolocation error:', error);
        let errorMessage = "Unable to get your location. ";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += "Please enable location permissions in your browser settings and try again.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += "Location information unavailable. Please check your GPS settings.";
            break;
          case error.TIMEOUT:
            errorMessage += "Location request timed out. Please try again.";
            break;
          default:
            errorMessage += "Please try again or check your browser settings.";
        }
        setLocationError(errorMessage);
        setIsLoadingLocation(false);
        console.log('Error message set:', errorMessage);
      },
      { timeout: 15000, enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    // ✅ Load Bootstrap only on client
    import("bootstrap/dist/js/bootstrap.bundle.min.js")
      .then((bootstrap) => {
        console.log("✅ Bootstrap JS loaded");
        const modalEl = document.getElementById("cartModal");
        if (modalEl) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          new (bootstrap as any).Modal(modalEl);
          console.log("✅ Bootstrap modal initialized");
        }
      })
      .catch((err) => console.error("❌ Bootstrap JS failed", err));

    fetch("http://localhost:5001/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data);
          setSelectedCategory(""); // show all by default
        }
      })
      .catch((err) => console.error("Fetch error:", err));

    // Show location prompt if no location is set
    if (!userLocation) {
      setShowLocationPrompt(true);
    }

    // Cleanup function to remove modal backdrops when component unmounts
    return () => {
      // Remove any lingering modal backdrops
      const backdrops = document.querySelectorAll('.modal-backdrop');
      backdrops.forEach(backdrop => backdrop.remove());
      
      // Reset body styles that might be set by Bootstrap modal
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [userLocation]);

  const categories = [...new Set(products.map((p: any) => p.category.trim()))];

  const filteredProducts = selectedCategory
    ? products.filter(
        (p: any) =>
          p.category.toLowerCase().trim() ===
          selectedCategory.toLowerCase().trim()
      )
    : products;

  // Helper function to get quantity for a specific product+variant
  const getItemQuantity = (productId: string, variant: string) => {
    const key = `${productId}_${variant}`;
    const item = cartItems.find(item => item.id === key);
    return item?.quantity || 0;
  };

  const addToCart = (id: string, variant: string) => {
    const key = `${id}_${variant}`;
    const product = products.find((p: any) => p._id === id);
    const variantObj = product?.variants.find((v: any) => v.type === variant);
    
    addToCartContext(key, product?.name, variant, variantObj?.price);
  };

  const increaseQty = (id: string, variant: string) => {
    const key = `${id}_${variant}`;
    const product = products.find((p: any) => p._id === id);
    const variantObj = product?.variants.find((v: any) => v.type === variant);
    
    addToCartContext(key, product?.name, variant, variantObj?.price);
  };

  const decreaseQty = (id: string, variant: string) => {
    const key = `${id}_${variant}`;
    const currentQty = getItemQuantity(id, variant);
    
    if (currentQty <= 1) {
      removeFromCart(key);
    } else {
      updateQuantity(key, currentQty - 1);
    }
  };

  // Handle change location
  const handleChangeLocation = () => {
    clearLocation();
    setLocationError("");
    setIsLoadingLocation(false);
    setShowLocationPrompt(true);
  };

  return (
    <>
      <div className="menu-page">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">Our Premium Menu</h1>
            <p className="hero-subtitle">
              Discover our range of handcrafted culinary delights made with natural 
              ingredients and traditional recipes
            </p>
          </div>
        </section>

        {/* Delivery Status Bar */}
        {userLocation && (
          <div className={`delivery-status-bar ${deliveryAvailable ? 'available' : 'unavailable'}`}>
            <div className="delivery-status-content">
              <div className="location-info">
                {deliveryAvailable ? (
                  <>
                    <span className="status-icon">🚚</span>
                    <div className="status-text">
                      <strong>Delivering to:</strong> {userLocation.address}
                    </div>
                  </>
                ) : (
                  <>
                    <span className="status-icon">📍</span>
                    <div className="status-text">
                      <strong>Delivery unavailable to:</strong> {userLocation.address}
                      <p>We currently deliver within 7km only</p>
                    </div>
                  </>
                )}
              </div>
              <button 
                className="change-location-btn"
                onClick={handleChangeLocation}
              >
                Change Location
              </button>
            </div>
          </div>
        )}

        <div className="main-container">
          {/* Category Filter */}
          <div className="filter-section">
            <div className="filter-container">
              {/* Desktop & Tablet: Horizontal Pills */}
              <div className="category-pills d-none d-md-flex">
                <button
                  onClick={() => setSelectedCategory("")}
                  className={`filter-pill ${
                    selectedCategory === "" ? "active" : ""
                  }`}
                >
                  All Items
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`filter-pill ${
                      selectedCategory === cat ? "active" : ""
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Mobile: Dropdown */}
              <div className="d-md-none">
                <select
                  className="mobile-filter-select"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">All Items</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="products-section">
            {filteredProducts.length === 0 ? (
              <div className="empty-state">
                <p>No items found in this category.</p>
              </div>
            ) : (
              <div className="products-grid">
                {filteredProducts.map((item: any) => {
                  const selectedVariant =
                    selectedVariants[item._id] || item.variants[0].type;
                  const selectedPrice = item.variants.find(
                    (v: any) => v.type === selectedVariant
                  )?.price;

                  const qty = getItemQuantity(item._id, selectedVariant);

                  return (
                    <div key={item._id} className="product-card clean">
                      <div className="product-content">
                        <h3 className="product-title">{item.name}</h3>
                        <p className="product-description">{item.description}</p>

                        {item.variants.length > 1 && (
                          <select
                            className="variant-select"
                            value={selectedVariant}
                            onChange={(e) =>
                              setSelectedVariants((prev) => ({
                                ...prev,
                                [item._id]: e.target.value,
                              }))
                            }
                          >
                            {item.variants.map((v: any) => (
                              <option key={v.type} value={v.type}>
                                {v.type} - ₹{v.price}
                              </option>
                            ))}
                          </select>
                        )}

                        <div className="price-section">
                          <span className="product-price">₹{selectedPrice}</span>
                        </div>

                        <div className="product-actions">
                          {qty > 0 ? (
                            <div className="quantity-controls">
                              <button
                                className="qty-btn minus"
                                onClick={() =>
                                  decreaseQty(item._id, selectedVariant)
                                }
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                              </button>
                              <span className="qty-display">{qty} in cart</span>
                              <button
                                className="qty-btn plus"
                                onClick={() =>
                                  increaseQty(item._id, selectedVariant)
                                }
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <line x1="12" y1="5" x2="12" y2="19"></line>
                                  <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                              </button>
                              <button
                                className="remove-from-cart"
                                onClick={() => {
                                  const key = `${item._id}_${selectedVariant}`;
                                  removeFromCart(key);
                                }}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <polyline points="3,6 5,6 21,6"></polyline>
                                  <path d="M19,6V20a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6M8,6V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"></path>
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <button
                              className="add-to-cart-btn"
                              onClick={() =>
                                addToCart(item._id, selectedVariant)
                              }
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                              </svg>
                              Add to Cart
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        </div>

      {/* Cart Modal (outside menu-page) */}
      <div
        className="modal fade"
        id="cartModal"
        tabIndex={-1}
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Your Cart</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              {cartTotalItems === 0 ? (
                <p className="text-muted">Your cart is empty</p>
              ) : (
                <ul className="list-group">
                  {cartItems.map((item) => {
                    const [id, variant] = item.id.split("_");
                    const product = products.find((p: any) => p._id === id);
                    if (!product) return null;
                    
                    return (
                      <li
                        key={item.id}
                        className="list-group-item d-flex justify-content-between align-items-center"
                      >
                        <div>
                          <strong>{item.name || product.name}</strong> ({item.variant || variant})
                          <br />
                          <span className="text-muted">
                            ₹{item.price}
                          </span>
                        </div>
                        <div className="d-flex align-items-center">
                          <button
                            className="btn btn-sm"
                            style={{
                              background: "#dd9933",
                              color: "#fff",
                            }}
                            onClick={() => decreaseQty(id, variant)}
                          >
                            –
                          </button>
                          <span className="mx-2">{item.quantity}</span>
                          <button
                            className="btn btn-sm"
                            style={{
                              background: "#124f31",
                              color: "#fff",
                            }}
                            onClick={() => increaseQty(id, variant)}
                          >
                            +
                          </button>
                          <button
                            className="remove-btn ms-3"
                            onClick={() => removeFromCart(item.id)}
                          >
                            Remove
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            {cartTotalItems > 0 && (
              <div className="modal-footer">
                <h5 className="me-auto">Total: ₹{subtotal.toFixed(2)}</h5>
                <button 
                  className="btn btn-success"
                  onClick={() => {
                    // Close the modal first
                    const modal = document.getElementById('cartModal');
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const modalInstance = (window as any).bootstrap?.Modal?.getInstance(modal);
                    if (modalInstance) {
                      modalInstance.hide();
                    }
                    
                    // Ensure complete cleanup of modal backdrop and body styles
                    setTimeout(() => {
                      // Remove any lingering modal backdrops
                      const backdrops = document.querySelectorAll('.modal-backdrop');
                      backdrops.forEach(backdrop => backdrop.remove());
                      
                      // Reset body styles
                      document.body.classList.remove('modal-open');
                      document.body.style.overflow = '';
                      document.body.style.paddingRight = '';
                      
                      // Navigate to checkout
                      router.push('/checkout');
                    }, 150); // Small delay to ensure modal close animation completes
                  }}
                >
                  Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Zomato-style Location Modal */}
      <ZomatoLocationModal 
        isOpen={showLocationPrompt && pathname === '/'}
        onClose={() => setShowLocationPrompt(false)}
        onLocationSet={(locationData) => {
          setUserLocation({
            lat: locationData.lat,
            lng: locationData.lng,
            address: locationData.address,
            distance: locationData.distance
          });
          setDeliveryAvailable(locationData.isWithinDeliveryRadius);
          setShowLocationPrompt(false);
        }}
      />
    </>
  );
}
