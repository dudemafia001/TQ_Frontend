"use client";
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function CartModal() {
  const { cartItems, totalItems, removeFromCart, updateQuantity } = useCart();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [allProducts, setAllProducts] = useState<any[]>([]);

  // Calculate subtotal
  const subtotal = cartItems.reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0);

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
    }, 150);
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
