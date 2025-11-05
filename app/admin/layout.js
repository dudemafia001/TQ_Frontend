"use client";
import { usePathname } from 'next/navigation';
import AdminRoute from '../components/AdminRoute';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');

  if (isAdminRoute) {
    return (
      <AdminRoute>
        {children}
      </AdminRoute>
    );
  }

  return children;
}