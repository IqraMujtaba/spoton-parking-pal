
import React, { useEffect } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar as UISidebar } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Users, MapPin, Settings, LogOut } from 'lucide-react';

const AdminLayout = () => {
  const { isAuthenticated, isAdmin, loading, logout } = useAuth();
  const location = useLocation();
  
  // Redirect non-authenticated and non-admin users
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return (
    <div className="min-h-screen bg-background">
      <div className="grid lg:grid-cols-[280px_1fr] lg:gap-4 h-screen">
        <UISidebar>
          <div className="flex flex-col h-full">
            <div className="p-6 border-b">
              <h1 className="font-semibold text-xl">SpotOn Admin</h1>
            </div>
            <div className="flex-1 px-4 py-6 space-y-1">
              <SidebarLink
                href="/admin/dashboard"
                icon={<LayoutDashboard className="size-4" />}
                active={location.pathname === '/admin/dashboard'}
              >
                Dashboard
              </SidebarLink>
              <SidebarLink
                href="/admin/parking"
                icon={<MapPin className="size-4" />}
                active={location.pathname === '/admin/parking'}
              >
                Parking Management
              </SidebarLink>
              <SidebarLink
                href="/admin/users"
                icon={<Users className="size-4" />}
                active={location.pathname === '/admin/users'}
              >
                User Management
              </SidebarLink>
              <SidebarLink
                href="/profile"
                icon={<Settings className="size-4" />}
                active={location.pathname === '/profile'}
              >
                Settings
              </SidebarLink>
            </div>
            <div className="p-4 mt-auto border-t">
              <Button variant="ghost" className="w-full justify-start" onClick={logout}>
                <LogOut className="mr-2 size-4" />
                Logout
              </Button>
              <Button variant="outline" className="w-full justify-start mt-2" asChild>
                <Link to="/dashboard">
                  Back to App
                </Link>
              </Button>
            </div>
          </div>
        </UISidebar>
        
        <main className="overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  active: boolean;
  children: React.ReactNode;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ href, icon, active, children }) => {
  return (
    <Link
      to={href}
      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
        active
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      }`}
    >
      {icon}
      {children}
    </Link>
  );
};

export default AdminLayout;
