"use client";
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import config, { buildApiUrl } from '../../config';
import './SiteClosedModal.css';

interface SiteStatus {
  isOpen: boolean;
  closedMessage: string;
  reopenTime: string | null;
}

export default function SiteClosedModal() {
  const [siteStatus, setSiteStatus] = useState<SiteStatus>({ isOpen: true, closedMessage: '', reopenTime: null });
  const [timeRemaining, setTimeRemaining] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
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

  // Countdown timer
  useEffect(() => {
    if (!siteStatus.reopenTime) return;

    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const target = new Date(siteStatus.reopenTime!).getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeRemaining({ days, hours, minutes, seconds });
    };

    calculateTimeRemaining();
    const timer = setInterval(calculateTimeRemaining, 1000);
    return () => clearInterval(timer);
  }, [siteStatus.reopenTime]);

  if (siteStatus.isOpen || isAdminRoute) return null;

  return (
    <div className="site-closed-overlay">
      <div className="site-closed-modal">
        <div className="site-closed-icon">🏪</div>
        <div className="site-closed-badge">CLOSED</div>
        <h2>We're Currently Closed</h2>
        <p>{siteStatus.closedMessage}</p>
        
        {siteStatus.reopenTime && (
          <div className="countdown-container">
            <h3 className="countdown-title">Opening In:</h3>
            <div className="countdown-timer">
              {timeRemaining.days > 0 && (
                <div className="time-block">
                  <span className="time-value">{timeRemaining.days}</span>
                  <span className="time-label">Days</span>
                </div>
              )}
              <div className="time-block">
                <span className="time-value">{String(timeRemaining.hours).padStart(2, '0')}</span>
                <span className="time-label">Hours</span>
              </div>
              <div className="time-block">
                <span className="time-value">{String(timeRemaining.minutes).padStart(2, '0')}</span>
                <span className="time-label">Minutes</span>
              </div>
              <div className="time-block">
                <span className="time-value">{String(timeRemaining.seconds).padStart(2, '0')}</span>
                <span className="time-label">Seconds</span>
              </div>
            </div>
          </div>
        )}
        
        <div className="site-closed-emoji">💤</div>
      </div>
    </div>
  );
}
