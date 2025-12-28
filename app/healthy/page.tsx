"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import "bootstrap/dist/css/bootstrap.min.css";
import "../menu.css";
import Image from "next/image";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import config, { buildApiUrl } from "../../config";
import { useLocation } from "../contexts/LocationContext";
import ZomatoLocationModal from "../components/ZomatoLocationModal";
import "../components/ZomatoLocationModal.css";
import ImageSlider from "../components/ImageSlider";
import { convertGoogleDriveUrl } from "../../utils/imageHelper";

export default function HealthyMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const [products, setProducts] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]); // Store all products for cart display
  const [selectedVariants, setSelectedVariants] = useState<{[key: string]: string}>({});
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);

  const { addToCart: addToCartContext, updateQuantity, removeFromCart, cartItems, totalItems: cartTotalItems, subtotal } = useCart();
  const { userLocation, deliveryAvailable, setUserLocation, setDeliveryAvailable, clearLocation } = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  // Healthy slider images
  const sliderImages = [
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1400&h=450&fit=crop&q=80",
    "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1400&h=450&fit=crop&q=80",
    "https://images.unsplash.com/photo-1547592180-85f173990554?w=1400&h=450&fit=crop&q=80",
    "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1400&h=450&fit=crop&q=80",
    "https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=1400&h=450&fit=crop&q=80"
  ];

  useEffect(() => {
    // ✅ Load Bootstrap only on client
    import("bootstrap/dist/js/bootstrap.bundle.min.js")
      .then((bootstrap: any) => {
        console.log("✅ Bootstrap JS loaded");
        const modalEl = document.getElementById("cartModal");
        if (modalEl) {
          new (bootstrap as any).Modal(modalEl);
          console.log("✅ Bootstrap modal initialized");
        }
      })
      .catch((err) => console.error("❌ Bootstrap JS failed", err));

    // Fetch only healthy category products
    fetch(buildApiUrl(config.api.endpoints.products))
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          console.log("Fetched all products:", data.length);
          // Store all products for cart display
          setAllProducts(data);
          // Filter only healthy items for display (case-insensitive)
          const healthyProducts = data.filter((p: any) => {
            const category = p.category?.toLowerCase().trim() || "";
            return category === "healthy";
          });
          console.log("Healthy products after filter:", healthyProducts.length);
          setProducts(healthyProducts);
        } else {
          console.error("Invalid data format:", data);
        }
      })
      .catch((err) => console.error("Fetch error:", err));

    // Delay location prompt check to allow localStorage to load
    const timer = setTimeout(() => {
      if (!userLocation) {
        setShowLocationPrompt(true);
      }
    }, 100);

    // Cleanup function to remove timer and modal backdrops when component unmounts
    return () => {
      clearTimeout(timer);
      
      // Remove any lingering modal backdrops
      const backdrops = document.querySelectorAll('.modal-backdrop');
      backdrops.forEach(backdrop => backdrop.remove());
      
      // Reset body styles that might be set by Bootstrap modal
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [userLocation]);

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
    const qty = getItemQuantity(id, variant);
    if (qty === 1) {
      removeFromCart(key);
    } else {
      updateQuantity(key, qty - 1);
    }
  };

  const handleChangeLocation = () => {
    clearLocation();
    setShowLocationPrompt(true);
  };

  return (
    <>
      <div className="menu-page">
        {/* Image Slider replacing hero section */}
        <div style={{ marginTop: '0px' }}>
          <ImageSlider images={sliderImages} autoPlay={true} interval={4000} />
        </div>

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
          {/* Products Grid */}
          <div className="products-section">
            {products.length === 0 ? (
              <div className="empty-state">
                <p>No healthy items available at the moment.</p>
              </div>
            ) : (
              <div className="products-grid">
                {products.map((item: any) => {
                  // Safety check for variants
                  if (!item.variants || item.variants.length === 0) {
                    return null;
                  }
                  
                  const selectedVariant =
                    selectedVariants[item._id] || item.variants[0].type;
                  const selectedPrice = item.variants.find(
                    (v: any) => v.type === selectedVariant
                  )?.price;

                  const qty = getItemQuantity(item._id, selectedVariant);

                  return (
                    <div key={item._id} className="menu-item-card">
                      <div className="item-content">
                        <div className="item-info">
                          <div className="veg-indicator">
                            <div className="veg-icon veg">
                              🟢
                            </div>
                          </div>
                          
                          <h3 className="item-name">{item.name}</h3>
                          
                          <div className="item-description">
                            {item.description}
                          </div>

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
                        </div>

                        <div className="item-image-section">
                          <div className="item-image">
                            {item.imageUrl ? (
                              <img 
                                src={convertGoogleDriveUrl(item.imageUrl)} 
                                alt={item.name}
                                width={120}
                                height={120}
                                style={{ objectFit: 'cover', borderRadius: '8px' }}
                                onError={(e) => {
                                  console.log('Image load error for:', item.name, item.imageUrl);
                                  e.currentTarget.style.display = 'none';
                                  const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                                  if (placeholder) placeholder.classList.remove('d-none');
                                }}
                                onLoad={() => console.log('Image loaded:', item.name)}
                              />
                            ) : null}
                            <div className={item.imageUrl ? 'd-none' : ''}>
                              <div className="placeholder-image">
                                <span>🥗</span>
                                <small>No Image</small>
                              </div>
                            </div>
                          </div>
                          
                          <div className="item-actions">
                            {qty > 0 ? (
                              <div className="quantity-controls">
                                <button
                                  className="qty-btn minus"
                                  onClick={(e) => {
                                    decreaseQty(item._id, selectedVariant);
                                    e.currentTarget.blur();
                                  }}
                                >
                                  −
                                </button>
                                <span className="qty-display">{qty}</span>
                                <button
                                  className="qty-btn plus"
                                  onClick={(e) => {
                                    increaseQty(item._id, selectedVariant);
                                    e.currentTarget.blur();
                                  }}
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <button
                                className="add-btn"
                                onClick={(e) => {
                                  addToCart(item._id, selectedVariant);
                                  e.currentTarget.blur();
                                }}
                              >
                                Add
                              </button>
                            )}
                            
                            <div className="item-price">₹{selectedPrice}</div>
                          </div>
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
                    const product = allProducts.find((p: any) => p._id === id);
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
                    // Check authentication before proceeding to checkout
                    if (authLoading) {
                      // Still loading, don't proceed yet
                      return;
                    }
                    
                    if (!isAuthenticated || !user) {
                      router.push('/auth?redirect=checkout');
                      return;
                    }
                    
                    // Close the modal first
                    const modal = document.getElementById('cartModal');
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
                  disabled={authLoading}
                >
                  {authLoading ? 'Loading...' : 'Checkout'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Zomato-style Location Modal */}
      <ZomatoLocationModal 
        isOpen={showLocationPrompt && pathname === '/healthy'}
        onClose={() => setShowLocationPrompt(false)}
        onLocationSet={(locationData: any) => {
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
