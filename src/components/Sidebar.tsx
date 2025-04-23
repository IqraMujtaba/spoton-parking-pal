
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Calendar, MapPin, List, User } from 'lucide-react';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const location = useLocation();
  
  const navItems = [
    { 
      name: 'Dashboard', 
      path: '/dashboard', 
      icon: <MapPin className="h-5 w-5" /> 
    },
    { 
      name: 'Book a Spot', 
      path: '/booking', 
      icon: <Calendar className="h-5 w-5" /> 
    },
    { 
      name: 'My Bookings', 
      path: '/my-bookings', 
      icon: <List className="h-5 w-5" /> 
    },
    { 
      name: 'Profile', 
      path: '/profile', 
      icon: <User className="h-5 w-5" /> 
    }
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {open && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 md:hidden" 
          onClick={onClose} 
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 transform overflow-y-auto bg-white p-4 transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:z-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="mb-8 flex justify-center">
          <Link to="/dashboard" className="text-xl font-bold text-spoton-primary" onClick={onClose}>
            Spot<span className="text-spoton-secondary">On</span>
          </Link>
        </div>
        
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={cn(
                "flex items-center rounded-md px-4 py-3 text-sm font-medium transition-colors",
                location.pathname === item.path
                  ? "bg-spoton-primary text-white"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              {item.icon}
              <span className="ml-3">{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
