
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Timer, QrCode, AlertTriangle } from 'lucide-react';
import { getActiveBooking, subscribeToBookings } from '@/services/supabaseService';
import { BookingWithSpot } from '@/lib/types';
import { format, differenceInMinutes, parseISO, addMinutes } from 'date-fns';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const ActiveBooking = () => {
  const { user } = useAuth();
  const [activeBooking, setActiveBooking] = useState<BookingWithSpot | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  
  // Load the active booking
  useEffect(() => {
    if (!user) return;
    
    const loadActiveBooking = async () => {
      try {
        setLoading(true);
        const booking = await getActiveBooking(user.id);
        setActiveBooking(booking);
        
        if (booking) {
          const [hours, minutes] = booking.end_time.split(':').map(Number);
          const endDateTime = new Date();
          endDateTime.setHours(hours, minutes, 0, 0);
          
          const remainingMinutes = differenceInMinutes(endDateTime, new Date());
          setTimeRemaining(Math.max(0, remainingMinutes));
        }
      } catch (error) {
        console.error('Error loading active booking:', error);
        toast.error('Failed to load active booking');
      } finally {
        setLoading(false);
      }
    };
    
    loadActiveBooking();
    
    // Subscribe to booking updates
    const subscribeToBookingUpdates = async () => {
      const subscription = await subscribeToBookings(user.id, (updatedBooking) => {
        if (activeBooking && updatedBooking.id === activeBooking.id) {
          // Reload the booking to get the full booking with spot data
          loadActiveBooking();
        }
      });
      
      return () => {
        if (subscription) {
          subscription.unsubscribe();
        }
      };
    };
    
    const unsubscribe = subscribeToBookingUpdates();
    return () => {
      unsubscribe.then(unsub => unsub && unsub());
    };
  }, [user]);
  
  // Update countdown timer every minute
  useEffect(() => {
    if (!activeBooking || timeRemaining <= 0) return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prevTime => {
        const newTime = prevTime - 1;
        if (newTime <= 0) {
          clearInterval(timer);
          toast.warning('Your parking time has expired!');
        }
        return Math.max(0, newTime);
      });
    }, 60000); // Update every minute
    
    return () => clearInterval(timer);
  }, [activeBooking, timeRemaining]);
  
  // Format the remaining time
  const formatTimeRemaining = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours > 0 ? `${hours}h ` : ''}${mins}m`;
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Active Booking</h1>
        <p className="text-gray-500">Your current parking reservation</p>
      </div>
      
      {loading ? (
        <Card>
          <CardContent className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-spoton-primary"></div>
          </CardContent>
        </Card>
      ) : activeBooking ? (
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-spoton-primary to-blue-600 text-white">
            <CardTitle className="text-xl flex justify-between items-center">
              <span>Building {activeBooking.spot?.building?.code}</span>
              
              <div className="flex items-center bg-white bg-opacity-20 px-3 py-1 rounded-full">
                <Timer className="h-4 w-4 mr-2" />
                <span className="font-mono">
                  {timeRemaining > 0 ? (
                    formatTimeRemaining(timeRemaining)
                  ) : (
                    'Expired'
                  )}
                </span>
              </div>
            </CardTitle>
            <CardDescription className="text-white text-opacity-90">
              Spot {activeBooking.spot?.spot_number} • {activeBooking.spot?.spot_type?.name}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-6">
              {/* QR Code Display */}
              <div className="bg-white p-4 rounded-lg shadow-md">
                {activeBooking.qr_code ? (
                  <img 
                    src={activeBooking.qr_code} 
                    alt="Booking QR Code" 
                    className="w-64 h-64"
                  />
                ) : (
                  <div className="w-64 h-64 flex items-center justify-center bg-gray-200">
                    <QrCode className="w-12 h-12 text-gray-400" />
                    <span className="text-gray-500">QR Code not available</span>
                  </div>
                )}
              </div>
              
              <div className="w-full space-y-4">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Date</span>
                  <span className="font-medium">
                    {format(parseISO(activeBooking.date), 'EEEE, MMMM d, yyyy')}
                  </span>
                </div>
                
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Time</span>
                  <span className="font-medium">
                    {activeBooking.start_time} - {activeBooking.end_time}
                  </span>
                </div>
                
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Location</span>
                  <span className="font-medium">
                    Building {activeBooking.spot?.building?.code}, Spot {activeBooking.spot?.spot_number}
                  </span>
                </div>
                
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Status</span>
                  <span className={cn(
                    "font-medium px-2 py-1 rounded text-sm",
                    activeBooking.entry_time ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                  )}>
                    {activeBooking.entry_time ? "Checked In" : "Not Checked In"}
                  </span>
                </div>
              </div>
              
              {timeRemaining <= 15 && (
                <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 w-full">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-yellow-800">Time is running out!</h5>
                      <p className="text-sm text-yellow-700">
                        Your parking time will expire soon. Please return to your vehicle.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {activeBooking.entry_time && !activeBooking.exit_time && (
                <div className="bg-green-50 border border-green-100 rounded-lg p-4 w-full">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-green-800">Don't forget to scan on exit!</h5>
                      <p className="text-sm text-green-700">
                        Remember to scan your QR code when leaving to avoid a 10 AED fine.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between pt-4 pb-6">
            <Button variant="outline" asChild>
              <Link to="/my-bookings">View All Bookings</Link>
            </Button>
            <Button variant="default" asChild>
              <Link to="/booking">Book Another Spot</Link>
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="bg-gray-100 rounded-full p-6 inline-block mb-4">
                <MapPin className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium mb-2">No Active Booking</h3>
              <p className="text-gray-500 mb-6">
                You don't have any active parking reservations at the moment.
              </p>
              <Button asChild>
                <Link to="/booking">Book a Spot Now</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ActiveBooking;

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
