
import { BuildingId, ParkingSpot, Booking } from './types';

// Generate initial parking spots for each building
export const generateParkingSpots = (buildingId: BuildingId): ParkingSpot[] => {
  const spots: ParkingSpot[] = [];
  
  for (let i = 1; i <= 40; i++) {
    spots.push({
      id: `${buildingId}-${i}`,
      building: buildingId,
      spotNumber: i,
      isAvailable: true
    });
  }
  
  return spots;
};

// Check if a spot is available at a specific time
export const isSpotAvailable = (
  spotId: string,
  date: string,
  startTime: string,
  endTime: string,
  bookings: Booking[]
): boolean => {
  const relevantBookings = bookings.filter(
    booking => booking.spotId === spotId && booking.date === date
  );
  
  if (relevantBookings.length === 0) return true;
  
  const requestStart = new Date(`${date}T${startTime}`);
  const requestEnd = new Date(`${date}T${endTime}`);
  
  return !relevantBookings.some(booking => {
    const bookingStart = new Date(`${booking.date}T${booking.startTime}`);
    const bookingEnd = new Date(`${booking.date}T${booking.endTime}`);
    
    // Check if there's any overlap between the requested time and the booking
    return (
      (requestStart >= bookingStart && requestStart < bookingEnd) ||
      (requestEnd > bookingStart && requestEnd <= bookingEnd) ||
      (requestStart <= bookingStart && requestEnd >= bookingEnd)
    );
  });
};

// Get available spots for a building at a specific time
export const getAvailableSpots = (
  buildingId: BuildingId,
  date: string,
  startTime: string,
  endTime: string,
  bookings: Booking[]
): ParkingSpot[] => {
  const allSpots = generateParkingSpots(buildingId);
  
  return allSpots.map(spot => ({
    ...spot,
    isAvailable: isSpotAvailable(spot.id, date, startTime, endTime, bookings)
  }));
};

// Local storage helpers
export const getLocalBookings = (): Booking[] => {
  const stored = localStorage.getItem('spoton_bookings');
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error('Failed to parse bookings:', e);
    return [];
  }
};

export const saveLocalBooking = (booking: Booking) => {
  const bookings = getLocalBookings();
  bookings.push(booking);
  localStorage.setItem('spoton_bookings', JSON.stringify(bookings));
};

export const removeLocalBooking = (bookingId: string) => {
  const bookings = getLocalBookings();
  const filtered = bookings.filter(b => b.id !== bookingId);
  localStorage.setItem('spoton_bookings', JSON.stringify(filtered));
};
