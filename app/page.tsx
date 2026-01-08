"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import "bootstrap/dist/css/bootstrap.min.css";
import "./menu.css";
import Image from "next/image";
import { useCart } from "./contexts/CartContext";
import { useAuth } from "./contexts/AuthContext";
import config, { buildApiUrl } from "../config";
import { useLocation } from "./contexts/LocationContext";
import ZomatoLocationModal from "./components/ZomatoLocationModal";
import "./components/ZomatoLocationModal.css";
import ImageSlider from "./components/ImageSlider";
import { convertGoogleDriveUrl } from "../utils/imageHelper";

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const [products, setProducts] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]); // Store all products for cart display
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedVariants, setSelectedVariants] = useState<{[key: string]: string}>({});
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const { addToCart: addToCartContext, updateQuantity, removeFromCart, cartItems, totalItems: cartTotalItems, subtotal } = useCart();
  const { userLocation, deliveryAvailable, setUserLocation, setDeliveryAvailable, clearLocation } = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  // Slider images
  const sliderImages = [
    "/slider/menu-1.JPG",
    "/slider/menu-2.JPG",
    "/slider/menu-3.JPG",
    "/slider/mneu-4.JPG",
    "/slider/menu-5.JPG"
  ];

  useEffect(() => {
    setIsMounted(true);
    
    // 🚀 PRIORITY: Fetch products immediately - no delays!
    setIsLoadingProducts(true);
    fetch(buildApiUrl(config.api.endpoints.products))
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          console.log("✅ Products loaded:", data.length);
          // Store all products for cart display
          setAllProducts(data);
          // Filter out healthy items from main menu (case-insensitive)
          const regularProducts = data.filter((p: any) => {
            const category = p.category?.toLowerCase().trim() || "";
            return category !== "healthy";
          });
          setProducts(regularProducts);
          setSelectedCategory(""); // show all by default
        } else {
          console.error("Invalid data format:", data);
        }
      })
      .catch((err) => console.error("Fetch error:", err))
      .finally(() => setIsLoadingProducts(false));

    // Load Bootstrap in parallel (non-blocking)
    import("bootstrap/dist/js/bootstrap.bundle.min.js")
      .then((bootstrap: any) => {
        const modalEl = document.getElementById("cartModal");
        if (modalEl) {
          new (bootstrap as any).Modal(modalEl);
        }
      })
      .catch((err) => console.error("❌ Bootstrap JS failed", err));

    // Show location prompt immediately if no location set
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
            {!isMounted || isLoadingProducts ? (
              <div className="products-grid">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <div key={idx} className="menu-item-card" style={{ opacity: 0.6 }}>
                    <div className="item-content">
                      <div className="item-info">
                        <div className="skeleton-loader" style={{ width: '60%', height: '24px', marginBottom: '8px' }}></div>
                        <div className="skeleton-loader" style={{ width: '100%', height: '16px', marginBottom: '4px' }}></div>
                        <div className="skeleton-loader" style={{ width: '80%', height: '16px' }}></div>
                      </div>
                      <div className="item-image-section">
                        <div className="skeleton-loader" style={{ width: '120px', height: '120px', borderRadius: '8px' }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="empty-state">
                <p>No items found in this category.</p>
              </div>
            ) : (
              <div className="products-grid">
                {filteredProducts.map((item: any) => {
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
                            <div className={`veg-icon ${item.category.toLowerCase().includes('chicken') || item.category.toLowerCase().includes('mutton') || item.category.toLowerCase().includes('egg') ? 'non-veg' : 'veg'}`}>
                              {item.category.toLowerCase().includes('chicken') || item.category.toLowerCase().includes('mutton') || item.category.toLowerCase().includes('egg') ? '🔺' : '🟢'}
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
                                <span>🍛</span>
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
                {subtotal < 249 && (
                  <small style={{ color: '#e53e3e', marginRight: 'auto' }}>
                    Minimum order: ₹249
                  </small>
                )}
                <button 
                  className="btn btn-success"
                  onClick={() => {
                    // Check minimum cart value
                    if (subtotal < 249) {
                      alert('Minimum order value is ₹249. Please add more items to your cart.');
                      return;
                    }
                    
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
                  disabled={authLoading || subtotal < 249}
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
        isOpen={showLocationPrompt && pathname === '/'}
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
