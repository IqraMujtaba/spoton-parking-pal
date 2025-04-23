
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { MapPin, Calendar, Clock, CheckSquare } from 'lucide-react';

const Index = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <header className="bg-gradient-to-r from-spoton-primary to-spoton-secondary text-white">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Never search for parking again
            </h1>
            <p className="text-xl md:text-2xl mb-8">
              SpotOn makes it easy to find and book parking spots at Ajman University.
            </p>
            <div className="flex flex-wrap gap-4">
              {isAuthenticated ? (
                <Link to="/dashboard">
                  <Button size="lg" className="bg-white text-spoton-primary hover:bg-gray-100">
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <Link to="/login">
                  <Button size="lg" className="bg-white text-spoton-primary hover:bg-gray-100">
                    Get Started
                  </Button>
                </Link>
              )}
              <Link to="#how-it-works">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              SpotOn makes parking at Ajman University simple and stress-free.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="flex flex-col items-center text-center p-6 rounded-lg shadow-md">
              <div className="bg-spoton-light p-4 rounded-full mb-4">
                <MapPin className="h-8 w-8 text-spoton-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Choose a Building</h3>
              <p className="text-gray-600">
                Select from our three parking locations: J2-A, J2-B, or J2-C.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-6 rounded-lg shadow-md">
              <div className="bg-spoton-light p-4 rounded-full mb-4">
                <Calendar className="h-8 w-8 text-spoton-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Pick a Time</h3>
              <p className="text-gray-600">
                Select the date and time when you need parking.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-6 rounded-lg shadow-md">
              <div className="bg-spoton-light p-4 rounded-full mb-4">
                <CheckSquare className="h-8 w-8 text-spoton-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Reserve Your Spot</h3>
              <p className="text-gray-600">
                Book your parking spot with just a few clicks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose SpotOn?</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-2 text-spoton-primary">Easy Booking</h3>
              <p className="text-gray-600">
                Book your parking spot in seconds with our intuitive interface.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-2 text-spoton-primary">Real-Time Updates</h3>
              <p className="text-gray-600">
                See available spots in real-time, no more driving around searching.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-2 text-spoton-primary">Secure System</h3>
              <p className="text-gray-600">
                Only Ajman University students and staff can access the system.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-2 text-spoton-primary">Manage Bookings</h3>
              <p className="text-gray-600">
                View and cancel your bookings anytime from your dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-spoton-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to stop searching for parking?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join SpotOn today and make parking at Ajman University stress-free.
          </p>
          <Link to={isAuthenticated ? "/dashboard" : "/login"}>
            <Button size="lg" className="bg-white text-spoton-primary hover:bg-gray-100">
              {isAuthenticated ? 'Go to Dashboard' : 'Get Started Now'}
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-800 text-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h2 className="text-2xl font-bold">
                Spot<span className="text-spoton-secondary">On</span>
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                © 2025 SpotOn. All rights reserved.
              </p>
            </div>
            <div className="flex gap-6">
              <Link to="#" className="text-gray-400 hover:text-white">
                Privacy Policy
              </Link>
              <Link to="#" className="text-gray-400 hover:text-white">
                Terms of Service
              </Link>
              <Link to="#" className="text-gray-400 hover:text-white">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
