import React, { useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { Menu, X, MapPin, Upload, Settings, LogOut, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navigationItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Beaches', href: '/admin/beaches', icon: MapPin },
    { name: 'Import/Export', href: '/admin/import-export', icon: Upload },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
      isActive
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
    }`;

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        >
          <div className="fixed inset-0 bg-black/25" />
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            Admin Panel
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <nav className="mt-4 px-4 space-y-2 flex-1 overflow-y-auto">
          {navigationItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === '/admin'}
              className={getNavLinkClass}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="mr-3 h-4 w-4" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* User info and sign out */}
        <div className="mt-auto p-4 border-t border-border bg-card">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Signed in as:</p>
            <p className="text-sm font-medium text-foreground truncate">
              {profile?.email}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="bg-card border-b border-border h-16 flex items-center justify-between px-4">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden mr-2"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-semibold text-foreground">
              Greek Beaches Directory
            </h1>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;