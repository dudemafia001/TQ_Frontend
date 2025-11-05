"use client";
import { useEffect } from 'react';
import { useAdmin } from '../contexts/AdminContext';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminRoute({ children }) {
  const { isAuthenticated, loading } = useAdmin();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isAuthenticated && pathname.startsWith('/admin/dashboard')) {
      router.push('/admin');
    }
  }, [isAuthenticated, loading, router, pathname]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontSize: '1.2rem',
        color: '#718096'
      }}>
        Loading...
      </div>
    );
  }

  if (!isAuthenticated && pathname.startsWith('/admin/dashboard')) {
    return null; // Will redirect in useEffect
  }

  return children;
}