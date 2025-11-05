"use client";
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useRouter, usePathname } from 'next/navigation';

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
  }, []);

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
            <img src="/logo.png" alt="The Quisine Logo" className="brand-logo" />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="header-nav desktop-nav">
          <Link href="/" className="nav-item">Menu</Link>
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
            
            {/* Dropdown Menu - Only render when mounted to prevent hydration issues */}
            {isMounted && (
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
            )}
          </div>

          {/* Cart Icon - Only render cart button when mounted and check pathname */}
          {isMounted ? (
            pathname === '/' ? (
              <button 
                className="header-icon-btn cart-btn"
                data-bs-toggle="modal"
                data-bs-target="#cartModal"
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

          {/* Hamburger Menu Button - Mobile Only */}
          <button 
            className="hamburger-btn mobile-only"
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
    </header>
  );
}
