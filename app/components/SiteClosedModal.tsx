"use client";
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import config, { buildApiUrl } from '../../config';
import './SiteClosedModal.css';

export default function SiteClosedModal() {
  const [siteStatus, setSiteStatus] = useState({ isOpen: true, closedMessage: '' });
  const pathname = usePathname();

  // Don't show modal on admin routes
  const isAdminRoute = pathname?.startsWith('/admin');

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch(buildApiUrl(config.api.endpoints.site.status));
        const data = await res.json();
        if (data.success) {
          setSiteStatus(data.data);
        }
      } catch (err) {
        console.error('Error checking site status:', err);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (siteStatus.isOpen || isAdminRoute) return null;

  return (
    <div className="site-closed-overlay">
      <div className="site-closed-modal">
        <div className="site-closed-icon">🏪</div>
        <div className="site-closed-badge">CLOSED</div>
        <h2>We're Currently Closed</h2>
        <p>{siteStatus.closedMessage}</p>
        <div className="site-closed-emoji">💤</div>
      </div>
    </div>
  );
}
