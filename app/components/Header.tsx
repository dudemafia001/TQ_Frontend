"use client";
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useRouter, usePathname } from 'next/navigation';
import './Header.css';

export default function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const { totalItems } = useCart();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
    console.log('Header mounted, pathname:', pathname);
  }, [pathname]);

  // Close dropdown and mobile menu when clicking outside
  useEffect(() => {
    if (!isMounted) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMounted]);

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    router.push('/');
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="unified-header">
      <div className="header-container">
        {/* Logo/Brand - Hidden on mobile */}
        <div className="header-brand">
          <Link href="/" className="brand-link">
            <Image src="/logo.png" alt="The Quisine Logo" className="brand-logo" width={80} height={80} />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="header-nav desktop-nav">
          <Link href="/" className="nav-item">Menu</Link>
          <Link href="/healthy" className="nav-item">Healthy</Link>
          <Link href="/about" className="nav-item">About Us</Link>
          <Link href="/services" className="nav-item">Service</Link>
          <Link href="/contact" className="nav-item">Contact</Link>
        </nav>
        
        {/* Right Side - Icons */}
        <div className="header-icons">
          {/* User Icon with Dropdown */}
          <div className="user-dropdown-container" ref={dropdownRef}>
            <button
              className="header-icon-btn user-btn"
              onClick={toggleDropdown}
              aria-expanded={isDropdownOpen}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="4"></circle>
                <path d="M6 21c0-3.314 2.686-6 6-6s6 2.686 6 6"></path>
              </svg>
            </button>
            
            {/* Dropdown Menu */}
            <div className={`user-dropdown ${isDropdownOpen ? 'show' : ''}`}>
              {isAuthenticated ? (
                <>
                  <div className="dropdown-header">
                    <span className="user-name">{user}</span>
                  </div>
                  <Link href="/orders" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                    My Orders
                  </Link>
                  <Link href="/account" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                    Account Details
                  </Link>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item logout-btn" onClick={handleLogout}>
                    Logout
                  </button>
                </>
              ) : (
                <Link href="/auth" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                  Sign In
                </Link>
              )}
            </div>
          </div>

          {/* Cart Icon - Only render cart button when mounted and check pathname */}
          {isMounted ? (
            (pathname === '/' || pathname === '/healthy') ? (
              <button 
                type="button"
                className="header-icon-btn cart-btn"
                data-bs-toggle="modal"
                data-bs-target="#cartModal"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Cart button clicked on:', pathname);
                  
                  // Manually trigger modal if Bootstrap is loaded
                  const modalEl = document.getElementById('cartModal');
                  if (modalEl && (window as any).bootstrap?.Modal) {
                    try {
                      const modalInstance = (window as any).bootstrap.Modal.getOrCreateInstance(modalEl);
                      modalInstance.show();
                    } catch (error) {
                      console.error('Error opening modal:', error);
                    }
                  }
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
              </button>
            ) : (
              <Link href="/" className="header-icon-btn cart-btn">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
              </Link>
            )
          ) : (
            // Placeholder for SSR
            <div className="header-icon-btn cart-btn">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
            </div>
          )}

          {/* Hamburger Menu Button - Hidden for mobile, keep for tablet */}
          <button 
            className="hamburger-btn tablet-only"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            <span className={`hamburger-line ${isMobileMenuOpen ? 'active' : ''}`}></span>
            <span className={`hamburger-line ${isMobileMenuOpen ? 'active' : ''}`}></span>
            <span className={`hamburger-line ${isMobileMenuOpen ? 'active' : ''}`}></span>
          </button>
        </div>

        {/* Mobile Menu Backdrop */}
        {isMounted && isMobileMenuOpen && (
          <div 
            className="mobile-menu-backdrop"
            onClick={closeMobileMenu}
          />
        )}

        {/* Mobile Menu Overlay */}
        {isMounted && (
          <div 
            className={`mobile-menu-overlay ${isMobileMenuOpen ? 'show' : ''}`}
            ref={mobileMenuRef}
          >
            <div className="mobile-menu-header">
              <h3 className="mobile-menu-heading">Links</h3>
              <button 
                className="mobile-menu-close"
                onClick={closeMobileMenu}
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>
            <div className="mobile-menu-content">
              <nav className="mobile-nav">
                <Link href="/" className="mobile-nav-item" onClick={closeMobileMenu}>
                  Menu
                </Link>
                <Link href="/healthy" className="mobile-nav-item" onClick={closeMobileMenu}>
                  Healthy
                </Link>
                <Link href="/about" className="mobile-nav-item" onClick={closeMobileMenu}>
                  About Us
                </Link>
                <Link href="/services" className="mobile-nav-item" onClick={closeMobileMenu}>
                  Service
                </Link>
                <Link href="/contact" className="mobile-nav-item" onClick={closeMobileMenu}>
                  Contact
                </Link>
              </nav>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      {isMounted && (
        <>
          <nav className="mobile-bottom-nav">
            <Link href="/" className={`bottom-nav-item ${pathname === '/' ? 'active' : ''}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              <span>Home</span>
            </Link>
            <Link href="/healthy" className={`bottom-nav-item ${pathname === '/healthy' ? 'active' : ''}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a10 10 0 0 1 10 10 4 4 0 0 1-4 4h-1.5a2.5 2.5 0 1 0 0 5H12a10 10 0 0 1 0-20z"></path>
                <circle cx="7" cy="10" r="1"></circle>
                <circle cx="12" cy="8" r="1"></circle>
                <circle cx="16" cy="10" r="1"></circle>
              </svg>
              <span>Healthy</span>
            </Link>
            <Link href="/services" className={`bottom-nav-item ${pathname === '/services' ? 'active' : ''}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 6v6l4 2"></path>
              </svg>
              <span>Services</span>
            </Link>
            <Link href="/orders" className={`bottom-nav-item ${pathname === '/orders' ? 'active' : ''}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              <span>Orders</span>
            </Link>
            <Link href="/account" className={`bottom-nav-item ${pathname === '/account' ? 'active' : ''}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="4"></circle>
                <path d="M6 21c0-3.314 2.686-6 6-6s6 2.686 6 6"></path>
              </svg>
              <span>Profile</span>
            </Link>
          </nav>

          {/* Floating Cart Button - Mobile Only */}
          {(pathname === '/' || pathname === '/healthy') ? (
            <button 
              type="button"
              className="floating-cart-btn"
              data-bs-toggle="modal"
              data-bs-target="#cartModal"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Floating cart clicked on:', pathname);
                
                // Manually trigger modal if Bootstrap is loaded
                const modalEl = document.getElementById('cartModal');
                if (modalEl && (window as any).bootstrap?.Modal) {
                  try {
                    const modalInstance = (window as any).bootstrap.Modal.getOrCreateInstance(modalEl);
                    modalInstance.show();
                  } catch (error) {
                    console.error('Error opening modal:', error);
                  }
                }
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              {totalItems > 0 && <span className="floating-cart-badge">{totalItems}</span>}
            </button>
          ) : (
            <Link href="/" className="floating-cart-btn">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              {totalItems > 0 && <span className="floating-cart-badge">{totalItems}</span>}
            </Link>
          )}
        </>
      )}
    </header>
  );
}
