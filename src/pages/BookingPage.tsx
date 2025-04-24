
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, Clock, MapPin } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { BuildingId, ParkingSpot } from '@/lib/types';
import { toast } from 'sonner';
import { 
  fetchBuildings, 
  fetchParkingSpots, 
  getAvailableSpots,
  createBooking
} from '@/services/supabaseService';

const BookingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Extract building from URL params if available
  const searchParams = new URLSearchParams(location.search);
  const initialBuilding = searchParams.get('building') as BuildingId | null;
  
  // State variables
  const [buildings, setBuildings] = useState<any[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingId | null>(initialBuilding || null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('10:00');
  const [parkingSpots, setParkingSpots] = useState<ParkingSpot[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Get buildings on component mount
  useEffect(() => {
    const loadBuildings = async () => {
      try {
        const buildingsData = await fetchBuildings();
        setBuildings(buildingsData);
        
        // If initialBuilding is set, find the corresponding building ID
        if (initialBuilding) {
          const building = buildingsData.find(b => b.code === initialBuilding);
          if (building) {
            setSelectedBuildingId(building.id);
          }
        }
      } catch (error) {
        console.error('Error loading buildings:', error);
        toast.error('Failed to load buildings');
      }
    };
    
    loadBuildings();
  }, [initialBuilding]);
  
  // Generate time options
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 8; hour < 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const h = hour.toString().padStart(2, '0');
        const m = minute.toString().padStart(2, '0');
        options.push(`${h}:${m}`);
      }
    }
    return options;
  };
  
  const timeOptions = generateTimeOptions();
  
  // Update available spots when selection changes
  useEffect(() => {
    const updateAvailableSpots = async () => {
      if (selectedBuildingId && selectedDate) {
        try {
          setLoading(true);
          const formattedDate = format(selectedDate, 'yyyy-MM-dd');
          const spots = await getAvailableSpots(
            selectedBuildingId,
            formattedDate,
            startTime,
            endTime
          );
          setParkingSpots(spots);
          setSelectedSpot(null);
        } catch (error) {
          console.error('Error getting available spots:', error);
          toast.error('Failed to get available spots');
        } finally {
          setLoading(false);
        }
      }
    };
    
    updateAvailableSpots();
  }, [selectedBuildingId, selectedDate, startTime, endTime]);
  
  // Handle building selection
  const handleBuildingChange = (buildingId: string) => {
    setSelectedBuildingId(buildingId);
    const selected = buildings.find(b => b.id === buildingId);
    if (selected) {
      setSelectedBuilding(selected.code as BuildingId);
    }
  };
  
  // Handle spot selection
  const handleSpotClick = (spot: ParkingSpot) => {
    if (!spot.isAvailable) return;
    setSelectedSpot(spot);
  };
  
  // Handle booking submission
  const handleBooking = async () => {
    if (!user || !selectedBuildingId || !selectedSpot) return;
    
    try {
      setLoading(true);
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      await createBooking(
        user.id,
        selectedSpot.id,
        formattedDate,
        startTime,
        endTime
      );
      
      toast.success('Parking spot booked successfully!');
      navigate('/my-bookings');
    } catch (error: any) {
      console.error('Error booking spot:', error);
      toast.error(error.message || 'Failed to book parking spot');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Book a Parking Spot</h1>
        <p className="text-gray-500">Select a building, date, time, and spot to book your parking</p>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Building Selection */}
            <div className="space-y-2">
              <Label>Building</Label>
              <Select 
                value={selectedBuildingId || undefined}
                onValueChange={handleBuildingChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Building" />
                </SelectTrigger>
                <SelectContent>
                  {buildings.map(building => (
                    <SelectItem key={building.id} value={building.id}>
                      {building.name} ({building.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Selection */}
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 pointer-events-auto">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Start Time Selection */}
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Select 
                value={startTime}
                onValueChange={(value) => {
                  setStartTime(value);
                  // Ensure end time is after start time
                  if (value >= endTime) {
                    const startIdx = timeOptions.findIndex(t => t === value);
                    if (startIdx < timeOptions.length - 1) {
                      setEndTime(timeOptions[startIdx + 1]);
                    }
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* End Time Selection */}
            <div className="space-y-2">
              <Label>End Time</Label>
              <Select 
                value={endTime}
                onValueChange={setEndTime}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions
                    .filter(time => time > startTime)
                    .map((time) => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Summary of selection */}
          {selectedBuilding && (
            <div className="mt-6 p-4 bg-gray-50 rounded-md">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-spoton-primary" />
                  <span>Building {selectedBuilding}</span>
                </div>
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2 text-spoton-primary" />
                  <span>{format(selectedDate, 'PPP')}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-spoton-primary" />
                  <span>{startTime} - {endTime}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Parking Map */}
      {selectedBuildingId && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Select a Parking Spot</h2>
          
          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-spoton-primary"></div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-5 gap-4 justify-center">
                    {/* Legend */}
                    <div className="col-span-5 flex items-center justify-center space-x-8 mb-4">
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-spoton-accent rounded mr-2"></div>
                        <span className="text-sm">Available</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-spoton-booked rounded mr-2"></div>
                        <span className="text-sm">Booked</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-spoton-primary rounded mr-2"></div>
                        <span className="text-sm">Selected</span>
                      </div>
                    </div>
                    
                    {/* Parking Spots */}
                    {parkingSpots.length > 0 ? (
                      parkingSpots.map((spot) => (
                        <div
                          key={spot.id}
                          className={cn(
                            "parking-spot aspect-square flex items-center justify-center rounded-md text-white font-semibold cursor-pointer",
                            spot.isAvailable
                              ? selectedSpot?.id === spot.id
                                ? "bg-spoton-primary"
                                : "bg-spoton-accent hover:bg-spoton-hover"
                              : "bg-spoton-booked cursor-not-allowed opacity-70"
                          )}
                          onClick={() => handleSpotClick(spot)}
                        >
                          {spot.spot_number}
                        </div>
                      ))
                    ) : (
                      <div className="col-span-5 text-center py-8 text-gray-500">
                        No parking spots available. Please select a different building or time.
                      </div>
                    )}
                  </div>
                  
                  {/* Booking Button */}
                  <div className="mt-8 flex justify-center">
                    <Button
                      size="lg"
                      disabled={!selectedSpot || loading}
                      onClick={handleBooking}
                    >
                      {loading ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          Processing...
                        </>
                      ) : (
                        'Book This Spot'
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default BookingPage;
