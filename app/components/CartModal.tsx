"use client";
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function CartModal() {
  const { cartItems, totalItems, removeFromCart, updateQuantity } = useCart();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [allProducts, setAllProducts] = useState<any[]>([]);

  // Calculate subtotal
  const subtotal = cartItems.reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0);

  // Close modal when navigating to checkout or auth pages
  useEffect(() => {
    if (pathname === '/checkout' || pathname === '/auth') {
      const modal = document.getElementById('cartModal');
      if (modal) {
        // Try Bootstrap method first
        if (typeof window !== 'undefined' && (window as any).bootstrap?.Modal) {
          const modalInstance = (window as any).bootstrap.Modal.getInstance(modal);
          if (modalInstance) {
            modalInstance.hide();
          }
        }
        
        // Force cleanup manually
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(backdrop => backdrop.remove());
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        modal.classList.remove('show');
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
        modal.removeAttribute('aria-modal');
      }
    }
  }, [pathname]);

  // Fetch products to get details
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        if (response.ok) {
          const data = await response.json();
          setAllProducts(data);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    fetchProducts();
  }, []);

  const increaseQty = (id: string, variant: string) => {
    const itemId = `${id}_${variant}`;
    const item = cartItems.find(i => i.id === itemId);
    if (item) {
      updateQuantity(itemId, item.quantity + 1);
    }
  };

  const decreaseQty = (id: string, variant: string) => {
    const itemId = `${id}_${variant}`;
    const item = cartItems.find(i => i.id === itemId);
    if (item) {
      if (item.quantity > 1) {
        updateQuantity(itemId, item.quantity - 1);
      } else {
        removeFromCart(itemId);
      }
    }
  };

  const handleCheckout = () => {
    // Check minimum cart value
    if (subtotal < 249) {
      alert('Minimum order value is ₹249. Please add more items to your cart.');
      return;
    }
    
    // Check authentication before proceeding to checkout
    if (authLoading) {
      return;
    }
    
    if (!isAuthenticated || !user) {
      // Close modal before auth redirect
      const modal = document.getElementById('cartModal');
      if (modal && typeof window !== 'undefined' && (window as any).bootstrap?.Modal) {
        const modalInstance = (window as any).bootstrap.Modal.getInstance(modal);
        if (modalInstance) {
          modalInstance.hide();
        }
      }
      
      setTimeout(() => {
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(backdrop => backdrop.remove());
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        router.push('/auth?redirect=checkout');
      }, 300);
      return;
    }
    
    // Close the modal completely before navigation
    const modal = document.getElementById('cartModal');
    if (modal) {
      // Check if Bootstrap is loaded
      if (typeof window !== 'undefined' && (window as any).bootstrap?.Modal) {
        const modalInstance = (window as any).bootstrap.Modal.getInstance(modal);
        if (modalInstance) {
          modalInstance.hide();
        } else {
          // Try creating instance if it doesn't exist
          try {
            const newInstance = new (window as any).bootstrap.Modal(modal);
            newInstance.hide();
          } catch (e) {
            console.log('Bootstrap Modal not available, using manual close');
          }
        }
      }
      
      // Manual cleanup - works even without Bootstrap
      modal.classList.remove('show');
      modal.style.display = 'none';
      modal.setAttribute('aria-hidden', 'true');
      modal.removeAttribute('aria-modal');
    }
    
    // Force cleanup with longer delay to ensure modal is closed
    setTimeout(() => {
      // Remove all modal backdrops
      const backdrops = document.querySelectorAll('.modal-backdrop');
      backdrops.forEach(backdrop => {
        backdrop.remove();
      });
      
      // Remove modal-open class and reset body styles
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      
      // Navigate to checkout
      router.push('/checkout');
    }, 300);
  };

  return (
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
            {totalItems === 0 ? (
              <p className="text-muted">Your cart is empty</p>
            ) : (
              <ul className="list-group">
                {cartItems.map((item) => {
                  const [id, variant] = item.id.split("_");
                  const product = allProducts.find((p: any) => p._id === id);
                  
                  return (
                    <li
                      key={item.id}
                      className="list-group-item d-flex justify-content-between align-items-center"
                    >
                      <div>
                        <strong>{item.name}</strong> {variant && `(${variant})`}
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
          {totalItems > 0 && (
            <div className="modal-footer">
              <h5 className="me-auto">Total: ₹{subtotal.toFixed(2)}</h5>
              {subtotal < 249 && (
                <small style={{ color: '#e53e3e', marginRight: 'auto' }}>
                  Minimum order: ₹249
                </small>
              )}
              <button 
                className="btn btn-success"
                onClick={handleCheckout}
                disabled={authLoading || subtotal < 249}
              >
                {authLoading ? 'Loading...' : 'Checkout'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
