
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { getDashboardStats, getAllBookings } from '@/services/supabaseService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BookingWithSpot } from '@/lib/types';
import { format, parseISO } from 'date-fns';

const AdminDashboard = () => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const [parkingStats, setParkingStats] = useState<any>(null);
  const [recentBookings, setRecentBookings] = useState<BookingWithSpot[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  
  // Redirect non-admin users
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setStatsLoading(true);
        
        // Load statistics
        const stats = await getDashboardStats();
        setParkingStats(stats);
        
        // Load recent bookings
        const bookings = await getAllBookings(undefined, new Date().toISOString().split('T')[0]);
        setRecentBookings(bookings.slice(0, 10)); // Get the first 10 bookings
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setStatsLoading(false);
      }
    };
    
    loadDashboardData();
    
    // Refresh data every minute
    const interval = setInterval(loadDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);
  
  // Prepare data for charts
  const prepareBuildingChartData = () => {
    if (!parkingStats) return [];
    return parkingStats.buildings.map((building: any) => ({
      name: building.code,
      Available: building.available,
      Occupied: building.occupied,
    }));
  };
  
  const prepareTypeChartData = () => {
    if (!parkingStats) return [];
    return parkingStats.types.map((type: any) => ({
      name: type.name,
      value: type.occupied,
      color: type.name === 'Shaded' ? '#8884d8' : type.name === 'Regular' ? '#82ca9d' : '#ffc658',
    }));
  };
  
  const buildingChartData = prepareBuildingChartData();
  const typeChartData = prepareTypeChartData();
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042'];
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-500">Monitor and manage parking system</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          Array(4).fill(0).map((_, i) => (
            <Card key={i} className="h-28 animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
              </CardContent>
            </Card>
          ))
        ) : parkingStats ? (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Spots</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{parkingStats.total}</div>
                <p className="text-xs text-muted-foreground">
                  {parkingStats.available} available ({Math.round((parkingStats.available / parkingStats.total) * 100)}%)
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Occupied Spots</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{parkingStats.occupied}</div>
                <p className="text-xs text-muted-foreground">
                  {Math.round((parkingStats.occupied / parkingStats.total) * 100)}% occupancy rate
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Shaded Spots</CardTitle>
              </CardHeader>
              <CardContent>
                {parkingStats.types.find((t: any) => t.name === 'Shaded') ? (
                  <>
                    <div className="text-2xl font-bold">
                      {parkingStats.types.find((t: any) => t.name === 'Shaded').occupied}/
                      {parkingStats.types.find((t: any) => t.name === 'Shaded').total}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {Math.round((parkingStats.types.find((t: any) => t.name === 'Shaded').occupied / 
                        parkingStats.types.find((t: any) => t.name === 'Shaded').total) * 100)}% occupied
                    </p>
                  </>
                ) : (
                  <div className="text-2xl font-bold">0/0</div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Regular Spots</CardTitle>
              </CardHeader>
              <CardContent>
                {parkingStats.types.find((t: any) => t.name === 'Regular') ? (
                  <>
                    <div className="text-2xl font-bold">
                      {parkingStats.types.find((t: any) => t.name === 'Regular').occupied}/
                      {parkingStats.types.find((t: any) => t.name === 'Regular').total}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {Math.round((parkingStats.types.find((t: any) => t.name === 'Regular').occupied / 
                        parkingStats.types.find((t: any) => t.name === 'Regular').total) * 100)}% occupied
                    </p>
                  </>
                ) : (
                  <div className="text-2xl font-bold">0/0</div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="p-6">
              <p>Failed to load statistics</p>
            </CardContent>
          </Card>
        )}
      </div>
      
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Building Occupancy</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                {statsLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={buildingChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Available" fill="#82ca9d" />
                      <Bar dataKey="Occupied" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Spot Type Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                {statsLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={typeChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {typeChartData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Recent Bookings</CardTitle>
                <CardDescription>Today's latest reservations</CardDescription>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="space-y-2">
                    {Array(5).fill(0).map((_, i) => (
                      <div key={i} className="h-12 bg-gray-100 animate-pulse rounded"></div>
                    ))}
                  </div>
                ) : recentBookings.length > 0 ? (
                  <div className="space-y-2">
                    {recentBookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-2 border-b">
                        <div className="flex flex-col">
                          <span className="font-medium">Building {booking.spot?.building?.code}, Spot {booking.spot?.spot_number}</span>
                          <span className="text-sm text-gray-500">
                            {format(parseISO(booking.date), 'MMM d')} • {booking.start_time}-{booking.end_time}
                          </span>
                        </div>
                        <div className={cn(
                          "text-xs px-2 py-1 rounded",
                          booking.status === 'active' ? "bg-green-100 text-green-800" : 
                          booking.status === 'completed' ? "bg-blue-100 text-blue-800" :
                          booking.status === 'cancelled' ? "bg-gray-100 text-gray-800" :
                          booking.status === 'fined' ? "bg-red-100 text-red-800" :
                          "bg-yellow-100 text-yellow-800"
                        )}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-4 text-gray-500">No bookings found for today</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="bookings">
          <BookingsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Create a separate component for the bookings management page
const BookingsManager = () => {
  const [bookings, setBookings] = useState<BookingWithSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  
  useEffect(() => {
    const loadBookings = async () => {
      try {
        setLoading(true);
        let statusFilter;
        
        switch(filter) {
          case 'active':
            statusFilter = ['active'];
            break;
          case 'completed':
            statusFilter = ['completed'];
            break;
          case 'cancelled':
            statusFilter = ['cancelled'];
            break;
          case 'fined':
            statusFilter = ['fined'];
            break;
          default:
            statusFilter = undefined;
            break;
        }
        
        const data = await getAllBookings(statusFilter);
        setBookings(data);
      } catch (error) {
        console.error('Error loading bookings:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadBookings();
  }, [filter]);
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>All Bookings</CardTitle>
          <div className="flex gap-2">
            <select 
              className="bg-transparent border rounded px-2 py-1 text-sm"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Bookings</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="fined">Fined</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : bookings.length > 0 ? (
          <div className="overflow-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Date</th>
                  <th className="text-left py-2 px-2">Time</th>
                  <th className="text-left py-2 px-2">Building</th>
                  <th className="text-left py-2 px-2">Spot</th>
                  <th className="text-left py-2 px-2">Status</th>
                  <th className="text-left py-2 px-2">Fine</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id} className="border-b">
                    <td className="py-2 px-2">{format(parseISO(booking.date), 'MMM d, yyyy')}</td>
                    <td className="py-2 px-2">{booking.start_time}-{booking.end_time}</td>
                    <td className="py-2 px-2">{booking.spot?.building?.code}</td>
                    <td className="py-2 px-2">{booking.spot?.spot_number}</td>
                    <td className="py-2 px-2">
                      <span className={cn(
                        "text-xs px-2 py-1 rounded",
                        booking.status === 'active' ? "bg-green-100 text-green-800" : 
                        booking.status === 'completed' ? "bg-blue-100 text-blue-800" :
                        booking.status === 'cancelled' ? "bg-gray-100 text-gray-800" :
                        booking.status === 'fined' ? "bg-red-100 text-red-800" :
                        "bg-yellow-100 text-yellow-800"
                      )}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      {booking.fine_amount && booking.fine_amount > 0 ? 
                       `${booking.fine_amount} AED` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No bookings found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export default AdminDashboard;
