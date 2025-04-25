
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getAllBookings, getDashboardStats } from '@/services/supabaseService';
import { BookingWithSpot } from '@/lib/types';

const AdminDashboard = () => {
  const [bookings, setBookings] = useState<BookingWithSpot[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    occupied: 0,
    available: 0,
    buildings: [],
    types: []
  });
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<DateRange | undefined>(undefined);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all active and completed bookings
        const bookingsData = await getAllBookings(['active', 'completed']);
        setBookings(bookingsData as BookingWithSpot[]);
        
        // Fetch stats
        const statsData = await getDashboardStats();
        setStats(statsData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDateChange = async (date: DateRange | undefined) => {
    setDate(date);
    
    if (!date?.from) {
      // If no date is selected, fetch all active and completed bookings
      const bookingsData = await getAllBookings(['active', 'completed']);
      setBookings(bookingsData as BookingWithSpot[]);
      return;
    }
    
    const formattedDate = date.from ? format(date.from, 'yyyy-MM-dd') : '';
    
    try {
      const bookingsData = await getAllBookings(['active', 'completed'], formattedDate);
      setBookings(bookingsData as BookingWithSpot[]);
    } catch (error) {
      console.error('Error fetching bookings data:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-500">Manage parking and user data</p>
      </div>
      
      {/* Date Picker */}
      <div className="flex items-center space-x-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[300px] justify-start text-left font-normal",
                !date?.from && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  `${format(date.from, "MMM dd, yyyy")} - ${format(date.to, "MMM dd, yyyy")}`
                ) : (
                  format(date.from, "MMM dd, yyyy")
                )
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
            <Calendar
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={handleDateChange}
              disabled={{ from: new Date(1900, 1, 1) }}
              numberOfMonths={2}
              pagedNavigation
            />
          </PopoverContent>
        </Popover>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center">
          <span className="loading loading-spinner text-primary"></span>
        </div>
      ) : (
        <>
          {/* Overview Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Spots</CardTitle>
                <CardDescription>All parking spots</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-spoton-primary">
                  {stats.total}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Occupied Spots</CardTitle>
                <CardDescription>Currently booked spots</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-spoton-secondary">
                  {stats.occupied}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Available Spots</CardTitle>
                <CardDescription>Unbooked parking spots</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-500">
                  {stats.available}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Building Status */}
          <h2 className="text-xl font-semibold mt-8">Building Status</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {stats.buildings.map((building) => (
              <Card key={building.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Building {building.code}</CardTitle>
                  <CardDescription>Current availability</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">
                      {building.available}
                      <span className="text-base font-normal text-gray-500"> / {building.total}</span>
                    </div>
                    <div 
                      className={`rounded-full w-3 h-3 ${
                        building.available > 10 ? 'bg-spoton-accent animate-pulse' : 
                        building.available > 0 ? 'bg-yellow-400' : 'bg-spoton-booked'
                      }`}
                    />
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-gray-200">
                    <div 
                      className={`h-2 rounded-full ${
                        building.available > 10 ? 'bg-spoton-accent' : 
                        building.available > 0 ? 'bg-yellow-400' : 'bg-spoton-booked'
                      }`} 
                      style={{ width: `${(building.available / building.total) * 100}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Spot Type Status */}
          <h2 className="text-xl font-semibold mt-8">Spot Type Status</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {stats.types.map((type) => (
              <Card key={type.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{type.name} Spots</CardTitle>
                  <CardDescription>Current availability</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">
                      {type.available}
                      <span className="text-base font-normal text-gray-500"> / {type.total}</span>
                    </div>
                    <div 
                      className={`rounded-full w-3 h-3 ${
                        type.available > 10 ? 'bg-spoton-accent animate-pulse' : 
                        type.available > 0 ? 'bg-yellow-400' : 'bg-spoton-booked'
                      }`}
                    />
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-gray-200">
                    <div 
                      className={`h-2 rounded-full ${
                        type.available > 10 ? 'bg-spoton-accent' : 
                        type.available > 0 ? 'bg-yellow-400' : 'bg-spoton-booked'
                      }`} 
                      style={{ width: `${(type.available / type.total) * 100}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Recent Bookings */}
          <h2 className="text-xl font-semibold mt-8">Recent Bookings</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Spot
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {booking.user_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {booking.spot?.building?.code} - {booking.spot?.spot_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {booking.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {booking.start_time} - {booking.end_time}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {booking.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export default AdminDashboard;
