
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

const Dashboard = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    availableSpots: 0,
    activeBooking: null,
    recentBookings: []
  });

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setStats({
        availableSpots: 45,
        activeBooking: null,
        recentBookings: []
      });
      setLoading(false);
    }, 500); // Reduced timeout for better UX

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-[250px]" />
          <Skeleton className="h-10 w-[120px]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-[180px] rounded-md" />
          <Skeleton className="h-[180px] rounded-md" />
          <Skeleton className="h-[180px] rounded-md" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {profile?.first_name || 'User'}!</h1>
          <p className="text-muted-foreground">
            Manage your parking bookings and find available spots.
          </p>
        </div>

        <Link to="/booking">
          <Button size="sm">Book a Spot</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Available Spots</CardTitle>
            <CardDescription>Parking spots currently available</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-spoton-primary">{stats.availableSpots}</div>
            <Link to="/booking" className="text-sm text-spoton-secondary hover:underline mt-2 block">
              Book a spot now →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Active Booking</CardTitle>
            <CardDescription>Your current active parking booking</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.activeBooking ? (
              <div>
                <p className="font-medium">{stats.activeBooking.spot}</p>
                <p className="text-sm text-muted-foreground">
                  {stats.activeBooking.date}, {stats.activeBooking.time}
                </p>
                <Link to="/active-booking" className="text-sm text-spoton-secondary hover:underline mt-2 block">
                  View booking →
                </Link>
              </div>
            ) : (
              <div>
                <p className="text-muted-foreground">No active booking</p>
                <Link to="/booking" className="text-sm text-spoton-secondary hover:underline mt-2 block">
                  Book a spot now →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Common parking tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
              <Link to="/booking" className="w-full text-left">
                Book a Spot
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Link to="/my-bookings" className="w-full text-left">
                View My Bookings
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Link to="/profile" className="w-full text-left">
                Edit My Profile
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Bookings</h2>
        {stats.recentBookings?.length > 0 ? (
          <div className="space-y-3">
            {stats.recentBookings.map((booking, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{booking.spot}</p>
                      <p className="text-sm text-muted-foreground">
                        {booking.date}, {booking.time}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link to={`/booking/${booking.id}`}>
                        <Button variant="outline" size="sm">View</Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-muted-foreground">No recent bookings found</p>
              <Link to="/booking">
                <Button variant="link" className="mt-2">Book your first spot</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
