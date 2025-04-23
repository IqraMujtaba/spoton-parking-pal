
export type BuildingId = 'J2-A' | 'J2-B' | 'J2-C';

export type ParkingSpot = {
  id: string;
  building: BuildingId;
  spotNumber: number;
  isAvailable: boolean;
};

export type Booking = {
  id: string;
  userId: string;
  spotId: string;
  building: BuildingId;
  spotNumber: number;
  date: string;
  startTime: string;
  endTime: string;
  createdAt: string;
};

export type User = {
  id: string;
  email: string;
  full_name?: string;
  user_type: 'student' | 'staff';
};
