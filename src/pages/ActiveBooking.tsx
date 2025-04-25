import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { getActiveBooking } from '@/services/supabaseService';
import { BookingWithSpot, Booking } from '@/lib/types';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const ActiveBooking = () => {
  const { user } = useAuth();
  const [activeBooking, setActiveBooking] = useState<BookingWithSpot | null>(null);
  const [loading, setLoading] = useState(true);
  
  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), 'EEEE, MMMM dd, yyyy');
  };
  
  const formatTime = (timeString: string) => {
    return format(parseISO(`2000-01-01T${timeString}`), 'hh:mm a');
  };

  useEffect(() => {
    const setupFunctions = async () => {
      if (!user) return;
    };
    
    setupFunctions();
    
    const fetchActiveBooking = async () => {
      try {
        setLoading(true);
        if (!user) return;
        
        const booking = await getActiveBooking(user.id);
        if (booking) {
          setActiveBooking(booking as BookingWithSpot);
        }
      } catch (error) {
        console.error('Error fetching active booking:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchActiveBooking();
  }, [user]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!activeBooking) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Active Booking</h1>
          <p className="text-gray-500">View your active parking details</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-6">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Active Booking</h3>
              <p className="text-gray-500 mb-4">You don't have any active parking bookings for today.</p>
              <Button asChild>
                <Link to="/booking">Book a Spot Now</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Active Booking</h1>
        <p className="text-gray-500">View your active parking details</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Parking Details</CardTitle>
          <CardDescription>Your active parking booking</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            <span>{formatDate(activeBooking.date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-500" />
            <span>{formatTime(activeBooking.start_time)} - {formatTime(activeBooking.end_time)}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-gray-500" />
            <span>
              {activeBooking.spot?.building?.name}, Spot {activeBooking.spot?.spot_number}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActiveBooking;
