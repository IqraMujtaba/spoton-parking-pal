
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Clock, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Booking } from '@/lib/types';
import { getLocalBookings, removeLocalBooking } from '@/lib/parking';
import { toast } from 'sonner';
import { format, parseISO, isAfter } from 'date-fns';
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

const MyBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingToDelete, setBookingToDelete] = useState<string | null>(null);
  
  useEffect(() => {
    if (user) {
      loadBookings();
    }
  }, [user]);
  
  const loadBookings = () => {
    const allBookings = getLocalBookings();
    const userBookings = allBookings.filter(booking => booking.userId === user?.id);
    
    // Sort bookings by date and time
    userBookings.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.startTime}`);
      const dateB = new Date(`${b.date}T${b.startTime}`);
      return dateA.getTime() - dateB.getTime();
    });
    
    setBookings(userBookings);
  };
  
  const handleDeleteBooking = () => {
    if (!bookingToDelete) return;
    
    removeLocalBooking(bookingToDelete);
    setBookingToDelete(null);
    loadBookings();
    toast.success('Booking cancelled successfully!');
  };
  
  const formatDate = (dateString: string) => {
    const date = parseISO(dateString);
    return format(date, 'EEEE, MMMM d, yyyy');
  };
  
  const isPastBooking = (booking: Booking) => {
    const bookingEndDateTime = new Date(`${booking.date}T${booking.endTime}`);
    return !isAfter(bookingEndDateTime, new Date());
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Bookings</h1>
        <p className="text-gray-500">Manage your parking reservations</p>
      </div>
      
      {bookings.length > 0 ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {bookings.map((booking) => {
              const isPast = isPastBooking(booking);
              
              return (
                <Card key={booking.id} className={cn(isPast && "opacity-75")}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex justify-between items-start">
                      <span>Spot {booking.spotNumber}</span>
                      <span className={cn(
                        "text-xs px-2 py-1 rounded",
                        isPast ? "bg-gray-200 text-gray-700" : "bg-green-100 text-green-800"
                      )}>
                        {isPast ? "Past" : "Upcoming"}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-spoton-primary" />
                        <span className="text-sm">Building {booking.building}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-spoton-primary" />
                        <span className="text-sm">{formatDate(booking.date)}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-spoton-primary" />
                        <span className="text-sm">{booking.startTime} - {booking.endTime}</span>
                      </div>
                      
                      {!isPast && (
                        <Button 
                          variant="destructive"
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => setBookingToDelete(booking.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Cancel Booking
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
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
      ) : (
        <Card>
          <CardContent className="pt-6 pb-6">
            <div className="text-center py-8">
              <div className="flex justify-center mb-4">
                <Calendar className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">No Bookings Found</h3>
              <p className="text-gray-500 mb-4">You haven't made any parking reservations yet.</p>
              <Button onClick={() => window.location.href = '/booking'}>
                Book a Spot Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MyBookings;

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
