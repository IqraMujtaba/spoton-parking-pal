
import { supabase } from '@/integrations/supabase/client';
import { ParkingSpot, Booking, BookingStatus, Notification } from '@/lib/types';
import QRCode from 'qrcode';

export async function fetchBuildings() {
  const { data, error } = await supabase
    .from('buildings')
    .select('*')
    .eq('is_active', true);
  
  if (error) throw error;
  return data;
}

export async function fetchSpotTypes() {
  const { data, error } = await supabase
    .from('spot_types')
    .select('*');
  
  if (error) throw error;
  return data;
}

export async function fetchParkingSpots(buildingId?: string) {
  let query = supabase
    .from('parking_spots')
    .select(`
      *,
      building:building_id(code, name),
      spot_type:spot_type_id(name, is_shaded)
    `)
    .eq('is_active', true);
  
  if (buildingId) {
    query = query.eq('building_id', buildingId);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data as ParkingSpot[];
}

export async function getAvailableSpots(
  buildingId: string,
  date: string,
  startTime: string,
  endTime: string
): Promise<ParkingSpot[]> {
  // First, get all spots in the building
  const spots = await fetchParkingSpots(buildingId);
  
  // Then, get all bookings for this time period
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('date', date)
    .in('status', ['active', 'completed'])
    .or(`start_time.lte.${endTime},end_time.gte.${startTime}`);
  
  if (error) throw error;
  
  // Mark spots as available/unavailable based on bookings
  return spots.map(spot => ({
    ...spot,
    isAvailable: !bookings.some(booking => 
      booking.spot_id === spot.id && 
      ((booking.start_time <= endTime && booking.end_time >= startTime))
    )
  }));
}

export async function createBooking(
  userId: string,
  spotId: string,
  date: string,
  startTime: string,
  endTime: string
): Promise<Booking> {
  // Generate a QR code for this booking
  const bookingData = { userId, spotId, date, startTime, endTime };
  const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(bookingData));
  
  const { data, error } = await supabase
    .from('bookings')
    .insert({
      user_id: userId,
      spot_id: spotId,
      date,
      start_time: startTime,
      end_time: endTime,
      qr_code: qrCodeDataUrl,
      status: 'active'
    })
    .select(`
      *,
      spot:spot_id(
        *,
        building:building_id(code, name),
        spot_type:spot_type_id(name, is_shaded)
      )
    `)
    .single();
  
  if (error) throw error;
  return data as BookingWithSpot;
}

export async function getUserBookings(userId: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      spot:spot_id(
        *,
        building:building_id(code, name),
        spot_type:spot_type_id(name, is_shaded)
      )
    `)
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .order('start_time', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function getActiveBooking(userId: string) {
  const today = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      spot:spot_id(
        *,
        building:building_id(code, name),
        spot_type:spot_type_id(name, is_shaded)
      )
    `)
    .eq('user_id', userId)
    .eq('date', today)
    .eq('status', 'active')
    .lte('start_time', currentTime)
    .gte('end_time', currentTime)
    .order('start_time', { ascending: true })
    .limit(1)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 means no rows returned
  return data || null;
}

export async function updateBookingStatus(
  bookingId: string, 
  status: BookingStatus,
  additionalData?: Partial<Booking>
) {
  const { data, error } = await supabase
    .from('bookings')
    .update({ 
      status,
      ...additionalData
    })
    .eq('id', bookingId)
    .select();
  
  if (error) throw error;
  return data;
}

export async function recordEntry(bookingId: string) {
  const entryTime = new Date().toISOString();
  return updateBookingStatus(bookingId, 'active', { entry_time: entryTime });
}

export async function recordExit(bookingId: string) {
  const exitTime = new Date().toISOString();
  return updateBookingStatus(bookingId, 'completed', { exit_time: exitTime });
}

export async function addFine(bookingId: string, amount: number = 10) {
  const { data, error } = await supabase
    .from('bookings')
    .update({ 
      status: 'fined',
      fine_amount: amount
    })
    .eq('id', bookingId)
    .select();
  
  if (error) throw error;
  
  // Create a notification about the fine
  const booking = data[0];
  if (booking) {
    await createNotification(
      booking.user_id,
      'Parking Fine',
      `You have been fined ${amount} AED for not exiting the parking properly.`,
      'fine'
    );
  }
  
  return data;
}

export async function getUserNotifications(userId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: 'info' | 'warning' | 'fine' | 'alert' = 'info'
) {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title,
      message,
      type
    })
    .select();
  
  if (error) throw error;
  return data;
}

export async function markNotificationAsRead(notificationId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .select();
  
  if (error) throw error;
  return data;
}

export async function subscribeToBookings(userId: string, callback: (booking: Booking) => void) {
  return supabase
    .channel('bookings-channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'bookings',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        callback(payload.new as Booking);
      }
    )
    .subscribe();
}

export async function subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
  return supabase
    .channel('notifications-channel')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        callback(payload.new as Notification);
      }
    )
    .subscribe();
}

export async function getAllBookings(
  status?: BookingStatus | BookingStatus[],
  date?: string,
) {
  let query = supabase
    .from('bookings')
    .select(`
      *,
      spot:spot_id(
        *,
        building:building_id(code, name),
        spot_type:spot_type_id(name, is_shaded)
      )
    `);
  
  if (status) {
    if (Array.isArray(status)) {
      query = query.in('status', status);
    } else {
      query = query.eq('status', status);
    }
  }
  
  if (date) {
    query = query.eq('date', date);
  }
  
  const { data, error } = await query.order('date', { ascending: false })
                                     .order('start_time', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function getDashboardStats() {
  const today = new Date().toISOString().split('T')[0];
  
  // Get all spots
  const { data: spots, error: spotsError } = await supabase
    .from('parking_spots')
    .select('id, building_id, spot_type_id')
    .eq('is_active', true);
  
  if (spotsError) throw spotsError;
  
  // Get active bookings for today
  const { data: activeBookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('spot_id')
    .eq('date', today)
    .eq('status', 'active');
  
  if (bookingsError) throw bookingsError;
  
  // Get buildings
  const { data: buildings, error: buildingsError } = await supabase
    .from('buildings')
    .select('*');
  
  if (buildingsError) throw buildingsError;
  
  // Get spot types
  const { data: spotTypes, error: typesError } = await supabase
    .from('spot_types')
    .select('*');
  
  if (typesError) throw typesError;
  
  // Calculate stats
  const buildingStats = buildings.map(building => {
    const buildingSpots = spots.filter(spot => spot.building_id === building.id);
    const occupiedSpots = activeBookings.filter(booking => 
      buildingSpots.some(spot => spot.id === booking.spot_id)
    );
    
    return {
      id: building.id,
      name: building.name,
      code: building.code,
      total: buildingSpots.length,
      occupied: occupiedSpots.length,
      available: buildingSpots.length - occupiedSpots.length
    };
  });
  
  // Spot type stats
  const typeStats = spotTypes.map(type => {
    const typeSpots = spots.filter(spot => spot.spot_type_id === type.id);
    const occupiedSpots = activeBookings.filter(booking => 
      typeSpots.some(spot => spot.id === booking.spot_id)
    );
    
    return {
      id: type.id,
      name: type.name,
      is_shaded: type.is_shaded,
      total: typeSpots.length,
      occupied: occupiedSpots.length,
      available: typeSpots.length - occupiedSpots.length
    };
  });
  
  return {
    total: spots.length,
    occupied: activeBookings.length,
    available: spots.length - activeBookings.length,
    buildings: buildingStats,
    types: typeStats
  };
}
