
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { Menu, User } from 'lucide-react';

interface NavbarProps {
  onMenuToggle: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuToggle }) => {
  const { user, profile, logout, isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-30 w-full bg-white border-b shadow-sm">
      <div className="container flex h-16 items-center">
        <Button variant="ghost" size="icon" className="md:hidden mr-2" onClick={onMenuToggle}>
          <Menu className="h-6 w-6" />
        </Button>
        
        <Link to="/" className="flex items-center">
          <span className="text-xl font-bold text-spoton-primary">
            Spot<span className="text-spoton-secondary">On</span>
          </span>
        </Link>
        
        {isAuthenticated && (
          <div className="hidden md:flex ml-6 space-x-4">
            <Link to="/dashboard" className="text-sm font-medium text-gray-700 hover:text-spoton-primary">
              Dashboard
            </Link>
            <Link to="/booking" className="text-sm font-medium text-gray-700 hover:text-spoton-primary">
              Book a Spot
            </Link>
            <Link to="/my-bookings" className="text-sm font-medium text-gray-700 hover:text-spoton-primary">
              My Bookings
            </Link>
          </div>
        )}
        
        <div className="ml-auto flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <Link 
                to="/profile"
                className="flex items-center text-sm font-medium text-gray-700 hover:text-spoton-primary"
              >
                <User className="h-4 w-4 mr-1" />
                <span className="hidden md:inline">
                  {profile?.full_name || profile?.email}
                </span>
              </Link>
              <Button variant="ghost" size="sm" onClick={logout}>
                Logout
              </Button>
            </>
          ) : (
            <div className="flex gap-2">
              <Link to="/login">
                <Button variant="outline" size="sm">
                  Login
                </Button>
              </Link>
              <Link to="/signup">
                <Button variant="default" size="sm">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
