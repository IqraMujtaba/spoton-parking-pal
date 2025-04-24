
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Clock, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { BookingWithSpot, BookingStatus } from '@/lib/types';
import { toast } from 'sonner';
import { format, parseISO, isAfter } from 'date-fns';
import {
  getUserBookings,
  updateBookingStatus,
  subscribeToBookings
} from '@/services/supabaseService';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Link } from 'react-router-dom';

const MyBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingWithSpot[]>([]);
  const [bookingToDelete, setBookingToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!user) return;
    
    // Load bookings initially
    const loadBookings = async () => {
      try {
        setLoading(true);
        const userBookings = await getUserBookings(user.id);
        setBookings(userBookings);
      } catch (error) {
        console.error('Error loading bookings:', error);
        toast.error('Failed to load bookings');
      } finally {
        setLoading(false);
      }
    };
    
    loadBookings();
    
    // Subscribe to booking updates
    const subscribeToBookingUpdates = async () => {
      const subscription = await subscribeToBookings(user.id, () => {
        // Reload bookings when changes occur
        loadBookings();
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
  
  const handleDeleteBooking = async () => {
    if (!bookingToDelete) return;
    
    try {
      await updateBookingStatus(bookingToDelete, 'cancelled');
      setBookingToDelete(null);
      toast.success('Booking cancelled successfully!');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Failed to cancel booking');
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = parseISO(dateString);
    return format(date, 'EEEE, MMMM d, yyyy');
  };
  
  const isPastBooking = (booking: BookingWithSpot) => {
    if (booking.status === 'completed' || booking.status === 'expired' || booking.status === 'cancelled') {
      return true;
    }
    
    const bookingDate = parseISO(booking.date);
    const bookingEndTime = booking.end_time.split(':').map(Number);
    
    const endDateTime = new Date(
      bookingDate.getFullYear(),
      bookingDate.getMonth(),
      bookingDate.getDate(),
      bookingEndTime[0],
      bookingEndTime[1]
    );
    
    return !isAfter(endDateTime, new Date());
  };
  
  // Group bookings into active and past
  const activeBookings = bookings.filter(booking => 
    !isPastBooking(booking) && booking.status === 'active'
  );
  
  const pastBookings = bookings.filter(booking => 
    isPastBooking(booking) || booking.status !== 'active'
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">My Bookings</h1>
          <p className="text-gray-500">Manage your parking reservations</p>
        </div>
        <Button asChild>
          <Link to="/active-booking">View Active Booking</Link>
        </Button>
      </div>
      
      {loading ? (
        <Card>
          <CardContent className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-spoton-primary"></div>
          </CardContent>
        </Card>
      ) : bookings.length > 0 ? (
        <div className="space-y-6">
          {/* Active Bookings */}
          {activeBookings.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Active Reservations</h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {activeBookings.map((booking) => (
                  <BookingCard 
                    key={booking.id} 
                    booking={booking} 
                    onCancel={() => setBookingToDelete(booking.id)}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Past Bookings */}
          {pastBookings.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Past Reservations</h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {pastBookings.map((booking) => (
                  <BookingCard 
                    key={booking.id} 
                    booking={booking} 
                    onCancel={null}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 pb-6">
            <div className="text-center py-8">
              <div className="flex justify-center mb-4">
                <Calendar className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">No Bookings Found</h3>
              <p className="text-gray-500 mb-4">You haven't made any parking reservations yet.</p>
              <Button asChild>
                <Link to="/booking">Book a Spot Now</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      <AlertDialog open={!!bookingToDelete} onOpenChange={() => setBookingToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this booking? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, keep it</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBooking}>
              Yes, cancel booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Booking card component
const BookingCard = ({ 
  booking, 
  onCancel 
}: { 
  booking: BookingWithSpot, 
  onCancel: (() => void) | null
}) => {
  const isPast = isPastBooking(booking);
  
  const getStatusDisplay = (status: BookingStatus) => {
    switch(status) {
      case 'active':
        return { text: "Active", className: "bg-green-100 text-green-800" };
      case 'completed':
        return { text: "Completed", className: "bg-blue-100 text-blue-800" };
      case 'cancelled':
        return { text: "Cancelled", className: "bg-gray-100 text-gray-800" };
      case 'expired':
        return { text: "Expired", className: "bg-yellow-100 text-yellow-800" };
      case 'fined':
        return { text: "Fined", className: "bg-red-100 text-red-800" };
      default:
        return { text: status, className: "bg-gray-100 text-gray-800" };
    }
  };
  
  const statusDisplay = getStatusDisplay(booking.status);
  
  return (
    <Card className={cn(isPast && "opacity-75")}>
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-start">
          <span>Spot {booking.spot?.spot_number}</span>
          <span className={cn(
            "text-xs px-2 py-1 rounded",
            statusDisplay.className
          )}>
            {statusDisplay.text}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-spoton-primary" />
            <span className="text-sm">
              Building {booking.spot?.building?.code}
              {booking.spot?.spot_type?.is_shaded && " (Shaded)"}
            </span>
          </div>
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-spoton-primary" />
            <span className="text-sm">{formatDate(booking.date)}</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-spoton-primary" />
            <span className="text-sm">{booking.start_time} - {booking.end_time}</span>
          </div>
          
          {booking.fine_amount && booking.fine_amount > 0 && (
            <div className="bg-red-50 border border-red-100 rounded p-2 mt-2">
              <p className="text-sm text-red-700 font-medium">
                Fine: {booking.fine_amount} AED
              </p>
            </div>
          )}
          
          {onCancel && !isPast && (
            <Button 
              variant="destructive"
              size="sm"
              className="w-full mt-2"
              onClick={onCancel}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Cancel Booking
            </Button>
          )}
          
          {booking.status === 'active' && !isPast && (
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              asChild
            >
              <Link to="/active-booking">View Details</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

function formatDate(dateString: string) {
  const date = parseISO(dateString);
  return format(date, 'EEEE, MMMM d, yyyy');
}

function isPastBooking(booking: BookingWithSpot) {
  if (booking.status === 'completed' || booking.status === 'expired' || booking.status === 'cancelled') {
    return true;
  }
  
  const bookingDate = parseISO(booking.date);
  const bookingEndTime = booking.end_time.split(':').map(Number);
  
  const endDateTime = new Date(
    bookingDate.getFullYear(),
    bookingDate.getMonth(),
    bookingDate.getDate(),
    bookingEndTime[0],
    bookingEndTime[1]
  );
  
  return !isAfter(endDateTime, new Date());
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export default MyBookings;
