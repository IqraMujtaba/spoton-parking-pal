
export type BuildingId = 'J2-A' | 'J2-B' | 'J2-C';

export type ParkingSpotType = 'Regular' | 'Shaded' | 'Disabled Access';

export type BookingStatus = 'active' | 'completed' | 'cancelled' | 'expired' | 'fined';

export interface ParkingSpot {
  id: string;
  building_id: string;
  building?: {
    code: BuildingId;
    name: string;
  };
  spot_number: number;
  is_active: boolean;
  spot_type_id: string;
  spot_type?: {
    name: ParkingSpotType;
    is_shaded: boolean;
  };
  isAvailable?: boolean; // For client-side availability calculation
}

export interface Booking {
  id: string;
  user_id: string;
  spot_id: string;
  spot?: ParkingSpot;
  date: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  created_at: string;
  entry_time?: string;
  exit_time?: string;
  qr_code?: string;
  fine_amount?: number;
}

export interface BookingWithSpot extends Booking {
  spot: ParkingSpot;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  type: 'info' | 'warning' | 'fine' | 'alert';
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  user_role: 'admin' | 'student' | 'staff' | 'visitor';
}
