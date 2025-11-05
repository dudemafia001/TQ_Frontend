"use client";
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function AnnouncementBar() {
  const { user, logout, isAuthenticated } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    router.push('/');
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className="announcement-bar fixed-top">
      <div className="container-fluid h-100">
        <div className="d-flex align-items-center justify-content-between h-100">
          {/* Left Side - Logo and Navigation Links */}
          <div className="d-flex align-items-center">
            <Link href="/" className="d-flex align-items-center me-3">
              <Image
                src="/logo text.png"
                alt="The Quisine Logo"
                width={120}
                height={40}
                className="announcement-logo"
              />
            </Link>
            <Link href="/" className="nav-link announcement-link">
              Menu
            </Link>
            <Link href="/about" className="nav-link announcement-link">
              About Us
            </Link>
            <Link href="/services" className="nav-link announcement-link">
              Service
            </Link>
            <Link href="/contact" className="nav-link announcement-link">
              Contact
            </Link>
          </div>
          
          {/* Right Side - User Account */}
          <div className="d-flex align-items-center">
            {isAuthenticated ? (
              <div className="nav-item dropdown" ref={dropdownRef}>
                <button
                  className="nav-link announcement-link dropdown-toggle d-flex align-items-center"
                  onClick={toggleDropdown}
                  style={{ border: 'none', background: 'none', position: 'relative' }}
                  aria-expanded={isDropdownOpen}
                >
                  👤 {user}
                </button>
                <ul 
                  className={`dropdown-menu dropdown-menu-end ${isDropdownOpen ? 'show' : ''}`}
                >
                  <li>
                    <Link href="/orders" className="dropdown-item">
                      📦 My Orders
                    </Link>
                  </li>
                  <li>
                    <Link href="/account" className="dropdown-item">
                      ⚙️ Account Details
                    </Link>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button className="dropdown-item" onClick={handleLogout}>
                      ⏻ Logout
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              <Link href="/auth" className="nav-link announcement-link">
                👤 Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
