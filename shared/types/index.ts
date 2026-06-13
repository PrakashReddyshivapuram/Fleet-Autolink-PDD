export type UserRole = "admin" | "driver" | "mechanic" | "owner";

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  assignedVehicleId?: string;
  createdAt: string;
}

export type VehicleStatus = "active" | "maintenance" | "idle" | "retired";
export type VehicleType = "car" | "truck" | "bike" | "van" | "other";

export interface Vehicle {
  vehicleId: string;
  make: string;
  model: string;
  year: string;
  plateNumber: string;
  type: VehicleType;
  status: VehicleStatus;
  ownerId: string;
  assignedDriverId?: string;
  createdAt: string;
}

export type JobStatus = "pending" | "in_progress" | "completed" | "cancelled";

export interface MaintenanceJob {
  jobId: string;
  vehicleId: string;
  assignedMechanicId?: string;
  title: string;
  description: string;
  status: JobStatus;
  scheduledAt: string;
  completedAt?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export type TripStatus = "active" | "ended";

export interface Trip {
  tripId: string;
  vehicleId: string;
  driverId: string;
  status: TripStatus;
  startedAt: string;
  endedAt?: string;
  startLat?: number;
  startLng?: number;
}

export interface LiveLocation {
  lat: number;
  lng: number;
  driverId: string;
  vehicleId: string;
  timestamp: number;
  tripId?: string;
}
