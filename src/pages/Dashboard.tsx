
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { getLocalBookings } from '@/lib/parking';
import { Booking } from '@/lib/types';
import { Calendar, CheckSquare, MapPin } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [buildingStats, setBuildingStats] = useState({
    'J2-A': { total: 40, available: 40 },
    'J2-B': { total: 40, available: 40 },
    'J2-C': { total: 40, available: 40 }
  });

  useEffect(() => {
    // Load user bookings
    if (user) {
      const allBookings = getLocalBookings();
      const userBookings = allBookings.filter(booking => booking.userId === user.id);
      setMyBookings(userBookings);
      
      // Calculate building stats
      const today = new Date().toISOString().split('T')[0];
      const currentTime = new Date().toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // Simple count of bookings per building
      const bookingsToday = allBookings.filter(
        booking => booking.date === today && booking.startTime <= currentTime && booking.endTime >= currentTime
      );
      
      const stats = {
        'J2-A': { total: 40, available: 40 - bookingsToday.filter(b => b.building === 'J2-A').length },
        'J2-B': { total: 40, available: 40 - bookingsToday.filter(b => b.building === 'J2-B').length },
        'J2-C': { total: 40, available: 40 - bookingsToday.filter(b => b.building === 'J2-C').length }
      };
      
      setBuildingStats(stats);
    }
  }, [user]);

  const getUpcomingBooking = () => {
    if (myBookings.length === 0) return null;
    
    const now = new Date();
    const upcoming = myBookings
      .filter(booking => {
        const bookingDateTime = new Date(`${booking.date}T${booking.startTime}`);
        return bookingDateTime > now;
      })
      .sort((a, b) => {
        const dateTimeA = new Date(`${a.date}T${a.startTime}`);
        const dateTimeB = new Date(`${b.date}T${b.startTime}`);
        return dateTimeA.getTime() - dateTimeB.getTime();
      });
    
    return upcoming[0] || null;
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const upcomingBooking = getUpcomingBooking();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-500">Welcome back, {user?.full_name || 'User'}</p>
      </div>
      
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Available Spots</CardTitle>
            <CardDescription>Current availability</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-spoton-primary">
              {buildingStats['J2-A'].available + buildingStats['J2-B'].available + buildingStats['J2-C'].available}
              <span className="text-base font-normal text-gray-500"> / 120</span>
            </div>
          </CardContent>
          <CardFooter>
            <Link to="/booking">
              <Button variant="outline" size="sm">Book Now</Button>
            </Link>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">My Bookings</CardTitle>
            <CardDescription>Your parking reservations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-spoton-secondary">
              {myBookings.length}
            </div>
          </CardContent>
          <CardFooter>
            <Link to="/my-bookings">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">User Type</CardTitle>
            <CardDescription>Your access level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize text-gray-800">
              {user?.user_type}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Building Status */}
      <h2 className="text-xl font-semibold mt-8">Building Status</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {Object.entries(buildingStats).map(([building, stats]) => (
          <Card key={building}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Building {building}</CardTitle>
              <CardDescription>Current availability</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">
                  {stats.available}
                  <span className="text-base font-normal text-gray-500"> / {stats.total}</span>
                </div>
                <div 
                  className={`rounded-full w-3 h-3 ${
                    stats.available > 10 ? 'bg-spoton-accent animate-pulse' : 
                    stats.available > 0 ? 'bg-yellow-400' : 'bg-spoton-booked'
                  }`}
                />
              </div>
              <div className="mt-2 h-2 rounded-full bg-gray-200">
                <div 
                  className={`h-2 rounded-full ${
                    stats.available > 10 ? 'bg-spoton-accent' : 
                    stats.available > 0 ? 'bg-yellow-400' : 'bg-spoton-booked'
                  }`} 
                  style={{ width: `${(stats.available / stats.total) * 100}%` }}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Link to={`/booking?building=${building}`}>
                <Button variant="outline" size="sm">Select</Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      {/* Upcoming Booking */}
      <h2 className="text-xl font-semibold mt-8">Upcoming Booking</h2>
      {upcomingBooking ? (
        <Card>
          <CardHeader>
            <CardTitle>Your Next Parking</CardTitle>
            <CardDescription>Details for your upcoming booking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-spoton-primary" />
                <span>{formatDate(upcomingBooking.date)}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-spoton-primary" />
                <span>Building {upcomingBooking.building}, Spot {upcomingBooking.spotNumber}</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-spoton-primary" />
                <span>{upcomingBooking.startTime} - {upcomingBooking.endTime}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Link to="/my-bookings">
              <Button variant="outline">Manage Booking</Button>
            </Link>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-6">
              <div className="flex justify-center mb-4">
                <Calendar className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">No Upcoming Bookings</h3>
              <p className="text-gray-500 mb-4">You don't have any parking spots booked.</p>
              <Link to="/booking">
                <Button>Book a Spot Now</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;

const Clock = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  );
};
